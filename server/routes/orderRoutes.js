
const express = require("express");

const router = express.Router();

const Order = require("../models/Order");
const Product = require("../models/Product");
const Settings = require("../models/Settings");

const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");

// ==========================================
// ALLOWED ORDER STATUSES
// ==========================================

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

// ==========================================
// NORMALIZE IMAGE PATH
// ==========================================

const normalizeImagePath = (image) => {
  if (!image) {
    return "";
  }

  let imagePath = String(image).trim();

  if (!imagePath) {
    return "";
  }

  // Convert Windows backslashes to web slashes.
  imagePath = imagePath.replace(/\\/g, "/");

  // Keep complete external URLs unchanged.
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  // Remove localhost backend URL if an old
  // product contains it.
  imagePath = imagePath.replace(
    /^https?:\/\/localhost:\d+/i,
    ""
  );

  // Remove duplicate leading slashes.
  imagePath = imagePath.replace(/^\/+/, "");

  // Make sure local product images use uploads path.
  if (imagePath.startsWith("uploads/")) {
    return `/${imagePath}`;
  }

  // Handle product-images/example.jpg.
  if (imagePath.startsWith("product-images/")) {
    return `/uploads/${imagePath}`;
  }

  // Handle profile-pictures/example.jpg.
  if (imagePath.startsWith("profile-pictures/")) {
    return `/uploads/${imagePath}`;
  }

  // Handle paths that already contain /uploads/.
  if (imagePath.includes("/uploads/")) {
    return `/${imagePath.replace(/^.*\/uploads\//, "uploads/")}`;
  }

  // Fall back to the existing relative path.
  return `/${imagePath}`;
};

// ==========================================
// GET ACTUAL SELLING PRICE
// ==========================================

const getProductSellingPrice = (product) => {
  const regularPrice = Number(product.price || 0);

  const discountedPrice = Number(
    product.discountedPrice
  );

  if (
    product.isOnSale &&
    Number.isFinite(discountedPrice) &&
    discountedPrice >= 0 &&
    discountedPrice < regularPrice
  ) {
    return Math.round(discountedPrice * 100) / 100;
  }

  return Math.round(regularPrice * 100) / 100;
};

// ==========================================
// CHECK ORDER ACCESS
// ==========================================

const canAccessOrder = (req, order) => {
  const userId = String(req.user?.id || "");
  const orderUserId = String(order.userId || "");

  return (
    req.user?.role === "admin" ||
    userId === orderUserId
  );
};

// ==========================================
// RESTORE STOCK
// ==========================================

const restoreOrderStock = async (order) => {
  const restoredProducts = [];

  for (const item of order.items || []) {
    const quantity = Number(item.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      continue;
    }

    const product =
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            stock: quantity,
          },
        },
        {
          new: true,
        }
      );

    if (!product) {
      // Roll back stock already restored if another
      // product in the order no longer exists.
      for (const restored of restoredProducts) {
        await Product.findByIdAndUpdate(
          restored.productId,
          {
            $inc: {
              stock: -restored.quantity,
            },
          }
        );
      }

      throw new Error(
        `Unable to restore stock for product ${item.productId}.`
      );
    }

    restoredProducts.push({
      productId: item.productId,
      quantity,
    });
  }

  return restoredProducts;
};

// ==========================================
// ADD STATUS HISTORY ENTRY
// ==========================================

const addStatusHistory = (
  order,
  from,
  to,
  userId,
  role
) => {
  order.statusHistory.push({
    from,
    to,
    changedBy: userId || null,
    changedByRole: role || "system",
    changedAt: new Date(),
  });
};

// ==========================================
// CREATE ORDER
// POST /orders
// ==========================================

