const express = require('express');
const router = express.Router();
const db = require('../config/db');
const protect = require('../middlewares/authMiddleware');

// Get notifications for the logged-in user
router.get('/', protect, async (req, res) => {
  const user_id = req.user.id;

  try {
    const [notifications] = await db.execute(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

module.exports = router;
