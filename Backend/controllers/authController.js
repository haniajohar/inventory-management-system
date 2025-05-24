const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Assuming you have a database configuration

// Helper function to find user by email
const findUserByEmail = async (email) => {
  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

// Helper function to create new user
const createUser = async (username, email, hashedPassword) => {
  try {
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [username, email, hashedPassword]);
    return result.insertId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Token generation functions
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET || 'your_access_secret_key',
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key',
    { expiresIn: '7d' }
  );
};

// Signup controller function
const signup = async (req, res) => {
  console.log('Signup attempt with:', req.body);
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    console.log('Missing required fields');
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }
  
  try {
    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    const existingUser = await findUserByEmail(email);
    
    if (existingUser) {
      console.log('User already exists with this email');
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    console.log('Hashing password');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    console.log('Creating new user');
    const userId = await createUser(username, email, hashedPassword);
    
    // Generate tokens
    console.log('Generating tokens');
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);
    
    // Set refresh token as HTTP-only cookie
    console.log('Setting refresh token cookie');
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Send response
    console.log('Sending success response');
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        username,
        email,
        token: accessToken
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Server error during registration', details: error.message });
  }
};

// Login controller function
const login = async (req, res) => {
  console.log('Login attempt with:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    console.log('Finding user with email:', email);
    // Find the user by email
    const user = await findUserByEmail(email);
    console.log('User found:', user ? 'Yes' : 'No');
    
    // If no user found
    if (!user) {
      console.log('No user found with this email');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Compare password
    console.log('Comparing passwords');
const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');
    
    if (!isMatch) {
      console.log('Password did not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate tokens
    console.log('Generating tokens');
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    // Set refresh token as HTTP-only cookie
    console.log('Setting refresh token cookie');
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Send response
    console.log('Sending success response');
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        token: accessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login', details: error.message });
  }
};

// Refresh token controller function
const refreshToken = async (req, res) => {
  console.log('Refresh token attempt');
  
  // Get refresh token from cookie
  const token = req.cookies.refreshToken;
  
  if (!token) {
    console.log('No refresh token provided');
    return res.status(401).json({ message: 'Refresh token is required' });
  }
  
  try {
    // Verify token
    console.log('Verifying refresh token');
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key');
    
    // Generate new access token
    console.log('Generating new access token');
    const accessToken = generateAccessToken(decoded.userId);
    
    // Send response
    console.log('Sending new access token');
    return res.status(200).json({
      message: 'Token refreshed successfully',
      token: accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// Logout controller function
const logout = (req, res) => {
  console.log('Logout attempt');
  
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  
  // Send response
  return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  signup,
  login,
  refreshToken,
  logout
};