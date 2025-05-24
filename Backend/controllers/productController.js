const db = require('../config/db');

const createProduct = async (req, res) => {
  try {
    const {
      user_id,
      product_name,
      quantity,
      unit,
      expiry_date,
      cost_price,
      sold,
    } = req.body;

    // Basic validation
    if (!user_id || !product_name || !quantity || !unit || !expiry_date || !cost_price || sold === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (quantity < 0 || sold < 0) {
      return res.status(400).json({ error: 'Quantity and sold must be non-negative' });
    }

    // Inserting new product into database
    const [result] = await db.query(
      'INSERT INTO products (user_id, product_name, quantity, unit, expiry_date, cost_price, sold) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user_id, product_name, quantity, unit, expiry_date, cost_price, sold]
    );

    res.status(201).json({ id: result.insertId, message: 'Product created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

module.exports = {
  createProduct,
};
