const mongoose = require('mongoose');
const { log } = require('../utils/log');

/**
 * Connect to MongoDB.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee_drinker';
  const { protocol, host, pathname } = new URL(uri);
  // Never log credentials — show just protocol://host/db
  const safeUri = `${protocol}//${host}${pathname}`;

  log.info(` Connecting to MongoDB: ${safeUri}`);

  try {
    const conn = await mongoose.connect(uri);
    log.success(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (error) {
    log.error(`MongoDB connection error: ${error.message}`);
    log.warn('Make sure MongoDB is running. Try: mongod, `make docker-up`, or check MONGODB_URI in .env');
    process.exit(1);
  }
};

module.exports = connectDB;
