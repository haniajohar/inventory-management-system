// Backend\utils\generateToken.js (assuming this path)

const jwt = require('jsonwebtoken');

// Generate access token (short-lived)
const generateAccessToken = (userId, userEmail) => { // <--- ADD userEmail parameter
  console.log('Generating access token for user ID:', userId, 'and email:', userEmail);

  if (!process.env.JWT_ACCESS_SECRET) { // Corrected from JWT_SECRET based on your authMiddleware
    console.error('JWT_ACCESS_SECRET is not defined in environment variables');
    throw new Error('JWT_ACCESS_SECRET environment variable is required');
  }

  try {
    const token = jwt.sign(
      { userId: userId, email: userEmail }, // <--- Include email in the payload
      process.env.JWT_ACCESS_SECRET, // <--- Use JWT_ACCESS_SECRET as per authMiddleware
      { expiresIn: '1h' } // Expires in 1 hour
    );
    console.log('Access token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating access token:', error);
    throw error;
  }
};

// Generate refresh token (long-lived) - no change needed here for email
const generateRefreshToken = (userId) => {
  console.log('Generating refresh token for user ID:', userId);

  if (!process.env.JWT_REFRESH_SECRET) {
    console.error('JWT_REFRESH_SECRET is not defined in environment variables');
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }

  try {
    const token = jwt.sign(
      { userId: userId }, // Assuming refresh token only needs userId
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // Expires in 7 days
    );
    console.log('Refresh token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw error;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken
};