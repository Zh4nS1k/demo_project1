const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');

const userRoutes = require('./routes/userRoutes');
const coffeeRoutes = require('./routes/coffeeRoutes');
const dayRoutes = require('./routes/dayRoutes');

const app = express();

// Behind one proxy hop (Next.js rewrites in dev, nginx in prod) so rate limiting
// sees the real client IP from X-Forwarded-For. Remove if backend is exposed directly.
app.set('trust proxy', 1);

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

module.exports = app;
