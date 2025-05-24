const express = require('express');
const router = express.Router();
const db = require('../config/db.js');
const protect = require('../middlewares/authMiddleware');

// Record a sale (with selling price)
router.post('/record', protect, async (req, res) => {
  const { user_id, product_id, quantity_sold, sale_date, selling_price } = req.body;

  if (!user_id || !product_id || !quantity_sold || !sale_date || !selling_price) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Get the product's cost price
    const [rows] = await db.execute(
      'SELECT cost_price FROM products WHERE id = ? AND user_id = ?',
      [product_id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const { cost_price } = rows[0];
    const profit = (selling_price - cost_price) * quantity_sold;

    // Record the sale
    await db.execute(
      'INSERT INTO sales (user_id, product_id, quantity_sold, sale_date, selling_price) VALUES (?, ?, ?, ?, ?)',
      [user_id, product_id, quantity_sold, sale_date, selling_price]
    );

    // Update sold count in products
    await db.execute(
      'UPDATE products SET sold = sold + ? WHERE id = ? AND user_id = ?',
      [quantity_sold, product_id, user_id]
    );

    // Update total profit for the user
    await db.execute(
      'UPDATE users SET total_profit = total_profit + ? WHERE id = ?',
      [profit, user_id]
    );

    res.status(201).json({
      message: 'Sale recorded successfully.',
      data: {
        product_id,
        quantity_sold,
        profit
      }
    });

  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({ error: 'Failed to record sale.' });
  }
});

module.exports = router;
