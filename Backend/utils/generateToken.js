const jwt = require('jsonwebtoken');

// Generate access token (short-lived)
const generateAccessToken = (userId) => {
  console.log('Generating access token for user ID:', userId);
  
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  try {
    const token = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Expires in 1 hour
    );
    console.log('Access token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating access token:', error);
    throw error;
  }
};

// Generate refresh token (long-lived)
const generateRefreshToken = (userId) => {
  console.log('Generating refresh token for user ID:', userId);
  
  if (!process.env.JWT_REFRESH_SECRET) {
    console.error('JWT_REFRESH_SECRET is not defined in environment variables');
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }
  
  try {
    const token = jwt.sign(
      { id: userId },
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