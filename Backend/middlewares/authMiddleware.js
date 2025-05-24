const jwt = require('jsonwebtoken');
const db = require('../config/db');

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

    // ************************************************************
    // *** FIX IS HERE: Change from decoded.id to decoded.userId ***
    // ************************************************************
    if (!decoded || !decoded.userId) { // CHECK FOR decoded.userId
        console.error('AuthMiddleware: Decoded token does not contain a valid user ID (expected "userId" property):', decoded);
        return res.status(401).json({ error: 'Invalid token payload: User ID missing or malformed.' });
    }

    // Attach user ID to req.user object using the correct property name
    req.user = { id: decoded.userId }; // Assign decoded.userId to req.user.id
    console.log('AuthMiddleware: req.user.id set to:', req.user.id);

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