const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Settings = require("../models/Settings");
const Coupon = require("../models/Coupon");

const bcrypt = require("bcrypt");

const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");

const profileUpload = require("../middleware/profileUpload");

// ==========================================
// PROTECT ALL ADMIN ROUTES
// ==========================================

router.use(authenticateUser);
router.use(requireAdmin);

// ==========================================
// ADMIN GLOBAL SEARCH
// GET /admin/search?q=searchTerm
// ==========================================

router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.q?.trim();

    if (!searchTerm) {
      return res.status(200).json({
        success: true,
        products: [],
        users: [],
        orders: [],
      });
    }

    // Escape regex special characters.
    const escapedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(escapedSearchTerm, "i");

    // ==========================================
    // SEARCH PRODUCTS
    // ==========================================

    const products = await Product.find({
      $or: [
        { name: regex },
        { category: regex },
      ],
    })
      .select("_id name price category image createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    // ==========================================
    // SEARCH USERS
    // ==========================================

    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
      ],
    })
      .select("_id name email role profilePicture createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    // ==========================================
    // SEARCH ORDERS
    // ==========================================

    const orders = await Order.find({
      $or: [
        { orderId: regex },
        { "customer.firstName": regex },
        { "customer.lastName": regex },
        { "customer.email": regex },
        { "items.name": regex },
      ],
    })
      .select(
        "_id orderId customer items totalItems subtotal deliveryCharge totalPrice currencyCode currencySymbol status statusHistory createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      products,
      users,
      orders,
    });
  } catch (error) {
    console.error("Admin Search Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// ADMIN DASHBOARD STATISTICS
// GET /admin/stats
// ==========================================

router.get("/stats", async (req, res) => {
  try {
    const totalProducts =
      await Product.countDocuments();

    const totalUsers =
      await User.countDocuments();

    const orders = await Order.find();

    const totalOrders = orders.length;

    const totalRevenue = orders.reduce(
      (total, order) =>
        total + Number(order.totalPrice || 0),
      0
    );

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// GET ALL USERS
// GET /admin/users
// ==========================================

router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get Admin Users Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==========================================
// CREATE USER
// POST /admin/users
// ==========================================

router.post(
  "/users",
  profileUpload.single("profilePicture"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
      } = req.body;

      if (
        !name ||
        !email ||
        !password ||
        !role
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email, password and role are required.",
        });
      }

      if (
        !["customer", "admin"].includes(role)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Role must be either customer or admin.",
        });
      }

      const normalizedEmail =
        email.toLowerCase().trim();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "A user with this email already exists.",
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      let profilePicture = "";

      if (req.file) {
        profilePicture =
          `/uploads/profilePictures/${req.file.filename}`;
      }

      const newUser = new User({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        profilePicture,
      });

      const savedUser =
        await newUser.save();

      const userResponse =
        savedUser.toObject();

      delete userResponse.password;

      return res.status(201).json({
        success: true,
        message:
          "User created successfully.",
        user: userResponse,
      });
    } catch (error) {
      console.error(
        "Create Admin User Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// DELETE USER
// DELETE /admin/users/:userId
// ==========================================

router.delete(
  "/users/:userId",
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (
        String(user._id) ===
        String(req.user.id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own admin account.",
        });
      }

      await User.findByIdAndDelete(userId);

      return res.status(200).json({
        success: true,
        message:
          "User deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Admin User Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// GET SINGLE USER
// GET /admin/users/:userId
// ==========================================

router.get(
  "/users/:userId",
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user =
        await User.findById(userId).select(
          "-password"
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(
        "Get Admin User Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// UPDATE USER
// PUT /admin/users/:userId
// ==========================================

router.put(
  "/users/:userId",
  async (req, res) => {
    try {
      const { userId } = req.params;

      const {
        name,
        email,
        password,
        role,
      } = req.body;

      const user =
        await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (name !== undefined) {
        user.name = name;
      }

      if (email !== undefined) {
        const normalizedEmail =
          email.toLowerCase().trim();

        const existingUser =
          await User.findOne({
            email: normalizedEmail,
            _id: { $ne: userId },
          });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message:
              "Another user already has this email.",
          });
        }

        user.email = normalizedEmail;
      }

      if (
        password !== undefined &&
        password.trim() !== ""
      ) {
        user.password =
          await bcrypt.hash(
            password,
            10
          );
      }

      if (role !== undefined) {
        if (
          !["customer", "admin"].includes(
            role
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Role must be either customer or admin.",
          });
        }

        user.role = role;
      }

      const updatedUser =
        await user.save();

      const userResponse =
        updatedUser.toObject();

      delete userResponse.password;

      return res.status(200).json({
        success: true,
        message:
          "User updated successfully.",
        user: userResponse,
      });
    } catch (error) {
      console.error(
        "Update Admin User Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN SETTINGS
// GET /admin/settings
// ==========================================

router.get(
  "/settings",
  async (req, res) => {
    try {
      let settings =
        await Settings.findOne();

      if (!settings) {
        settings =
          await Settings.create({
            productCardsPerRow: 4,
            deliveryCharge: 0,
            announcementText: "",
            announcementSpeed: 20,
            currencyCode: "USD",
            currencySymbol: "$",
          });
      }

      const savedAnnouncementSpeed =
        Number(
          settings.announcementSpeed
        );

      const announcementSpeed =
        Number.isFinite(
          savedAnnouncementSpeed
        ) &&
        savedAnnouncementSpeed >= 0 &&
        savedAnnouncementSpeed <= 120
          ? savedAnnouncementSpeed
          : 20;

      res.set(
        "Cache-Control",
        "no-store"
      );

      return res.status(200).json({
        success: true,
        settings: {
          productCardsPerRow:
            settings.productCardsPerRow,

          deliveryCharge:
            settings.deliveryCharge,

          announcementText:
            settings.announcementText || "",

          announcementSpeed,

          currencyCode:
            settings.currencyCode || "USD",

          currencySymbol:
            settings.currencySymbol || "$",
        },
      });
    } catch (error) {
      console.error(
        "Admin Settings GET Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// UPDATE ADMIN SETTINGS
// PUT /admin/settings
// ==========================================

router.put(
  "/settings",
  async (req, res) => {
    try {
      const {
        productCardsPerRow,
        deliveryCharge,
        announcementText,
        announcementSpeed,
        currencyCode,
        currencySymbol,
      } = req.body;

      let settings =
        await Settings.findOne();

      if (!settings) {
        settings =
          new Settings({
            productCardsPerRow: 4,
            deliveryCharge: 0,
            announcementText: "",
            announcementSpeed: 20,
            currencyCode: "USD",
            currencySymbol: "$",
          });
      }

      // ==========================================
      // PRODUCT CARDS PER ROW
      // ==========================================

      if (
        productCardsPerRow !==
        undefined
      ) {
        const cardsPerRow =
          Number(productCardsPerRow);

        if (
          ![3, 4, 5, 6].includes(
            cardsPerRow
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Product cards per row must be 3, 4, 5, or 6.",
          });
        }

        settings.productCardsPerRow =
          cardsPerRow;
      }

      // ==========================================
      // DELIVERY CHARGE
      // ==========================================

      if (
        deliveryCharge !==
        undefined
      ) {
        const charge =
          Number(deliveryCharge);

        if (
          !Number.isFinite(charge) ||
          charge < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Delivery charge must be a valid number greater than or equal to 0.",
          });
        }

        settings.deliveryCharge =
          Math.round(charge * 100) / 100;
      }

      // ==========================================
      // ANNOUNCEMENT TEXT
      // ==========================================

      if (
        announcementText !==
        undefined
      ) {
        settings.announcementText =
          String(
            announcementText
          ).trim();
      }

      // ==========================================
      // ANNOUNCEMENT SPEED
      // ==========================================

      if (
        announcementSpeed !==
        undefined
      ) {
        const speed =
          Number(
            announcementSpeed
          );

        if (
          !Number.isFinite(speed) ||
          speed < 0 ||
          speed > 120
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Announcement speed must be between 0 and 120 seconds.",
          });
        }

        settings.announcementSpeed =
          speed;
      }

      // ==========================================
      // CURRENCY
      // ==========================================

      const SUPPORTED_CURRENCIES = {
        PKR: {
          name: "Pakistani Rupee",
          symbol: "₨",
        },

        USD: {
          name: "US Dollar",
          symbol: "$",
        },

        EUR: {
          name: "Euro",
          symbol: "€",
        },

        GBP: {
          name: "British Pound",
          symbol: "£",
        },

        AED: {
          name: "UAE Dirham",
          symbol: "د.إ",
        },

        SAR: {
          name: "Saudi Riyal",
          symbol: "﷼",
        },

        INR: {
          name: "Indian Rupee",
          symbol: "₹",
        },

        CAD: {
          name: "Canadian Dollar",
          symbol: "C$",
        },

        AUD: {
          name: "Australian Dollar",
          symbol: "A$",
        },

        JPY: {
          name: "Japanese Yen",
          symbol: "¥",
        },
      };

      if (
        currencyCode !==
        undefined
      ) {
        const normalizedCurrencyCode =
          String(
            currencyCode
          )
            .trim()
            .toUpperCase();

        const selectedCurrency =
          SUPPORTED_CURRENCIES[
            normalizedCurrencyCode
          ];

        if (!selectedCurrency) {
          return res.status(400).json({
            success: false,
            message:
              "Unsupported currency selected.",
          });
        }

        settings.currencyCode =
          normalizedCurrencyCode;

        settings.currencySymbol =
          selectedCurrency.symbol;
      } else if (
        currencySymbol !==
        undefined
      ) {
        settings.currencySymbol =
          String(
            currencySymbol
          ).trim();
      }

      // ==========================================
      // SAVE
      // ==========================================

      const savedSettings =
        await settings.save();

      const savedAnnouncementSpeed =
        Number(
          savedSettings.announcementSpeed
        );

      const finalAnnouncementSpeed =
        Number.isFinite(
          savedAnnouncementSpeed
        ) &&
        savedAnnouncementSpeed >= 0 &&
        savedAnnouncementSpeed <= 120
          ? savedAnnouncementSpeed
          : 20;

      res.set(
        "Cache-Control",
        "no-store"
      );

      return res.status(200).json({
        success: true,
        message:
          "Settings saved successfully.",
        settings: {
          productCardsPerRow:
            savedSettings.productCardsPerRow,

          deliveryCharge:
            savedSettings.deliveryCharge,

          announcementText:
            savedSettings.announcementText ||
            "",

          announcementSpeed:
            finalAnnouncementSpeed,

          currencyCode:
            savedSettings.currencyCode ||
            "USD",

          currencySymbol:
            savedSettings.currencySymbol ||
            "$",
        },
      });
    } catch (error) {
      console.error(
        "Admin Settings PUT Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// GET PUBLIC WEBSITE SETTINGS
// GET /admin/public-settings
// ==========================================

router.get(
  "/public-settings",
  async (req, res) => {
    try {
      let settings =
        await Settings.findOne();

      if (!settings) {
        settings =
          await Settings.create({
            productCardsPerRow: 4,
            deliveryCharge: 0,
            announcementText: "",
            announcementSpeed: 20,
            currencyCode: "USD",
            currencySymbol: "$",
          });
      }

      const savedAnnouncementSpeed =
        Number(
          settings.announcementSpeed
        );

      const announcementSpeed =
        Number.isFinite(
          savedAnnouncementSpeed
        ) &&
        savedAnnouncementSpeed >= 0 &&
        savedAnnouncementSpeed <= 120
          ? savedAnnouncementSpeed
          : 20;

      res.set(
        "Cache-Control",
        "no-store"
      );

      return res.status(200).json({
        success: true,
        settings: {
          productCardsPerRow:
            settings.productCardsPerRow,

          deliveryCharge:
            settings.deliveryCharge,

          announcementText:
            settings.announcementText ||
            "",

          announcementSpeed,

          currencyCode:
            settings.currencyCode ||
            "USD",

          currencySymbol:
            settings.currencySymbol ||
            "$",
        },
      });
    } catch (error) {
      console.error(
        "Admin Public Settings Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ======================================================
// COUPON MANAGEMENT
// ======================================================

// ==========================================
// GET ALL COUPONS
// GET /admin/coupons
// ==========================================

router.get(
  "/coupons",
  async (req, res) => {
    try {
      const coupons =
        await Coupon.find()
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,
        coupons,
      });
    } catch (error) {
      console.error(
        "Get coupons error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to load coupons.",
      });
    }
  }
);

// ==========================================
// CREATE COUPON
// POST /admin/coupons
// ==========================================

router.post(
  "/coupons",
  async (req, res) => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minimumOrderAmount,
        maximumDiscount,
        expiryDate,
        isActive,
        usageLimit,
      } = req.body;

      // ==========================================
      // COUPON CODE
      // ==========================================

      const normalizedCode =
        typeof code === "string"
          ? code.trim().toUpperCase()
          : "";

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Coupon code is required.",
        });
      }

      if (
        !/^[A-Z0-9_-]+$/.test(
          normalizedCode
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Coupon code can contain only letters, numbers, hyphens, and underscores.",
        });
      }

      // ==========================================
      // DISCOUNT TYPE
      // ==========================================

      if (
        !["fixed", "percentage"].includes(
          discountType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid discount type.",
        });
      }

      // ==========================================
      // DISCOUNT VALUE
      // ==========================================

      const numericDiscountValue =
        Number(discountValue);

      if (
        !Number.isFinite(
          numericDiscountValue
        ) ||
        numericDiscountValue <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Discount value must be greater than 0.",
        });
      }

      if (
        discountType === "percentage" &&
        numericDiscountValue > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Percentage discount cannot exceed 100%.",
        });
      }

      // ==========================================
      // MINIMUM ORDER AMOUNT
      // ==========================================

      const numericMinimum =
        Number(
          minimumOrderAmount ?? 0
        );

      if (
        !Number.isFinite(
          numericMinimum
        ) ||
        numericMinimum < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum order amount must be 0 or greater.",
        });
      }

      // ==========================================
      // MAXIMUM DISCOUNT
      // ==========================================

      let numericMaximum = null;

      if (
        maximumDiscount !== null &&
        maximumDiscount !== undefined &&
        String(
          maximumDiscount
        ).trim() !== ""
      ) {
        numericMaximum =
          Number(maximumDiscount);

        if (
          !Number.isFinite(
            numericMaximum
          ) ||
          numericMaximum <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Maximum discount must be greater than 0.",
          });
        }
      }

      // Maximum discount is only relevant
      // for percentage coupons.
      if (
        discountType === "fixed"
      ) {
        numericMaximum = null;
      }

      // ==========================================
      // EXPIRY DATE
      // ==========================================

      let parsedExpiry = null;

      if (
        expiryDate &&
        String(expiryDate).trim()
      ) {
        const expiryString =
          String(expiryDate).trim();

        // Date-only values are treated as
        // expiring at the end of that day.
        if (
          /^\d{4}-\d{2}-\d{2}$/.test(
            expiryString
          )
        ) {
          parsedExpiry = new Date(
            `${expiryString}T23:59:59.999`
          );
        } else {
          parsedExpiry =
            new Date(expiryString);
        }

        if (
          Number.isNaN(
            parsedExpiry.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid expiry date.",
          });
        }

        if (
          parsedExpiry <= new Date()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Expiry date must be in the future.",
          });
        }
      }

      // ==========================================
      // USAGE LIMIT
      // ==========================================

      let numericUsageLimit = null;

      if (
        usageLimit !== null &&
        usageLimit !== undefined &&
        String(
          usageLimit
        ).trim() !== ""
      ) {
        numericUsageLimit =
          Number(usageLimit);

        if (
          !Number.isInteger(
            numericUsageLimit
          ) ||
          numericUsageLimit <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Usage limit must be a whole number greater than 0.",
          });
        }
      }

      // ==========================================
      // CHECK DUPLICATE CODE
      // ==========================================

      const existingCoupon =
        await Coupon.findOne({
          code: normalizedCode,
        });

      if (existingCoupon) {
        return res.status(409).json({
          success: false,
          message:
            "A coupon with this code already exists.",
        });
      }

      // ==========================================
      // CREATE COUPON
      // ==========================================

      const coupon =
        await Coupon.create({
          code: normalizedCode,

          discountType,

          discountValue:
            Math.round(
              numericDiscountValue * 100
            ) / 100,

          minimumOrderAmount:
            Math.round(
              numericMinimum * 100
            ) / 100,

          maximumDiscount:
            numericMaximum === null
              ? null
              : Math.round(
                  numericMaximum * 100
                ) / 100,

          expiryDate:
            parsedExpiry,

          isActive:
            isActive !== false,

          usageLimit:
            numericUsageLimit,

          usedCount: 0,
        });

      return res.status(201).json({
        success: true,
        message:
          "Coupon created successfully.",
        coupon,
      });
    } catch (error) {
      console.error(
        "Create coupon error:",
        error
      );

      // MongoDB duplicate key.
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "A coupon with this code already exists.",
        });
      }

      // IMPORTANT:
      // Return the actual Mongoose error.
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to create coupon.",
      });
    }
  }
);

