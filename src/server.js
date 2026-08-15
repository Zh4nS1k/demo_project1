require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const userRoutes = require('./routes/userRoutes');
const coffeeRoutes = require('./routes/coffeeRoutes');
const dayRoutes = require('./routes/dayRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ───
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ───
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '☕ Coffee Drinker API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      coffees: '/api/coffees',
      days: '/api/days',
    },
  });
});

// ─── Routes ───
app.use('/api/users', userRoutes);
app.use('/api/coffees', coffeeRoutes);
app.use('/api/days', dayRoutes);

// ─── 404 Handler ───
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// ─── Error Handler (must be last) ───
app.use(errorHandler);

// ─── Start Server ───
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API: http://localhost:${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
