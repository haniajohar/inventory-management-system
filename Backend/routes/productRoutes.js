// Backend\routes\productRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../config/db.js'); // Your mysql2/promise pool
const protect = require('../middlewares/authMiddleware');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const emailConfig = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
};

const transporter = nodemailer.createTransport(emailConfig);

// Save business info (Protected)
router.post('/save-business-info', protect, async (req, res) => {
    console.log('Save business info request received:', req.body);
    const { business_type, track_expiry, track_stock, track_report } = req.body;
    const user_id = req.user.id;
    console.log('User ID extracted from token:', user_id);

    if (!user_id) {
        console.error('save-business-info: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        console.log('Attempting to select business info...');
        const [rows] = await connection.query(
            'SELECT * FROM business_info WHERE user_id = ?',
            [user_id]
        );
        console.log('Business info select query executed. Results:', rows);

        if (rows && rows.length > 0) {
            const updateQuery = `UPDATE business_info
                                 SET business_type = ?, track_expiry = ?, track_stock = ?, track_report = ?
                                 WHERE user_id = ?`;

            console.log('Executing UPDATE query...');
            const [updateResult] = await connection.query(
                updateQuery,
                [business_type, track_expiry ? 1 : 0, track_stock ? 1 : 0, track_report ? 1 : 0, user_id]
            );
            console.log('Business info updated successfully:', updateResult);
            return res.status(200).json({ message: 'Business info updated successfully' });
        } else {
            const insertQuery = `INSERT INTO business_info (user_id, business_type, track_expiry, track_stock, track_report)
                                 VALUES (?, ?, ?, ?, ?)`;

            console.log('Executing INSERT query...');
            const [insertResult] = await connection.query(
                insertQuery,
                [user_id, business_type, track_expiry ? 1 : 0, track_stock ? 1 : 0, track_report ? 1 : 0]
            );
            console.log('Business info saved successfully:', insertResult);
            return res.status(201).json({ message: 'Business info saved successfully' });
        }
    } catch (error) {
        console.error('Database operation error in save-business-info:', error);
        return res.status(500).json({ error: 'Database operation failed.', details: error.message });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released.');
    }
});

// Add new product (includes cost_price)
router.post('/add', protect, async (req, res) => {
    console.log('Add product request received:', req.body);
    const { product_name, quantity, unit, expiry_date, cost_price } = req.body;
    const user_id = req.user.id;

    if (!user_id) {
        console.error('Add product: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    if (!product_name || !quantity || !unit) {
        return res.status(400).json({ error: 'Missing required fields: product_name, quantity, or unit' });
    }

    const query = 'INSERT INTO products (user_id, product_name, quantity, unit, expiry_date, cost_price) VALUES (?, ?, ?, ?, ?, ?)';

    let connection;
    try {
        connection = await db.getConnection();

        const [results] = await connection.query(
            query,
            [user_id, product_name, quantity, unit, expiry_date || null, cost_price || null]
        );

        console.log('Product added successfully to DB. Insert ID:', results.insertId);

        return res.status(201).json({
            message: 'Product added successfully',
            id: results.insertId,
            product_id: results.insertId,
            product: {
                id: results.insertId,
                user_id,
                product_name,
                quantity,
                unit,
                expiry_date: expiry_date || null,
                cost_price: cost_price || null
            }
        });

    } catch (error) {
        console.error('Error adding product:', error);
        return res.status(500).json({
            error: 'Failed to add product due to a database error.',
            details: error.message,
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /add product.');
    }
});

// Update a product (Frontend calls this endpoint)
router.put('/update/:id', protect, async (req, res) => {
    console.log('Update product request received for ID:', req.params.id);
    console.log('Update data:', req.body);

    const { id } = req.params;
    const user_id = req.user.id;
    const { product_name, quantity, unit, expiry_date, cost_price } = req.body;

    if (!user_id) {
        console.error('Update product: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    if (!product_name || !quantity || !unit) {
        return res.status(400).json({ error: 'Missing required fields: product_name, quantity, or unit' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        const [checkResults] = await connection.query(
            'SELECT * FROM products WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (checkResults.length === 0) {
            return res.status(403).json({ error: 'Unauthorized: Product does not belong to this user or does not exist' });
        }

        const updateQuery = `UPDATE products SET
                            product_name = ?,
                            quantity = ?,
                            unit = ?,
                            expiry_date = ?,
                            cost_price = ?,
                            updated_at = NOW()
                            WHERE id = ? AND user_id = ?`;

        const [updateResults] = await connection.query(
            updateQuery,
            [product_name, quantity, unit, expiry_date || null, cost_price || null, id, user_id]
        );

        console.log('Product updated successfully:', updateResults);

        return res.status(200).json({
            message: 'Product updated successfully',
            id: parseInt(id),
            product: {
                id: parseInt(id),
                user_id,
                product_name,
                quantity,
                unit,
                expiry_date: expiry_date || null,
                cost_price: cost_price || null
            }
        });

    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({
            error: 'Failed to update product due to a database error.',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /update product.');
    }
});

// Delete a product (Frontend calls this endpoint)
router.delete('/delete/:id', protect, async (req, res) => {
    console.log('Delete product request received for ID:', req.params.id);

    const { id } = req.params;
    const user_id = req.user.id;

    if (!user_id) {
        console.error('Delete product: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        const [checkResults] = await connection.query(
            'SELECT * FROM products WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        if (checkResults.length === 0) {
            return res.status(403).json({ error: 'Unauthorized: Product does not belong to this user or does not exist' });
        }

        const [deleteResults] = await connection.query(
            'DELETE FROM products WHERE id = ? AND user_id = ?',
            [id, user_id]
        );

        console.log('Product deleted successfully:', deleteResults);

        return res.status(200).json({
            message: 'Product deleted successfully',
            deletedId: parseInt(id),
            affectedRows: deleteResults.affectedRows
        });

    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({
            error: 'Failed to delete product due to a database error.',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /delete product.');
    }
});

// Get all products for logged-in user
router.get('/my-products', protect, async (req, res) => {
    const user_id = req.user.id;

    if (!user_id) {
        console.error('Get products: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        const [results] = await connection.query(
            'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC',
            [user_id]
        );

        console.log(`Found ${results.length} products for user ${user_id}`);
        return res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({
            error: 'Failed to fetch products due to a database error.',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /my-products.');
    }
});

// Get recent sales for the logged-in user
router.get('/my-recent-sales', protect, async (req, res) => {
    const user_id = req.user.id;

    if (!user_id) {
        console.error('Get recent sales: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        // Join products to get product_name
        const [results] = await connection.query(
            `SELECT st.id, st.product_id, st.quantity_sold, st.sale_price, st.sale_date, p.product_name
             FROM sales_transactions st
             JOIN products p ON st.product_id = p.id
             WHERE st.user_id = ?
             ORDER BY st.sale_date DESC
             LIMIT 5`, // Fetch top 5 recent sales
            [user_id]
        );

        console.log(`Found ${results.length} recent sales for user ${user_id}`);
        return res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching recent sales:', error);
        return res.status(500).json({
            error: 'Failed to fetch recent sales due to a database error.',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /my-recent-sales.');
    }
});

// Get aggregated sales data by product for the logged-in user
router.get('/sales/summary-by-product', protect, async (req, res) => {
    const user_id = req.user.id;

    if (!user_id) {
        console.error('Get sales summary by product: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        const query = `
            SELECT
                p.product_name,
                SUM(st.quantity_sold) AS total_quantity_sold,
                SUM(st.sale_price) AS total_revenue
            FROM sales_transactions st
            JOIN products p ON st.product_id = p.id
            WHERE st.user_id = ?
            GROUP BY p.product_name
            ORDER BY total_revenue DESC;
        `;

        const [results] = await connection.query(query, [user_id]);

        console.log(`Found ${results.length} sales summaries by product for user ${user_id}`);
        return res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching sales summary by product:', error);
        return res.status(500).json({
            error: 'Failed to fetch sales summary by product due to a database error.',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /sales/summary-by-product.');
    }
});

// Get daily total revenue for the logged-in user within a date range (default last 30 days)
router.get('/sales/daily-revenue', protect, async (req, res) => {
    const user_id = req.user.id;
    const startDate = req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = req.query.endDate || new Date().toISOString().split('T')[0];

    if (!user_id) {
        console.error('Get daily revenue: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        const query = `
            SELECT
                sale_date,
                SUM(sale_price) AS daily_total_revenue
            FROM sales_transactions
            WHERE user_id = ? AND sale_date BETWEEN ? AND ?
            GROUP BY sale_date
            ORDER BY sale_date ASC;
        `;

        const [results] = await connection.query(query, [user_id, startDate, endDate]);

        console.log(`Found ${results.length} daily revenue entries for user ${user_id} between ${startDate} and ${endDate}`);
        return res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching daily revenue:', error);
        return res.status(500).json({
            error: 'Failed to fetch daily revenue due to a database error.',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /sales/daily-revenue.');
    }
});

// Get all sales transactions for the logged-in user (similar to my-recent-sales but without limit)
router.get('/sales/all-transactions', protect, async (req, res) => {
    const user_id = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    if (!user_id) {
        console.error('Get all sales transactions: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        let query = `
            SELECT st.id, st.product_id, st.quantity_sold, st.sale_price, st.sale_date, p.product_name
            FROM sales_transactions st
            JOIN products p ON st.product_id = p.id
            WHERE st.user_id = ?
            ORDER BY st.sale_date DESC, st.id DESC
        `;
        const params = [user_id];

        if (limit) {
            query += ` LIMIT ?`;
            params.push(limit);
        }

        const [results] = await connection.query(query, params);

        console.log(`Found ${results.length} sales transactions for user ${user_id}`);
        return res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching all sales transactions:', error);
        return res.status(500).json({
            error: 'Failed to fetch sales transactions due to a database error.',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /sales/all-transactions.');
    }
});

// Route to record a sale and update product quantity
router.post('/sales/record-sale', protect, async (req, res) => {
    console.log('Record sale request received:', req.body);
    const { product_id, quantity_sold, sale_price, remaining_quantity } = req.body;
    const user_id = req.user.id;

    if (!user_id) {
        console.error('Record sale: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    if (!product_id || quantity_sold === undefined || sale_price === undefined || remaining_quantity === undefined) {
        return res.status(400).json({ error: 'Missing required fields: product_id, quantity_sold, sale_price, or remaining_quantity' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction(); // Start a transaction

        // 1. Insert into sales_transactions
        const insertSaleQuery = `
            INSERT INTO sales_transactions (user_id, product_id, quantity_sold, sale_price, sale_date)
            VALUES (?, ?, ?, ?, CURDATE());
        `;
        await connection.query(insertSaleQuery, [user_id, product_id, quantity_sold, sale_price]);
        console.log(`Sale recorded for product_id: ${product_id}, quantity_sold: ${quantity_sold}`);

        // 2. Update product quantity in the products table
        const updateProductQuantityQuery = `
            UPDATE products
            SET quantity = ?, updated_at = NOW()
            WHERE id = ? AND user_id = ?;
        `;
        const [updateResult] = await connection.query(updateProductQuantityQuery, [remaining_quantity, product_id, user_id]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback(); // Rollback if product not found or not owned by user
            return res.status(404).json({ error: 'Product not found or not owned by user, transaction rolled back.' });
        }
        console.log(`Product quantity updated for product_id: ${product_id}, new quantity: ${remaining_quantity}`);

        await connection.commit(); // Commit the transaction

        return res.status(201).json({
            message: 'Sale recorded and product quantity updated successfully',
            product_id,
            quantity_sold,
            sale_price,
            remaining_quantity
        });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback on error
            console.error('Transaction rolled back due to error:', error);
        }
        console.error('Error recording sale or updating product quantity:', error);
        return res.status(500).json({
            error: 'Failed to record sale or update product quantity due to a database error.',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /sales/record-sale.');
    }
});

module.exports = router;