// ==========================================
// UPDATE COUPON
// PUT /admin/coupons/:couponId
// ==========================================

router.put(
  "/coupons/:couponId",
  async (req, res) => {
    try {
      const {
        code,
        discountType,
        discountValue,
        minimumOrderAmount,
        maximumDiscount,
        expiryDate,
        isActive,
        usageLimit,
      } = req.body;

      const coupon =
        await Coupon.findById(
          req.params.couponId
        );

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message:
            "Coupon not found.",
        });
      }

      // ==========================================
      // CODE
      // ==========================================

      const normalizedCode =
        typeof code === "string"
          ? code.trim().toUpperCase()
          : coupon.code;

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Coupon code is required.",
        });
      }

      if (
        !/^[A-Z0-9_-]+$/.test(
          normalizedCode
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Coupon code can contain only letters, numbers, hyphens, and underscores.",
        });
      }

      // ==========================================
      // DISCOUNT TYPE
      // ==========================================

      const finalDiscountType =
        discountType ||
        coupon.discountType;

      if (
        !["fixed", "percentage"].includes(
          finalDiscountType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid discount type.",
        });
      }

      // ==========================================
      // DISCOUNT VALUE
      // ==========================================

      const finalDiscountValue =
        Number(
          discountValue ??
            coupon.discountValue
        );

      if (
        !Number.isFinite(
          finalDiscountValue
        ) ||
        finalDiscountValue <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Discount value must be greater than 0.",
        });
      }

      if (
        finalDiscountType ===
          "percentage" &&
        finalDiscountValue > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Percentage discount cannot exceed 100%.",
        });
      }

      // ==========================================
      // MINIMUM ORDER
      // ==========================================

      const finalMinimum =
        Number(
          minimumOrderAmount ??
            coupon.minimumOrderAmount ??
            0
        );

      if (
        !Number.isFinite(
          finalMinimum
        ) ||
        finalMinimum < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum order amount must be 0 or greater.",
        });
      }

      // ==========================================
      // MAXIMUM DISCOUNT
      // ==========================================

      let finalMaximum = null;

      if (
        finalDiscountType ===
        "percentage"
      ) {
        const maximumInput =
          maximumDiscount !==
          undefined
            ? maximumDiscount
            : coupon.maximumDiscount;

        if (
          maximumInput !== null &&
          maximumInput !== undefined &&
          String(
            maximumInput
          ).trim() !== ""
        ) {
          finalMaximum =
            Number(maximumInput);

          if (
            !Number.isFinite(
              finalMaximum
            ) ||
            finalMaximum <= 0
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Maximum discount must be greater than 0.",
            });
          }
        }
      }

      // ==========================================
      // EXPIRY DATE
      // ==========================================

      let finalExpiry = null;

      if (
        expiryDate !== undefined &&
        expiryDate !== null &&
        String(
          expiryDate
        ).trim() !== ""
      ) {
        const expiryString =
          String(expiryDate).trim();

        if (
          /^\d{4}-\d{2}-\d{2}$/.test(
            expiryString
          )
        ) {
          finalExpiry = new Date(
            `${expiryString}T23:59:59.999`
          );
        } else {
          finalExpiry =
            new Date(expiryString);
        }

        if (
          Number.isNaN(
            finalExpiry.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid expiry date.",
          });
        }

        if (
          finalExpiry <= new Date()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Expiry date must be in the future.",
          });
        }
      }

      // ==========================================
      // USAGE LIMIT
      // ==========================================

      let finalUsageLimit = null;

      if (
        usageLimit !== undefined &&
        usageLimit !== null &&
        String(
          usageLimit
        ).trim() !== ""
      ) {
        finalUsageLimit =
          Number(usageLimit);

        if (
          !Number.isInteger(
            finalUsageLimit
          ) ||
          finalUsageLimit <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Usage limit must be a whole number greater than 0.",
          });
        }

        if (
          finalUsageLimit <
          Number(
            coupon.usedCount || 0
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Usage limit cannot be lower than the number of coupons already used.",
          });
        }
      }

      // ==========================================
      // CHECK DUPLICATE CODE
      // ==========================================

      const duplicate =
        await Coupon.findOne({
          code: normalizedCode,
          _id: {
            $ne: coupon._id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "A coupon with this code already exists.",
        });
      }

      // ==========================================
      // UPDATE
      // ==========================================

      coupon.code =
        normalizedCode;

      coupon.discountType =
        finalDiscountType;

      coupon.discountValue =
        Math.round(
          finalDiscountValue * 100
        ) / 100;

      coupon.minimumOrderAmount =
        Math.round(
          finalMinimum * 100
        ) / 100;

      coupon.maximumDiscount =
        finalMaximum === null
          ? null
          : Math.round(
              finalMaximum * 100
            ) / 100;

      coupon.expiryDate =
        finalExpiry;

      coupon.isActive =
        isActive !== false;

      coupon.usageLimit =
        finalUsageLimit;

      await coupon.save();

      return res.status(200).json({
        success: true,
        message:
          "Coupon updated successfully.",
        coupon,
      });
    } catch (error) {
      console.error(
        "Update coupon error:",
        error
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "A coupon with this code already exists.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to update coupon.",
      });
    }
  }
);

// ==========================================
// DELETE COUPON
// DELETE /admin/coupons/:couponId
// ==========================================

router.delete(
  "/coupons/:couponId",
  async (req, res) => {
    try {
      const coupon =
        await Coupon.findByIdAndDelete(
          req.params.couponId
        );

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message:
            "Coupon not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Coupon deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete coupon error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to delete coupon.",
      });
    }
  }
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;

