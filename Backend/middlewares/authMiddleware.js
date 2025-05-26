// Backend\middlewares\authMiddleware.js

const jwt = require('jsonwebtoken');
// const db = require('../config/db'); // db is not used directly in this snippet, can remove if not needed

const protect = (req, res, next) => {
  let token;

  try {
    if (!process.env.JWT_ACCESS_SECRET) {
        console.error('CRITICAL ERROR: JWT_ACCESS_SECRET is not defined in environment variables!');
        return res.status(500).json({ error: 'Server misconfiguration: JWT secret missing.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('AuthMiddleware: Not authorized - No Bearer token found in headers.');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    token = authHeader.split(' ')[1];
    console.log('AuthMiddleware: Extracted token (first 20 chars):', token.substring(0, 20) + '...');

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log('AuthMiddleware: Token decoded payload:', decoded);

    if (!decoded || !decoded.userId || !decoded.email) { // <--- ALSO CHECK FOR decoded.email
        console.error('AuthMiddleware: Decoded token does not contain a valid user ID or email:', decoded);
        return res.status(401).json({ error: 'Invalid token payload: User ID or email missing.' });
    }

    // Attach user ID and EMAIL to req.user object
    req.user = {
        id: decoded.userId, // Assign decoded.userId to req.user.id
        email: decoded.email // <--- ADD THIS LINE TO ATTACH EMAIL
    };
    console.log('AuthMiddleware: req.user set to:', req.user); // Will now show { id: ..., email: ... }

    next();
  } catch (error) {
    console.error('AuthMiddleware: Token validation error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }

    return res.status(500).json({ error: 'Failed to authenticate token due to an internal server error.' });
  }
};

module.exports = protect;