router.post(
  "/",
  authenticateUser,
  async (req, res) => {
    try {
      const {
        orderId,
        customer,
        paymentMethod,
        items,
      } = req.body;

      const userId = req.user.id;

      // ==========================================
      // VALIDATE ORDER ID
      // ==========================================

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required.",
        });
      }

      // ==========================================
      // VALIDATE CUSTOMER
      // ==========================================

      if (
        !customer ||
        typeof customer !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer information is required.",
        });
      }

      const requiredCustomerFields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "address",
        "city",
        "zipCode",
      ];

      for (const field of requiredCustomerFields) {
        if (
          !String(customer[field] || "").trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} is required.`,
          });
        }
      }

      // ==========================================
      // VALIDATE ITEMS
      // ==========================================

      if (
        !items ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Order must contain at least one product.",
        });
      }

      // ==========================================
      // VALIDATE PAYMENT
      // ==========================================

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message: "Payment method is required.",
        });
      }

      // ==========================================
      // GET CURRENT SETTINGS
      // ==========================================

      let settings = await Settings.findOne();

      if (!settings) {
        settings = await Settings.create({
          productCardsPerRow: 4,
          deliveryCharge: 0,
          announcementText: "",
          currencyCode: "USD",
          currencySymbol: "$",
        });
      }

      // ==========================================
      // DELIVERY CHARGE
      // ==========================================

      const deliveryChargeValue = Number(
        settings.deliveryCharge || 0
      );

      const deliveryCharge =
        Number.isFinite(deliveryChargeValue) &&
        deliveryChargeValue >= 0
          ? Math.round(
              deliveryChargeValue * 100
            ) / 100
          : 0;

      // ==========================================
      // CURRENCY SNAPSHOT
      // ==========================================

      const currencyCode =
        String(
          settings.currencyCode || "USD"
        )
          .trim()
          .toUpperCase() || "USD";

      const currencySymbol =
        String(
          settings.currencySymbol || "$"
        ).trim() || "$";

      // ==========================================
      // COMBINE DUPLICATE PRODUCTS
      // ==========================================

      const requestedQuantities = new Map();

      for (const item of items) {
        const productId = String(
          item.productId || ""
        ).trim();

        if (!productId) {
          return res.status(400).json({
            success: false,
            message: "Product ID is required.",
          });
        }

        const quantity = Number(
          item.quantity
        );

        if (
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Product quantity must be at least 1.",
          });
        }

        const currentQuantity =
          requestedQuantities.get(productId) || 0;

        const newQuantity =
          currentQuantity + quantity;

        if (newQuantity > 10000) {
          return res.status(400).json({
            success: false,
            message:
              "Requested product quantity is too large.",
          });
        }

        requestedQuantities.set(
          productId,
          newQuantity
        );
      }

      // ==========================================
      // GET CURRENT PRODUCTS
      // ==========================================

      const productIds = Array.from(
        requestedQuantities.keys()
      );

      const products = await Product.find({
        _id: {
          $in: productIds,
        },
      });

      const productMap = new Map();

      products.forEach((product) => {
        productMap.set(
          product._id.toString(),
          product
        );
      });

      // ==========================================
      // PREPARE VERIFIED ORDER ITEMS
      // ==========================================

      let subtotal = 0;
      let totalItems = 0;

      const verifiedItems = [];

      for (const [
        productId,
        quantity,
      ] of requestedQuantities) {
        const product =
          productMap.get(productId);

        // Product does not exist.
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product not found: ${productId}.`,
          });
        }

        // Product is hidden.
        if (product.isVisible === false) {
          return res.status(400).json({
            success: false,
            message: `The product "${product.name}" is no longer available.`,
          });
        }

        // ==========================================
        // CHECK STOCK
        // ==========================================

        const availableStock = Number(
          product.stock || 0
        );

        if (quantity > availableStock) {
          return res.status(400).json({
            success: false,
            message: `Only ${availableStock} ${
              availableStock === 1
                ? "item is"
                : "items are"
            } available for "${product.name}".`,
          });
        }

        // ==========================================
        // NEVER TRUST FRONTEND PRICE
        // ==========================================

        const price =
          getProductSellingPrice(product);

        const itemTotal =
          price * quantity;

        subtotal += itemTotal;
        totalItems += quantity;

        // ==========================================
        // NORMALIZE IMAGE
        // ==========================================

        const normalizedImage =
          normalizeImagePath(product.image);

        verifiedItems.push({
          productId: product._id,
          name: product.name,
          image: normalizedImage,
          price,
          quantity,
        });
      }

      // ==========================================
      // CALCULATE FINAL TOTAL
      // ==========================================

      subtotal =
        Math.round(subtotal * 100) / 100;

      const totalPrice =
        Math.round(
          (subtotal + deliveryCharge) * 100
        ) / 100;

      // ==========================================
      // DEDUCT STOCK ATOMICALLY
      // ==========================================

      const updatedProducts = [];

      for (const verifiedItem of verifiedItems) {
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id: verifiedItem.productId,
              isVisible: {
                $ne: false,
              },
              stock: {
                $gte: verifiedItem.quantity,
              },
            },
            {
              $inc: {
                stock: -verifiedItem.quantity,
              },
            },
            {
              new: true,
            }
          );

        // Another order may have taken the stock.
        if (!updatedProduct) {
          // Restore stock already deducted.
          for (const deductedProduct of updatedProducts) {
            await Product.findByIdAndUpdate(
              deductedProduct.productId,
              {
                $inc: {
                  stock:
                    deductedProduct.quantity,
                },
              }
            );
          }

          return res.status(400).json({
            success: false,
            message:
              "Some products are no longer available in the requested quantity. Please refresh your cart and try again.",
          });
        }

        updatedProducts.push({
          productId: verifiedItem.productId,
          quantity: verifiedItem.quantity,
        });
      }

      // ==========================================
      // CREATE VERIFIED ORDER
      // ==========================================

      const order = new Order({
        userId,

        orderId,

        customer: {
          firstName: String(
            customer.firstName
          ).trim(),

          lastName: String(
            customer.lastName
          ).trim(),

          email: String(
            customer.email
          ).trim(),

          phone: String(
            customer.phone
          ).trim(),

          address: String(
            customer.address
          ).trim(),

          city: String(
            customer.city
          ).trim(),

          zipCode: String(
            customer.zipCode
          ).trim(),
        },

        paymentMethod,

        items: verifiedItems,

        totalItems,

        // Saved order totals.
        subtotal,

        deliveryCharge,

        totalPrice,

        // Saved currency snapshot.
        currencyCode,

        currencySymbol,

        // New orders always begin as Pending.
        status: "Pending",

        // Record initial status.
        statusHistory: [
          {
            from: null,
            to: "Pending",
            changedBy: userId,
            changedByRole: "customer",
            changedAt: new Date(),
          },
        ],
      });

      // ==========================================
      // SAVE ORDER
      // ==========================================

      let savedOrder;

      try {
        savedOrder = await order.save();
      } catch (orderError) {
        // Roll back stock if order creation fails.
        for (const deductedProduct of updatedProducts) {
          await Product.findByIdAndUpdate(
            deductedProduct.productId,
            {
              $inc: {
                stock:
                  deductedProduct.quantity,
              },
            }
          );
        }

        throw orderError;
      }

      // ==========================================
      // RESPONSE
      // ==========================================

      res.status(201).json({
        success: true,
        message: "Order created successfully.",
        order: savedOrder,
      });
    } catch (error) {
      console.error(
        "Create Order Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// GET ALL ORDERS
// GET /orders
// ADMIN ONLY
// ==========================================

router.get(
  "/",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const orders = await Order.find()
        .sort({
          createdAt: -1,
        });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error(
        "Get Orders Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// GET LOGGED-IN USER ORDERS
// GET /orders/my-orders
// ==========================================

router.get(
  "/my-orders",
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const orders = await Order.find({
        userId,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error(
        "Get My Orders Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// CANCEL MY ORDER
// PUT /orders/:id/cancel
// ==========================================

router.put(
  "/:id/cancel",
  authenticateUser,
  async (req, res) => {
    try {
      const userId = req.user.id;

      const order = await Order.findOne({
        _id: req.params.id,
        userId,
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      const currentStatus =
        order.status || "Pending";

      // ==========================================
      // CHECK CANCELLATION RULES
      // ==========================================

      if (
        currentStatus !== "Pending" &&
        currentStatus !== "Processing"
      ) {
        if (currentStatus === "Shipped") {
          return res.status(400).json({
            success: false,
            message:
              "You cannot cancel an order that has already shipped.",
          });
        }

        if (currentStatus === "Delivered") {
          return res.status(400).json({
            success: false,
            message:
              "A delivered order cannot be cancelled.",
          });
        }

        if (currentStatus === "Cancelled") {
          return res.status(400).json({
            success: false,
            message:
              "This order has already been cancelled.",
          });
        }

        return res.status(400).json({
          success: false,
          message:
            "This order cannot be cancelled.",
        });
      }

      // ==========================================
      // RESTORE STOCK
      // ==========================================

      await restoreOrderStock(order);

      // ==========================================
      // UPDATE STATUS
      // ==========================================

      order.status = "Cancelled";

      addStatusHistory(
        order,
        currentStatus,
        "Cancelled",
        userId,
        "customer"
      );

      const updatedOrder =
        await order.save();

      res.status(200).json({
        success: true,
        message:
          "Order cancelled successfully and stock restored.",
        order: updatedOrder,
      });
    } catch (error) {
      console.error(
        "Cancel Order Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// GET SINGLE ORDER
// GET /orders/:id
// OWNER OR ADMIN
// ==========================================

router.get(
  "/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const order = await Order.findById(
        req.params.id
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (!canAccessOrder(req, order)) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view this order.",
        });
      }

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error) {
      console.error(
        "Get Single Order Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// GET ORDER STATUS
// GET /orders/:id/status
// OWNER OR ADMIN
// ==========================================

router.get(
  "/:id/status",
  authenticateUser,
  async (req, res) => {
    try {
      const order = await Order.findById(
        req.params.id
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (!canAccessOrder(req, order)) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view this order status.",
        });
      }

      res.status(200).json({
        success: true,
        orderId: order._id,
        status: order.status || "Pending",
        statusHistory:
          order.statusHistory || [],
      });
    } catch (error) {
      console.error(
        "Get Order Status Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// UPDATE ORDER STATUS
// PUT /orders/:id/status
// ADMIN ONLY
// ==========================================

router.put(
  "/:id/status",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      // ==========================================
      // VALIDATE STATUS
      // ==========================================

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required.",
        });
      }

      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status.",
        });
      }

      // ==========================================
      // GET ORDER
      // ==========================================

      const order = await Order.findById(
        req.params.id
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      const currentStatus =
        order.status || "Pending";

      // ==========================================
      // NO CHANGE
      // ==========================================

      if (currentStatus === status) {
        return res.status(200).json({
          success: true,
          message:
            "Order status is already set to this status.",
          order,
        });
      }

      // ==========================================
      // CANCELLED ORDERS ARE FINAL
      // ==========================================

      if (currentStatus === "Cancelled") {
        return res.status(400).json({
          success: false,
          message:
            "A cancelled order cannot be reopened.",
        });
      }

      // ==========================================
      // DELIVERED ORDERS ARE FINAL
      // ==========================================

      if (currentStatus === "Delivered") {
        return res.status(400).json({
          success: false,
          message:
            "A delivered order cannot be moved to another status.",
        });
      }

      // ==========================================
      // HANDLE ADMIN CANCELLATION
      // ==========================================

      if (status === "Cancelled") {
        if (
          currentStatus !== "Pending" &&
          currentStatus !== "Processing"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Only Pending or Processing orders can be cancelled.",
          });
        }

        // Restore the stock because the order
        // will no longer consume inventory.
        await restoreOrderStock(order);

        order.status = "Cancelled";

        addStatusHistory(
          order,
          currentStatus,
          "Cancelled",
          req.user.id,
          "admin"
        );

        const cancelledOrder =
          await order.save();

        return res.status(200).json({
          success: true,
          message:
            "Order cancelled successfully and stock restored.",
          order: cancelledOrder,
        });
      }

      // ==========================================
      // PREVENT BACKWARD STATUS MOVEMENT
      // ==========================================

      const currentIndex =
        NORMAL_STATUS_ORDER.indexOf(
          currentStatus
        );

      const newIndex =
        NORMAL_STATUS_ORDER.indexOf(status);

      if (
        currentIndex !== -1 &&
        newIndex !== -1 &&
        newIndex < currentIndex
      ) {
        return res.status(400).json({
          success: false,
          message: `An order cannot move from "${currentStatus}" back to "${status}".`,
        });
      }

      // ==========================================
      // UPDATE NORMAL STATUS
      // ==========================================

      order.status = status;

      addStatusHistory(
        order,
        currentStatus,
        status,
        req.user.id,
        "admin"
      );

      const updatedOrder =
        await order.save();

      res.status(200).json({
        success: true,
        message:
          "Order status updated successfully.",
        order: updatedOrder,
      });
    } catch (error) {
      console.error(
        "Update Order Status Error:",
        error
      );

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;

