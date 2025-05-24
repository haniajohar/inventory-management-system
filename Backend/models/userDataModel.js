const db = require('../config/db');

// Fetch user data (inventory & stats) by user ID
const getUserDataByUserId = (userId) => {
  return db.promise().query('SELECT * FROM user_data WHERE user_id = ?', [userId]);
};

// Create or update user data
const createUserData = (userId, inventory, stats) => {
  return db.promise().query(
    'INSERT INTO user_data (user_id, inventory, stats) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE inventory = ?, stats = ?',
    [userId, JSON.stringify(inventory), JSON.stringify(stats), JSON.stringify(inventory), JSON.stringify(stats)]
  );
};

module.exports = { getUserDataByUserId, createUserData };
