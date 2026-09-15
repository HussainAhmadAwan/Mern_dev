const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // Store the number of product cards shown in each row.
    productCardsPerRow: {
      type: Number,
      enum: [3, 4, 5, 6],
      default: 4,
    },

    // Store the standard delivery charge for new orders.
    deliveryCharge: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Store the announcement displayed below the navbar.
    announcementText: {
      type: String,
      trim: true,
      default: "",
    },

    // Store ticker duration in seconds; 0 means the ticker stays still.
    announcementSpeed: {
      type: Number,
      min: 0,
      max: 120,
      default: 20,
    },

    // Store the selected website currency code.
    currencyCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "USD",
    },

    // Store the selected website currency symbol.
    currencySymbol: {
      type: String,
      trim: true,
      default: "$",
    },
  },
  {
    timestamps: true,
  }
);

const Settings =
  mongoose.model(
    "Settings",
    settingsSchema
  );

module.exports = Settings;