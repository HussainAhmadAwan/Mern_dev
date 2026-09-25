const mongoose = require("mongoose");

// ORDER STATUS HISTORY SCHEMA
const orderStatusHistorySchema = new mongoose.Schema(
  {
    from: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: null,
    },

    to: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      required: true,
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    changedByRole: {
      type: String,
      enum: ["admin", "customer", "system"],
      default: "system",
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// COUPON SNAPSHOT SCHEMA
//
// Important:
// We store the coupon information used at the time of
// purchase so future coupon edits do not change old orders.
const orderCouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },

    discountType: {
      type: String,
      enum: ["fixed", "percentage"],
    },

    discountValue: {
      type: Number,
      min: 0,
    },

    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

// ORDER SCHEMA
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    orderId: {
      type: String,
      default: null,
      trim: true,
    },

    customer: {
      firstName: {
        type: String,
        required: true,
      },

      lastName: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      address: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      zipCode: {
        type: String,
        required: true,
      },
    },

    paymentMethod: {
      type: String,
      required: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },

        name: {
          type: String,
          required: true,
        },

        image: {
          type: String,
          default: "",
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // COUPON
    // ==========================================

    coupon: {
      type: orderCouponSchema,
      default: null,
    },

    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    currencyCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "USD",
    },

    currencySymbol: {
      type: String,
      required: true,
      trim: true,
      default: "$",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    statusHistory: {
      type: [orderStatusHistorySchema],
      default: [],
    },
  },

  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;