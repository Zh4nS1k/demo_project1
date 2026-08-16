const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const errorHandler = require('./middleware/errorHandler');

const userRoutes = require('./routes/userRoutes');
const coffeeRoutes = require('./routes/coffeeRoutes');
const dayRoutes = require('./routes/dayRoutes');

const app = express();

// Behind one proxy hop (Next.js rewrites in dev, nginx in prod) so rate limiting
// sees the real client IP from X-Forwarded-For. Remove if backend is exposed directly.
app.set('trust proxy', 1);

// ─── Middleware ───
// Security headers (CSP off — this is a JSON API, not a document server)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — open by default (dev), restrict in prod via CORS_ORIGIN="https://a.com,https://b.com"
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : '*';
app.use(cors({ origin: corsOrigin }));

// Light global rate limit — brute force & scrapers (login has its own stricter limiter).
// Skipped in test mode so the suite isn't throttled.
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many requests — slow down and try again shortly' },
});
app.use('/api', apiLimiter);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

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
