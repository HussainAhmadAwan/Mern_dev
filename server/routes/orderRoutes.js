const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Order = require("../models/Order");
const Product = require("../models/Product");
const Settings = require("../models/Settings");
const Coupon = require("../models/Coupon");

const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");

// ======================================================
// CONSTANTS
// ======================================================

const ALLOWED_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const NORMAL_STATUS_ORDER = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
];

// ======================================================
// HELPERS
// ======================================================

const normalizeImagePath = (image) => {
  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return image;
};

const getProductSellingPrice = (product) => {
  const price = Number(product.price || 0);

  const originalPrice = Number(
    product.originalPrice ?? price
  );

  const discountedPrice = Number(
    product.discountedPrice
  );

  const hasValidDiscount =
    product.isOnSale &&
    Number.isFinite(discountedPrice) &&
    discountedPrice >= 0 &&
    discountedPrice < originalPrice;

  return hasValidDiscount
    ? discountedPrice
    : price;
};

const canAccessOrder = (order, user) => {
  if (!order || !user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (!order.userId) {
    return false;
  }

  return (
    String(order.userId) ===
    String(user._id)
  );
};

const restoreOrderStock = async (items) => {
  if (!Array.isArray(items)) {
    return;
  }

  for (const item of items) {
    if (!item.productId) {
      continue;
    }

    await Product.findByIdAndUpdate(
      item.productId,
      {
        $inc: {
          stock: Number(item.quantity || 0),
        },
      }
    );
  }
};

const addStatusHistory = (
  order,
  from,
  to,
  changedBy,
  changedByRole
) => {
  order.statusHistory.push({
    from,
    to,
    changedBy: changedBy || null,
    changedByRole:
      changedByRole || "system",
    changedAt: new Date(),
  });
};

// ======================================================
// COUPON HELPERS
// ======================================================

const normalizeCouponCode = (code) => {
  if (
    typeof code !== "string"
  ) {
    return "";
  }

  return code
    .trim()
    .toUpperCase();
};

const roundMoney = (amount) => {
  return (
    Math.round(
      Number(amount || 0) * 100
    ) / 100
  );
};

const calculateCouponDiscount = (
  coupon,
  subtotal
) => {
  const safeSubtotal = roundMoney(
    subtotal
  );

  let discount = 0;

  if (
    coupon.discountType ===
    "fixed"
  ) {
    discount = Number(
      coupon.discountValue || 0
    );
  }

  if (
    coupon.discountType ===
    "percentage"
  ) {
    discount =
      safeSubtotal *
      (Number(
        coupon.discountValue || 0
      ) / 100);

    if (
      coupon.maximumDiscount !==
        null &&
      coupon.maximumDiscount !==
        undefined
    ) {
      discount = Math.min(
        discount,
        Number(
          coupon.maximumDiscount
        )
      );
    }
  }

  // A coupon can never reduce the subtotal below zero.
  discount = Math.min(
    discount,
    safeSubtotal
  );

  return roundMoney(
    Math.max(0, discount)
  );
};

const validateCouponForSubtotal = async (
  code,
  subtotal
) => {
  const normalizedCode =
    normalizeCouponCode(code);

  if (!normalizedCode) {
    return {
      valid: false,
      message:
        "Please enter a coupon code.",
    };
  }

  const safeSubtotal = roundMoney(
    subtotal
  );

  const coupon =
    await Coupon.findOne({
      code: normalizedCode,
    });

  if (!coupon) {
    return {
      valid: false,
      message:
        "Coupon code not found.",
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      message:
        "This coupon is currently disabled.",
    };
  }

  if (
    coupon.expiryDate &&
    new Date(coupon.expiryDate) <=
      new Date()
  ) {
    return {
      valid: false,
      message:
        "This coupon has expired.",
    };
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    Number(coupon.usedCount || 0) >=
      Number(coupon.usageLimit)
  ) {
    return {
      valid: false,
      message:
        "This coupon has reached its usage limit.",
    };
  }

  const minimumOrderAmount =
    Number(
      coupon.minimumOrderAmount || 0
    );

  if (
    safeSubtotal <
    minimumOrderAmount
  ) {
    return {
      valid: false,
      message: `Minimum order amount for this coupon is ${minimumOrderAmount.toFixed(
        2
      )}.`,
      minimumOrderAmount,
    };
  }

  const discountAmount =
    calculateCouponDiscount(
      coupon,
      safeSubtotal
    );

  return {
    valid: true,
    coupon,
    discountAmount,
    code: coupon.code,
    discountType:
      coupon.discountType,
    discountValue:
      coupon.discountValue,
    minimumOrderAmount,
    maximumDiscount:
      coupon.maximumDiscount,
  };
};

// ======================================================
// VALIDATE COUPON
// POST /orders/validate-coupon
// ======================================================

router.post(
  "/validate-coupon",
  authenticateUser,
  async (req, res) => {
    try {
      const {
        code,
        subtotal,
      } = req.body;

      const numericSubtotal =
        Number(subtotal);

      if (
        !Number.isFinite(
          numericSubtotal
        ) ||
        numericSubtotal < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order subtotal.",
        });
      }

      const result =
        await validateCouponForSubtotal(
          code,
          numericSubtotal
        );

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      return res.json({
        success: true,
        message:
          "Coupon applied successfully.",
        coupon: {
          code: result.code,
          discountType:
            result.discountType,
          discountValue:
            result.discountValue,
          minimumOrderAmount:
            result.minimumOrderAmount,
          maximumDiscount:
            result.maximumDiscount,
          discountAmount:
            result.discountAmount,
        },
      });
    } catch (error) {
      console.error(
        "Validate coupon error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to validate coupon.",
      });
    }
  }
);

