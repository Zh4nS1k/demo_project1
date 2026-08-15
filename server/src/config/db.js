const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee_drinker';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error('   Make sure MongoDB is running. Try: mongod or check your MONGODB_URI in .env');
    process.exit(1);
  }
};

module.exports = connectDB;
