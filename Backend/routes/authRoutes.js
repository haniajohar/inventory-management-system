const express = require('express');
const router = express.Router();
const { signup, login, refreshToken } = require('../controllers/authController');

// Register route
router.post('/register', signup);

// Login route
router.post('/login', login);

// Refresh token route - now using the controller
router.post('/refresh', refreshToken);
console.log('Auth controller functions imported:', { 
  signup: typeof signup === 'function', 
  login: typeof login === 'function',
  refreshToken: typeof refreshToken === 'function',
  
});
module.exports = router;