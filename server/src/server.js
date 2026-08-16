// Load server/.env regardless of the directory the process is started from
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const app = require('./app');
const { log } = require('./utils/log');

// ─── Fail fast on bad config ───
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  log.error('JWT_SECRET is missing or shorter than 16 chars. Set it in .env');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// ─── Start Server ───
const PORT = process.env.PORT || 3000;
const MODE = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log('');
  console.log('  ☕ ─────────────────────────────────────────');
  console.log('  🚀 Coffee Drinker API is running');
  console.log(`     → http://localhost:${PORT}`);
  console.log(`     🧭 Mode: ${MODE}`);
  console.log(`     🔑 JWT expiry: ${process.env.JWT_EXPIRES_IN || '7d'}`);
  console.log(`     🌍 CORS origin: ${process.env.CORS_ORIGIN || '* (open — dev default)'}`);
  console.log(`     🚦 Rate limits: 300 req/5min global · 10 failed logins/15min`);
  console.log('  ☕ ─────────────────────────────────────────');
  console.log('');
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  log.error(`Unhandled rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Graceful shutdown (Ctrl+C, docker stop, Render redeploys)
process.on('SIGTERM', () => {
  log.warn('SIGTERM received — closing server…');
  server.close(() => {
    log.success('Server closed cleanly 👋');
    process.exit(0);
  });
});

module.exports = app;