// ======================================================
// CREATE ORDER
// POST /orders
// ======================================================

router.post(
  "/",
  authenticateUser,
  async (req, res) => {
    let stockDeductedItems = [];
    let couponUsageIncremented = false;
    let couponId = null;

    try {
      const {
        orderId,
        customer,
        paymentMethod,
        items,
        totalItems,
        couponCode,
      } = req.body;

      // ==========================================
      // BASIC VALIDATION
      // ==========================================

      if (
        !customer ||
        !customer.firstName ||
        !customer.lastName ||
        !customer.email ||
        !customer.phone ||
        !customer.address ||
        !customer.city ||
        !customer.zipCode
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Complete customer information is required.",
        });
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one product is required.",
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message:
            "Payment method is required.",
        });
      }

      // ==========================================
      // LOAD SETTINGS
      // ==========================================

      let settings =
        await Settings.findOne();

      if (!settings) {
        settings = await Settings.create({});
      }

      const deliveryCharge = roundMoney(
        Number(
          settings.deliveryCharge || 0
        )
      );

      const currencyCode =
        String(
          settings.currencyCode ||
            "USD"
        )
          .trim()
          .toUpperCase();

      const currencySymbol =
        String(
          settings.currencySymbol ||
            "$"
        ).trim();

      // ==========================================
      // COMBINE DUPLICATE PRODUCTS
      // ==========================================

      const quantityMap = new Map();

      for (const item of items) {
        if (!item.productId) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid product information.",
          });
        }

        const productId =
          String(item.productId);

        const quantity = Math.max(
          1,
          Number(item.quantity || 1)
        );

        if (
          !Number.isFinite(quantity)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid product quantity.",
          });
        }

        const existing =
          quantityMap.get(
            productId
          ) || 0;

        const combined =
          existing + quantity;

        if (combined > 10000) {
          return res.status(400).json({
            success: false,
            message:
              "Product quantity is too high.",
          });
        }

        quantityMap.set(
          productId,
          combined
        );
      }

      const productIds =
        Array.from(
          quantityMap.keys()
        );

      // ==========================================
      // LOAD PRODUCTS
      // ==========================================

      const products =
        await Product.find({
          _id: {
            $in: productIds,
          },
        });

      const productMap = new Map(
        products.map((product) => [
          String(product._id),
          product,
        ])
      );

      // ==========================================
      // VERIFY PRODUCTS + PRICES + STOCK
      // ==========================================

      const verifiedItems = [];

      let subtotal = 0;
      let verifiedTotalItems = 0;

      for (const productId of productIds) {
        const product =
          productMap.get(productId);

        if (!product) {
          return res.status(400).json({
            success: false,
            message:
              "One or more products are no longer available.",
          });
        }

        if (
          product.isVisible === false
        ) {
          return res.status(400).json({
            success: false,
            message: `"${product.name}" is no longer available.`,
          });
        }

        const quantity =
          quantityMap.get(
            productId
          );

        const stock = Math.max(
          0,
          Number(product.stock || 0)
        );

        if (stock < quantity) {
          return res.status(400).json({
            success: false,
            message: `"${product.name}": only ${stock} ${
              stock === 1
                ? "item is"
                : "items are"
            } available, but you requested ${quantity}.`,
          });
        }

        // IMPORTANT:
        // Ignore frontend price.
        const sellingPrice =
          roundMoney(
            getProductSellingPrice(
              product
            )
          );

        const itemTotal =
          roundMoney(
            sellingPrice *
              quantity
          );

        subtotal = roundMoney(
          subtotal + itemTotal
        );

        verifiedTotalItems +=
          quantity;

        verifiedItems.push({
          productId:
            product._id,
          name: product.name,
          image:
            normalizeImagePath(
              product.image
            ),
          price: sellingPrice,
          quantity,
        });
      }

      // ==========================================
      // VERIFY COUPON
      // ==========================================

      let couponSnapshot = null;
      let couponDiscount = 0;

      if (
        couponCode &&
        String(couponCode).trim()
      ) {
        const couponResult =
          await validateCouponForSubtotal(
            couponCode,
            subtotal
          );

        if (!couponResult.valid) {
          return res.status(400).json({
            success: false,
            message:
              couponResult.message,
          });
        }

        couponId =
          couponResult.coupon._id;

        couponDiscount =
          couponResult.discountAmount;

        couponSnapshot = {
          code:
            couponResult.coupon.code,

          discountType:
            couponResult.coupon
              .discountType,

          discountValue:
            Number(
              couponResult.coupon
                .discountValue
            ),

          discountAmount:
            couponDiscount,
        };
      }

      // ==========================================
      // FINAL TOTAL
      // ==========================================

      const totalPrice =
        roundMoney(
          subtotal -
            couponDiscount +
            deliveryCharge
        );

      // ==========================================
      // DEDUCT STOCK ATOMICALLY
      // ==========================================

      for (const item of verifiedItems) {
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id: item.productId,
              stock: {
                $gte: item.quantity,
              },
            },
            {
              $inc: {
                stock:
                  -item.quantity,
              },
            },
            {
              returnDocument: "after",
            }
          );

        if (!updatedProduct) {
          await restoreOrderStock(
            stockDeductedItems
          );

          return res.status(400).json({
            success: false,
            message: `Stock for "${item.name}" changed while placing your order. Please try again.`,
          });
        }

        stockDeductedItems.push({
          productId:
            item.productId,
          quantity:
            item.quantity,
        });
      }

      // ==========================================
      // CLAIM COUPON USAGE
      // ==========================================

      if (couponId) {
        const now = new Date();

        const couponFilter = {
          _id: couponId,
          isActive: true,

          $or: [
            {
              expiryDate: null,
            },
            {
              expiryDate: {
                $gt: now,
              },
            },
          ],

          $and: [
            {
              $or: [
                {
                  usageLimit: null,
                },
                {
                  usageLimit: {
                    $exists: false,
                  },
                },
                {
                  $expr: {
                    $lt: [
                      "$usedCount",
                      "$usageLimit",
                    ],
                  },
                },
              ],
            },
          ],
        };

        const claimedCoupon =
          await Coupon.findOneAndUpdate(
            couponFilter,
            {
              $inc: {
                usedCount: 1,
              },
            },
            {
              returnDocument: "after",
            }
          );

        if (!claimedCoupon) {
          await restoreOrderStock(
            stockDeductedItems
          );

          return res.status(400).json({
            success: false,
            message:
              "This coupon is no longer available. Please apply another coupon.",
          });
        }

        couponUsageIncremented =
          true;
      }

      // ==========================================
      // CREATE ORDER
      // ==========================================

      const order = new Order({
        userId: req.user?._id || null,

        orderId:
          orderId || null,

        customer,

        paymentMethod,

        items:
          verifiedItems,

        totalItems:
          verifiedTotalItems,

        subtotal,

        coupon:
          couponSnapshot,

        couponDiscount,

        deliveryCharge,

        totalPrice,

        currencyCode,

        currencySymbol,

        status: "Pending",

        statusHistory: [
          {
            from: null,
            to: "Pending",
            changedBy:
              req.user?._id || null,
            changedByRole:
              "system",
            changedAt:
              new Date(),
          },
        ],
      });

      const savedOrder =
        await order.save();

      return res.status(201).json({
        success: true,
        message:
          "Order created successfully.",
        order: savedOrder,
      });
    } catch (error) {
      console.error(
        "Create order error:",
        error
      );

      // ==========================================
      // ROLLBACK STOCK
      // ==========================================

      try {
        if (
          stockDeductedItems.length >
          0
        ) {
          await restoreOrderStock(
            stockDeductedItems
          );
        }
      } catch (rollbackError) {
        console.error(
          "Failed to restore stock:",
          rollbackError
        );
      }

      // ==========================================
      // ROLLBACK COUPON USAGE
      // ==========================================

      if (
        couponUsageIncremented &&
        couponId
      ) {
        try {
          await Coupon.findOneAndUpdate(
            {
              _id: couponId,
              usedCount: {
                $gt: 0,
              },
            },
            {
              $inc: {
                usedCount: -1,
              },
            }
          );
        } catch (couponRollbackError) {
          console.error(
            "Failed to restore coupon usage:",
            couponRollbackError
          );
        }
      }

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to create order.",
      });
    }
  }
);

