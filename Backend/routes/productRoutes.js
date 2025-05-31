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
// Add this helper function right after your email configuration and before your routes
const validateUser = (req, res) => {
    console.log('=== USER VALIDATION DEBUG ===');
    console.log('req.user:', req.user);
    console.log('req.user.id:', req.user ? req.user.id : 'undefined');
    console.log('typeof req.user.id:', req.user ? typeof req.user.id : 'undefined');
    console.log('=============================');
    
    if (!req.user) {
        console.error('CRITICAL: req.user is null or undefined');
        return false;
    }
    
    if (!req.user.id) {
        console.error('CRITICAL: req.user.id is missing');
        return false;
    }
    
    return true;
};
const transporter = nodemailer.createTransport(emailConfig);

// Save business info (Protected)
router.post('/save-business-info', protect, async (req, res) => {
    console.log('Save business info request received:', req.body);
    const { business_type, track_expiry, track_stock, track_report } = req.body;
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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
router.post('/send-expiry-alert', protect, async (req, res) => {
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
    const user_id = req.user.id;
    const user_email = req.user.email; // Get email from req.user
    const daysThreshold = 7; // You can make this configurable if needed

    if (!user_id || !user_email) {
        console.error('Send expiry alert: User ID or email is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or email missing.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        // 1. Fetch expiring products for the user
        const [expiringProducts] = await connection.query(
            `SELECT product_name, quantity, unit, expiry_date
             FROM products
             WHERE user_id = ? AND expiry_date IS NOT NULL
             AND expiry_date <= CURDATE() + INTERVAL ? DAY
             ORDER BY expiry_date ASC;`,
            [user_id, daysThreshold]
        );

        console.log(`Found ${expiringProducts.length} products to alert for user ${user_id}`);

        if (expiringProducts.length === 0) {
            console.log('No products expiring soon for this user. No email alert sent.');
            return res.status(200).json({ message: 'No products expiring soon. No alert sent.' });
        }

        // 2. Prepare the email content
        let emailHtml = `
            <h2>Expiry Alert from Inventory Management System</h2>
            <p>Dear User,</p>
            <p>The following products in your inventory are expiring soon or have already expired:</p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <th style="padding: 8px; text-align: left;">Product Name</th>
                        <th style="padding: 8px; text-align: left;">Quantity</th>
                        <th style="padding: 8px; text-align: left;">Unit</th>
                        <th style="padding: 8px; text-align: left;">Expiry Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        expiringProducts.forEach(product => {
            const expiryDate = new Date(product.expiry_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            emailHtml += `
                <tr>
                    <td style="padding: 8px;">${product.product_name}</td>
                    <td style="padding: 8px;">${product.quantity}</td>
                    <td style="padding: 8px;">${product.unit}</td>
                    <td style="padding: 8px;">${expiryDate}</td>
                </tr>
            `;
        });

        emailHtml += `
                </tbody>
            </table>
            <p>Please take necessary action for these items.</p>
            <p>Sincerely,<br>Your Inventory Management System</p>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user_email, // Send to the logged-in user's email
            subject: 'Urgent: Products Expiring Soon!',
            html: emailHtml,
            text: `Expiry Alert: Some products in your inventory are expiring soon. Please check your dashboard for details.` // Plain text fallback
        };

        // 3. Send the email
        await transporter.sendMail(mailOptions);
        console.log(`Expiry alert email sent successfully to ${user_email} for ${expiringProducts.length} products.`);

        return res.status(200).json({
            message: 'Expiry alert email sent successfully!',
            email_sent_to: user_email,
            products_alerted: expiringProducts.length
        });

    } catch (error) {
        console.error('Error sending expiry alert email:', error);
        let errorMessage = 'Failed to send expiry alert email.';
        if (error.code === 'EENVELOPE' || error.code === 'EAUTH') {
            errorMessage = 'Authentication error with email service. Check EMAIL_USER and EMAIL_PASS.';
        } else if (error.responseCode) {
            errorMessage = `Email service error: ${error.responseCode} - ${error.response}`;
        }
        return res.status(500).json({ error: errorMessage, details: error.message });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /send-expiry-alert.');
    }
});
// Get daily total revenue for the logged-in user within a date range (default last 30 days)
router.get('/sales/daily-revenue', protect, async (req, res) => {
   if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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

// Add this route to your productRoutes.js (replace the existing /sales/record route)



router.post('/sales/record', protect, async (req, res) => {

    console.log('Record sale request received:', req.body);

    console.log('User from token:', req.user);

    

    const { product_id, quantity_sold, sale_price, sale_date } = req.body;
if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
    const user_id = req.user.id;



    // Detailed logging for debugging

    console.log('Parsed request data:', {

        user_id,

        product_id,

        quantity_sold,

        sale_price,

        sale_date

    });



    if (!user_id) {

        console.error('Record sale: User ID is missing after auth middleware.');

        return res.status(401).json({ error: 'User not authenticated or ID missing.' });

    }



    // Validate required fields

    if (product_id === undefined || product_id === null || product_id === '') {

        return res.status(400).json({ error: 'Product ID is required.' });

    }

    if (quantity_sold === undefined || quantity_sold === null || quantity_sold === '') {

        return res.status(400).json({ error: 'Quantity sold is required.' });

    }

    if (sale_price === undefined || sale_price === null || sale_price === '') {

        return res.status(400).json({ error: 'Sale price is required.' });

    }

    if (!sale_date) {

        return res.status(400).json({ error: 'Sale date is required.' });

    }



    // Convert and validate data types

    const productIdInt = parseInt(product_id);

    const quantitySoldInt = parseInt(quantity_sold);

    const salePriceFloat = parseFloat(sale_price);



    if (isNaN(productIdInt) || productIdInt <= 0) {

        return res.status(400).json({ error: 'Product ID must be a valid positive number.' });

    }

    if (isNaN(quantitySoldInt) || quantitySoldInt <= 0) {

        return res.status(400).json({ error: 'Quantity sold must be a positive number.' });

    }

    if (isNaN(salePriceFloat) || salePriceFloat <= 0) {

        return res.status(400).json({ error: 'Sale price must be a positive number.' });

    }



    // Validate date format

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(sale_date)) {

        return res.status(400).json({ error: 'Sale date must be in YYYY-MM-DD format.' });

    }



    let connection;

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();



        console.log('Starting transaction for sale recording...');



        // 1. Verify product exists and belongs to user, get current quantity

        const [productRows] = await connection.query(

            'SELECT id, product_name, quantity, cost_price FROM products WHERE id = ? AND user_id = ? FOR UPDATE',

            [productIdInt, user_id]

        );



        console.log('Product query result:', productRows);



        if (productRows.length === 0) {

            await connection.rollback();

            console.error(`Product not found: ID ${productIdInt} for user ${user_id}`);

            return res.status(404).json({ 

                error: 'Product not found or you do not have permission to sell this product.' 

            });

        }



        const product = productRows[0];

        const currentQuantity = parseInt(product.quantity);



        console.log('Current product quantity:', currentQuantity);

        console.log('Requested quantity to sell:', quantitySoldInt);



        // 2. Check if there's enough stock

        if (currentQuantity < quantitySoldInt) {

            await connection.rollback();

            console.error(`Insufficient stock: Available ${currentQuantity}, requested ${quantitySoldInt}`);

            return res.status(400).json({ 

                error: `Insufficient stock. Only ${currentQuantity} units available, but ${quantitySoldInt} requested.` 

            });

        }



        const newQuantity = currentQuantity - quantitySoldInt;

        console.log('New quantity after sale:', newQuantity);



        // 3. Insert the sale transaction

        const [saleResult] = await connection.query(

            'INSERT INTO sales_transactions (user_id, product_id, quantity_sold, sale_price, sale_date) VALUES (?, ?, ?, ?, ?)',

            [user_id, productIdInt, quantitySoldInt, salePriceFloat, sale_date]

        );



        console.log('Sale transaction inserted with ID:', saleResult.insertId);



        // 4. Update the product quantity

        const [updateResult] = await connection.query(

            'UPDATE products SET quantity = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',

            [newQuantity, productIdInt, user_id]

        );



        console.log('Product quantity update result:', updateResult);



        if (updateResult.affectedRows === 0) {

            await connection.rollback();

            console.error('Failed to update product quantity - no rows affected');

            return res.status(500).json({ error: 'Failed to update product quantity.' });

        }



        await connection.commit();

        console.log('Transaction committed successfully');



        return res.status(201).json({

            message: 'Sale recorded and product quantity updated successfully!',

            sale_id: saleResult.insertId,

            product_name: product.product_name,

            quantity_sold: quantitySoldInt,

            sale_price: salePriceFloat,

            previous_quantity: currentQuantity,

            updated_product_quantity: newQuantity,

            sale_date: sale_date

        });



    } catch (error) {

        if (connection) {

            await connection.rollback();

            console.error('Transaction rolled back due to error.');

        }

        console.error('Detailed error in record sale:', error);

        return res.status(500).json({

            error: 'Failed to record sale due to a database error.',

            details: error.message,

            sqlState: error.sqlState || 'Unknown',

            errno: error.errno || 'Unknown'

        });

    } finally {

        if (connection) {

            connection.release();

            console.log('Database connection released for /sales/record.');

        }

    }

});
// Get all sales transactions for the logged-in user (similar to my-recent-sales but without limit)
router.get('/sales/all-transactions', protect, async (req, res) => {
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
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
router.post('/send-bulk-expiry-alert', protect, async (req, res) => {
    // Assuming you want to send this to a specific admin email, not req.user.email
    const adminEmail = process.env.ADMIN_EMAIL; // Define ADMIN_EMAIL in your .env file
    const daysThreshold = 7; // Define how many days "soon to expire" means

    if (!adminEmail) {
        console.error('CRITICAL ERROR: ADMIN_EMAIL is not defined in environment variables for bulk alert!');
        return res.status(500).json({ error: 'Server misconfiguration: Admin email missing.' });
    }

    // You can optionally add a check here if only specific users (e.g., role 'admin') can trigger this
    // if (req.user.role !== 'admin') {
    //     return res.status(403).json({ error: 'Forbidden: Only administrators can send bulk alerts.' });
    // }

    let connection;
    try {
        connection = await db.getConnection();

        // 1. Fetch ALL expiring products (or all expiring products across all users)
        // If you want all products across all users, remove `user_id` from WHERE clause
        // If you want ALL products for the logged-in user (similar to previous but named bulk), keep user_id
        // For 'bulk', let's assume you want all expiring products across all users for an admin
        const [expiringProducts] = await connection.query(
            `SELECT p.product_name, p.quantity, p.unit, p.expiry_date, u.email as user_email, u.username as user_username
             FROM products p
             JOIN users u ON p.user_id = u.id
             WHERE p.expiry_date IS NOT NULL
             AND p.expiry_date <= CURDATE() + INTERVAL ? DAY
             ORDER BY p.expiry_date ASC;`,
            [daysThreshold]
        );

        console.log(`Found ${expiringProducts.length} total products to alert for bulk email.`);

        if (expiringProducts.length === 0) {
            console.log('No products expiring soon across all users. No bulk email alert sent.');
            return res.status(200).json({ message: 'No products expiring soon. No bulk alert sent.' });
        }

        // 2. Prepare the email content
        let emailHtml = `
            <h2>Bulk Expiry Alert from Inventory Management System</h2>
            <p>Dear Administrator,</p>
            <p>The following products in the system are expiring soon or have already expired:</p>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <th style="padding: 8px; text-align: left;">Product Name</th>
                        <th style="padding: 8px; text-align: left;">Quantity</th>
                        <th style="padding: 8px; text-align: left;">Unit</th>
                        <th style="padding: 8px; text-align: left;">Expiry Date</th>
                        <th style="padding: 8px; text-align: left;">Owner Email</th>
                        <th style="padding: 8px; text-align: left;">Owner Username</th>
                    </tr>
                </thead>
                <tbody>
        `;

        expiringProducts.forEach(product => {
            const expiryDate = new Date(product.expiry_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            emailHtml += `
                <tr>
                    <td style="padding: 8px;">${product.product_name}</td>
                    <td style="padding: 8px;">${product.quantity}</td>
                    <td style="padding: 8px;">${product.unit}</td>
                    <td style="padding: 8px;">${expiryDate}</td>
                    <td style="padding: 8px;">${product.user_email || 'N/A'}</td>
                    <td style="padding: 8px;">${product.user_username || 'N/A'}</td>
                </tr>
            `;
        });

        emailHtml += `
                </tbody>
            </table>
            <p>Please review and take necessary action for these items across your users.</p>
            <p>Sincerely,<br>Your Inventory Management System</p>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: adminEmail, // Send to the predefined admin email
            subject: 'Bulk Urgent: Products Expiring Soon Across All Users!',
            html: emailHtml,
            text: `Bulk Expiry Alert: Some products across your users are expiring soon. Please check the system for details.`
        };

        // 3. Send the email
        await transporter.sendMail(mailOptions);
        console.log(`Bulk expiry alert email sent successfully to ${adminEmail} for ${expiringProducts.length} products.`);

        return res.status(200).json({
            message: 'Bulk expiry alert email sent successfully!',
            email_sent_to: adminEmail,
            products_alerted: expiringProducts.length
        });

    } catch (error) {
        console.error('Error sending bulk expiry alert email:', error);
        let errorMessage = 'Failed to send bulk expiry alert email.';
        if (error.code === 'EENVELOPE' || error.code === 'EAUTH') {
            errorMessage = 'Authentication error with email service. Check EMAIL_USER and EMAIL_PASS.';
        } else if (error.responseCode) {
            errorMessage = `Email service error: ${error.responseCode} - ${error.response}`;
        }
        return res.status(500).json({ error: errorMessage, details: error.message });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /send-bulk-expiry-alert.');
    }
});


// This should set up a server-side cron job or scheduler to:
// 1. Check for expiring products every 24 hours
// 2. Send email alerts automatically
// 3. Continue until user disables or expires
// Get products expiring soon for logged-in user
router.get('/expiry', protect, async (req, res) => {
    if (!validateUser(req, res)) {
    return res.status(401).json({ error: 'User not authenticated or ID missing.' });
}
    const user_id = req.user.id;
    const daysThreshold = 7; // Define how many days "soon to expire" means

    if (!user_id) {
        console.error('Get expiring products: User ID is missing after auth middleware.');
        return res.status(401).json({ error: 'User not authenticated or ID missing.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        // Fetch products expiring within the next `daysThreshold` days or already expired
        const query = `
            SELECT id, product_name, quantity, unit, expiry_date, cost_price
            FROM products
            WHERE user_id = ? AND expiry_date IS NOT NULL
            AND expiry_date <= CURDATE() + INTERVAL ? DAY
            ORDER BY expiry_date ASC;
        `;

        const [results] = await connection.query(query, [user_id, daysThreshold]);

        console.log(`Found ${results.length} products expiring soon or already expired for user ${user_id}`);
        return res.status(200).json({ products: results }); // Wrap in 'products' key as frontend expects

    } catch (error) {
        console.error('Error fetching expiring products:', error);
        return res.status(500).json({
            error: 'Failed to fetch expiring products due to a database error.',
            details: error.message
        });
    } finally {
        if (connection) connection.release();
        console.log('Database connection released for /expiry.');
    }
});
// NEW: Test Email Configuration (Protected)
router.post('/test-email', protect, async (req, res) => {
    const user_email = req.user.email; // Assuming your protect middleware adds user.email to req.user

    if (!user_email) {
        return res.status(400).json({ error: 'User email not available for testing.' });
    }

    const mailOptions = {
        from: process.env.EMAIL_USER, // Your sender email
        to: user_email, // Send to the logged-in user's email
        subject: 'Test Email from Inventory Management System',
        text: 'This is a test email to confirm your email configuration is working correctly.',
        html: '<p>This is a **test email** from your Inventory Management System to confirm your email configuration is working correctly.</p>'
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Test email sent successfully to ${user_email}`);
        return res.status(200).json({ message: 'Test email sent successfully!', email_sent_to: user_email });
    } catch (error) {
        console.error('Error sending test email:', error);
        // Provide more specific error details if possible (e.g., from Nodemailer's error object)
        let errorMessage = 'Failed to send test email.';
        if (error.code === 'EENVELOPE' || error.code === 'EAUTH') {
             errorMessage = 'Authentication error with email service. Check EMAIL_USER and EMAIL_PASS.';
        } else if (error.responseCode) {
             errorMessage = `Email service error: ${error.responseCode} - ${error.response}`;
        }
        return res.status(500).json({ error: errorMessage, details: error.message });
    }
});
module.exports = router;
