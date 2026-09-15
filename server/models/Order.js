
const mongoose = require("mongoose");

// ==========================================
// ORDER STATUS HISTORY SCHEMA
// ==========================================

const orderStatusHistorySchema = new mongoose.Schema(
  {
    // Status before this change.
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

    // Status after this change.
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

    // User/admin who made the change.
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Role of the person who made the change.
    changedByRole: {
      type: String,
      enum: ["admin", "customer", "system"],
      default: "system",
    },

    // Date and time of the status change.
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// ORDER SCHEMA
// ==========================================

const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================

    // Store the user who placed this order.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Store the short frontend Order ID.
    orderId: {
      type: String,
      default: null,
      trim: true,
    },

    // ==========================================
    // CUSTOMER INFORMATION
    // ==========================================

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

    // ==========================================
    // PAYMENT
    // ==========================================

    paymentMethod: {
      type: String,
      required: true,
    },

    // ==========================================
    // ORDER ITEMS
    // ==========================================

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

        // Price captured at the time the order
        // was placed.
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

    // ==========================================
    // ORDER QUANTITIES
    // ==========================================

    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },

    // ==========================================
    // ORDER TOTALS
    // ==========================================

    // Product subtotal before delivery.
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // Delivery charge captured when the order
    // was placed.
    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
    },

    // Final amount = subtotal + deliveryCharge.
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // CURRENCY SNAPSHOT
    // ==========================================

    // Currency used when this order was placed.
    currencyCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "USD",
    },

    // Currency symbol used when this order
    // was placed.
    currencySymbol: {
      type: String,
      required: true,
      trim: true,
      default: "$",
    },

    // ==========================================
    // ORDER STATUS
    // ==========================================

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

    // Keep a permanent record of every status change.
    statusHistory: {
      type: [orderStatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// ORDER MODEL
// ==========================================

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;