// ======================================================
// GET ALL ORDERS
// GET /orders
// ADMIN ONLY
// ======================================================

router.get(
  "/",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const orders =
        await Order.find()
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error(
        "Get all orders error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load orders.",
      });
    }
  }
);

// ======================================================
// GET MY ORDERS
// GET /orders/my-orders
// ======================================================

router.get(
  "/my-orders",
  authenticateUser,
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          userId: req.user._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error(
        "Get my orders error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load your orders.",
      });
    }
  }
);

// ======================================================
// CANCEL ORDER
// PUT /orders/:id/cancel
// ======================================================

router.put(
  "/:id/cancel",
  authenticateUser,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      if (
        !canAccessOrder(
          order,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to cancel this order.",
        });
      }

      if (
        ![
          "Pending",
          "Processing",
        ].includes(order.status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This order can no longer be cancelled.",
        });
      }

      const previousStatus =
        order.status;

      await restoreOrderStock(
        order.items
      );

      order.status =
        "Cancelled";

      addStatusHistory(
        order,
        previousStatus,
        "Cancelled",
        req.user?._id,
        "customer"
      );

      await order.save();

      return res.json({
        success: true,
        message:
          "Order cancelled successfully.",
        order,
      });
    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to cancel order.",
      });
    }
  }
);

