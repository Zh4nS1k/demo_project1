const mongoose = require('mongoose');

const coffeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Coffee name is required'],
      unique: true,
      trim: true,
    },
    taste: {
      type: String,
      required: [true, 'Taste description is required'],
      trim: true,
      enum: {
        values: [
          'sweet',
          'bitter',
          'sour',
          'salty',
          'umami',
          'nutty',
          'chocolate',
          'fruity',
          'floral',
          'caramel',
          'spicy',
          'earthy',
        ],
        message: '{VALUE} is not a recognized taste',
      },
    },
    energy_boost: {
      type: Number,
      required: [true, 'Energy boost is required'],
      min: [1, 'Energy boost must be between 1 and 10'],
      max: [10, 'Energy boost must be between 1 and 10'],
    },
    milk: {
      type: Number,
      required: [true, 'Milk field is required'],
      enum: {
        values: [0, 1],
        message: 'Milk must be 0 (no milk) or 1 (with milk)',
      },
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Coffee', coffeeSchema);
