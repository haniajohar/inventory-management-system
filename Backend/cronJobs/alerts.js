const cron = require('node-cron');
const db = require('../config/db');

// Run every day at 8 AM
cron.schedule('0 8 * * *', async () => {
  try {
    // 1. Expired products
    const [expired] = await db.execute(
      `SELECT id, product_name, user_id FROM products WHERE expiry_date < CURDATE()`
    );

    for (let product of expired) {
      await db.execute(
        `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
        [product.user_id, `Product "${product.name}" has expired.`]
      );
    }

    // 2. Low stock products (threshold: quantity < 5)
    const [lowStock] = await db.execute(
      `SELECT id, name, user_id, quantity FROM products WHERE quantity < 5`
    );

    for (let product of lowStock) {
      await db.execute(
        `INSERT INTO notifications (user_id, message) VALUES (?, ?)`,
        [product.user_id, `Product "${product.name}" is low in stock (only ${product.quantity} left).`]
      );
    }

    console.log('Notifications generated successfully.');

  } catch (err) {
    console.error('Error running notification cron job:', err);
  }
});
