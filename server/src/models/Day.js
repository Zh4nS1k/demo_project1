const mongoose = require('mongoose');

const daySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      // References User.username (not a strict FK — kept as string for flexibility)
    },
    coffee_name: {
      type: String,
      required: [true, 'Coffee name is required'],
      trim: true,
    },
    count_of_cups: {
      type: Number,
      required: [true, 'Count of cups is required'],
      min: [1, 'You must drink at least 1 cup'],
      default: 1,
    },
    rating: {
      type: Number,
      min: [0, 'Rating must be between 0 and 5'],
      max: [5, 'Rating must be between 0 and 5'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries on common lookups
daySchema.index({ username: 1, date: -1 });
daySchema.index({ username: 1, coffee_name: 1 });

module.exports = mongoose.model('Day', daySchema);
