const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');
const { findUserByEmail, createUser } = require('../models/userAuthModel');
const { createUserData } = require('../models/userDataModel');

// Register a new user
const registerUser = async (username, email, password, callback) => {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return callback('User already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and get the new user ID
    const newUserId = await createUser(username, email, hashedPassword);

    // Create empty inventory and stats for the new user
    await createUserData(newUserId, {}, {});

    callback(null, { success: true });
  } catch (error) {
    console.error('Registration error:', error);
    callback('Server error during registration');
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    // Find the user by email
    const user = await findUserByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    console.log('User fetched from DB:', user);

    // Compare password with hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data with token
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      token: token
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser
};