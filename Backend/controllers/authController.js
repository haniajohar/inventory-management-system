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

// FIXED: Changed error message to mention username instead of email
const findUserByUsername = async (username) => {
    try {
        const query = 'SELECT * FROM users WHERE username = ?';
        const [rows] = await db.execute(query, [username]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error finding user by username:', error);
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
const generateAccessToken = (userId, userEmail = null) => {
    console.log('Generating access token for user ID:', userId, 'and email:', userEmail);
    if (!process.env.JWT_ACCESS_SECRET) {
        console.error('JWT_ACCESS_SECRET is not defined in environment variables');
        throw new Error('JWT_ACCESS_SECRET environment variable is required');
    }

    try {
        const payload = { userId };
        if (userEmail) payload.email = userEmail;

        const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
        console.log('Access token generated successfully');
        return token;
    } catch (error) {
        console.error('Error generating access token:', error);
        throw error;
    }
};

const generateRefreshToken = (userId) => {
    console.log('Generating refresh token for user ID:', userId);

    if (!process.env.JWT_REFRESH_SECRET) {
        console.error('JWT_REFRESH_SECRET is not defined in environment variables');
        throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }

    try {
        const token = jwt.sign(
            { userId },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
        console.log('Refresh token generated successfully');
        return token;
    } catch (error) {
        console.error('Error generating refresh token:', error);
        throw error;
    }
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
        console.log('Checking if user exists with email:', email);
        const existingUser = await findUserByEmail(email);

        if (existingUser) {
            console.log('User already exists with this email');
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        console.log('Hashing password');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log('Creating new user');
        const userId = await createUser(username, email, hashedPassword);

        console.log('Generating tokens for signup');
        const accessToken = generateAccessToken(userId, email);
        const refreshToken = generateRefreshToken(userId);

        console.log('Setting refresh token cookie');
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

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
    const { username, password } = req.body;

    if (!username || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        console.log('Finding user with username:', username);
        const user = await findUserByUsername(username);
        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            console.log('No user found with this username');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('Comparing passwords');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch ? 'Yes' : 'No');

        if (!isMatch) {
            console.log('Password did not match');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('Generating tokens for login');
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id);

        console.log('Setting refresh token cookie');
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

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

const refreshToken = async (req, res) => {
    console.log('Refresh token attempt');

    const token = req.cookies.refreshToken;

    if (!token) {
        console.log('No refresh token provided');
        return res.status(401).json({ message: 'Refresh token is required' });
    }

    try {
        console.log('Verifying refresh token');
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key');

        console.log('Generating new access token');
        const accessToken = generateAccessToken(decoded.userId);

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

const logout = (req, res) => {
    console.log('Logout attempt');
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
    signup,
    login,
    refreshToken,
    logout
};
