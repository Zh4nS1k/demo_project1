// Load server/.env regardless of the directory the process is started from
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectDB = require('./config/db');
const app = require('./app');

// ─── Fail fast on bad config ───
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('✗ JWT_SECRET is missing or shorter than 16 chars. Set it in .env');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

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
