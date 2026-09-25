const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      minlength: 2,
      maxlength: 50,
    },

    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maximumDiscount: {
      type: Number,
      default: null,
      min: 0,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// NORMALIZE COUPON CODE
// ==========================================
// Mongoose 9 pre middleware does not use next().
// Simply modify the document and let the middleware
// finish normally.

couponSchema.pre("validate", function () {
  if (typeof this.code === "string") {
    this.code = this.code.trim().toUpperCase();
  }
});

// ==========================================
// MODEL
// ==========================================

const Coupon = mongoose.model(
  "Coupon",
  couponSchema
);

module.exports = Coupon;