// ======================================================
// GET SINGLE ORDER
// GET /orders/:id
// ======================================================

router.get(
  "/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      if (
        !canAccessOrder(
          order,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to view this order.",
        });
      }

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error(
        "Get order error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load order.",
      });
    }
  }
);

// ======================================================
// GET ORDER STATUS
// GET /orders/:id/status
// ======================================================

router.get(
  "/:id/status",
  authenticateUser,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        ).select(
          "orderId status statusHistory"
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      const fullOrder =
        await Order.findById(
          req.params.id
        );

      if (
        !canAccessOrder(
          fullOrder,
          req.user
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to view this order.",
        });
      }

      return res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error(
        "Get order status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load order status.",
      });
    }
  }
);

// ======================================================
// UPDATE ORDER STATUS
// PUT /orders/:id/status
// ADMIN ONLY
// ======================================================

router.put(
  "/:id/status",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        status,
      } = req.body;

      if (
        !ALLOWED_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid order status.",
        });
      }

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            "Order not found.",
        });
      }

      if (
        order.status === status
      ) {
        return res.json({
          success: true,
          message:
            "Order status is already set to this value.",
          order,
        });
      }

      if (
        order.status ===
        "Cancelled"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cancelled orders cannot be changed.",
        });
      }

      if (
        status !== "Cancelled"
      ) {
        const currentIndex =
          NORMAL_STATUS_ORDER.indexOf(
            order.status
          );

        const newIndex =
          NORMAL_STATUS_ORDER.indexOf(
            status
          );

        if (
          currentIndex !== -1 &&
          newIndex !== -1 &&
          newIndex <
            currentIndex
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Order status cannot move backwards.",
          });
        }
      }

      const previousStatus =
        order.status;

      if (
        status === "Cancelled"
      ) {
        await restoreOrderStock(
          order.items
        );
      }

      order.status =
        status;

      addStatusHistory(
        order,
        previousStatus,
        status,
        req.user?._id,
        "admin"
      );

      await order.save();

      return res.json({
        success: true,
        message:
          "Order status updated successfully.",
        order,
      });
    } catch (error) {
      console.error(
        "Update order status error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update order status.",
      });
    }
  }
);

module.exports = router;