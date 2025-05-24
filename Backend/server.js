require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // For better logging
const cookieParser = require('cookie-parser'); // Add cookie-parser

const app = express();

// Enable CORS with options
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true // Important for cookies to work cross-origin
}));

// Middleware
app.use(express.json()); // To parse JSON requests
app.use(cookieParser()); // Add this to parse cookies
app.use(morgan('dev')); // For logging requests

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const notifications = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/notifications', notifications);

// Root route to fix the GET / 404 error
app.get('/', (req, res) => {
  res.send('Welcome to the ShelfLife API!');
});

// Cron jobs
require('./cronJobs/alerts');

// Global Error Handling Middleware (after all routes)
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});