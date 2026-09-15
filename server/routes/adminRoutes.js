
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Settings = require("../models/Settings");

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

    // Escape regex special characters so the search
    // term cannot create an invalid regular expression.
    const escapedSearchTerm = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const regex = new RegExp(
      escapedSearchTerm,
      "i"
    );

    // ==========================================
    // SEARCH PRODUCTS
    // ==========================================

    const products = await Product.find({
      $or: [
        { name: regex },
        { category: regex },
      ],
    })
      .select(
        "_id name price category image createdAt"
      )
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
      .select(
        "_id name email role profilePicture createdAt"
      )
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

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(200).json({
      success: true,
      products,
      users,
      orders,
    });
  } catch (error) {
    console.error(
      "Admin Search Error:",
      error
    );

    res.status(500).json({
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
    // Count products.
    const totalProducts =
      await Product.countDocuments();

    // Count users.
    const totalUsers =
      await User.countDocuments();

    // Get all orders.
    const orders = await Order.find();

    // Count orders.
    const totalOrders = orders.length;

    // Calculate total revenue.
    const totalRevenue = orders.reduce(
      (total, order) =>
        total + Number(order.totalPrice || 0),
      0
    );

    // Get latest five orders.
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
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

    res.status(500).json({
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

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Get Admin Users Error:",
      error
    );

    res.status(500).json({
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

      // ==========================================
      // VALIDATION
      // ==========================================

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

      // Check duplicate email.
      const existingUser =
        await User.findOne({
          email: email.toLowerCase(),
        });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "A user with this email already exists.",
        });
      }

      // ==========================================
      // HASH PASSWORD
      // ==========================================

      const hashedPassword =
        await bcrypt.hash(password, 10);

      // ==========================================
      // PROFILE PICTURE
      // ==========================================

      let profilePicture = "";

      if (req.file) {
        profilePicture =
          `/uploads/profilePictures/${req.file.filename}`;
      }

      // ==========================================
      // CREATE USER
      // ==========================================

      const newUser = new User({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
        profilePicture,
      });

      const savedUser =
        await newUser.save();

      // Remove password before sending response.
      const userResponse =
        savedUser.toObject();

      delete userResponse.password;

      res.status(201).json({
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

      res.status(500).json({
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

      // Prevent admin from deleting
      // their own account.
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

      res.status(200).json({
        success: true,
        message:
          "User deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Admin User Error:",
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

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(
        "Get Admin User Error:",
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

      // ==========================================
      // UPDATE NAME
      // ==========================================

      if (name !== undefined) {
        user.name = name;
      }

      // ==========================================
      // UPDATE EMAIL
      // ==========================================

      if (email !== undefined) {
        const normalizedEmail =
          email.toLowerCase();

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

      // ==========================================
      // UPDATE PASSWORD
      // ==========================================

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

      // ==========================================
      // UPDATE ROLE
      // ==========================================

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

      res.status(200).json({
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

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ==========================================
// ADMIN SETTINGS
// ==========================================

// ==========================================
// GET /admin/settings
// ==========================================

router.get(
  "/settings",
  async (req, res) => {
    try {
      // Find existing settings.
      let settings =
        await Settings.findOne();

      // Create default settings if none exist.
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

      // Safely read the saved announcement speed.
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

      // Prevent stale settings from being returned after refresh.
      res.set(
        "Cache-Control",
        "no-store"
      );

      res.status(200).json({
        success: true,

        settings: {
          productCardsPerRow:
            settings.productCardsPerRow,

          deliveryCharge:
            settings.deliveryCharge,

          announcementText:
            settings.announcementText ||
            "",

          // Return the actual saved ticker speed.
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
        "Admin Settings GET Error:",
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

      // ==========================================
      // FIND EXISTING SETTINGS
      // ==========================================

      let settings =
        await Settings.findOne();

      // Create settings if they don't exist.
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
          Number(
            productCardsPerRow
          );

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
          Number(
            deliveryCharge
          );

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

        // Keep delivery charge to two decimal places.
        settings.deliveryCharge =
          Math.round(
            charge * 100
          ) / 100;
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

        // 0 is intentionally valid because it means still.
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

        // Save the exact speed selected by the admin.
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

      // Only update currency when the frontend
      // actually sends a currency code.
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

        // Save currency code.
        settings.currencyCode =
          normalizedCurrencyCode;

        // Get the official symbol from the backend list.
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
      // SAVE TO MONGODB
      // ==========================================

      const savedSettings =
        await settings.save();

      // ==========================================
      // READ SAVED ANNOUNCEMENT SPEED
      // ==========================================

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

      // ==========================================
      // RETURN SAVED SETTINGS
      // ==========================================

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.status(200).json({
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

          // Return the exact value that MongoDB saved.
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

      res.status(500).json({
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

      res.status(200).json({
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

      res.status(500).json({
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

router.put("/settings", async (req, res) => {
  try {
    const {
      productCardsPerRow,
      deliveryCharge,
      announcementText,

      // IMPORTANT:
      // Receive currency from AdminSettings.jsx.
      currencyCode,
      currencySymbol,
    } = req.body;

    // ==========================================
    // FIND EXISTING SETTINGS
    // ==========================================

    let settings =
      await Settings.findOne();

    // Create settings if they don't exist.
    if (!settings) {
      settings = new Settings({
        productCardsPerRow: 4,
        deliveryCharge: 0,
        announcementText: "",
        currencyCode: "USD",
        currencySymbol: "$",
      });
    }

    // ==========================================
    // PRODUCT CARDS PER ROW
    // ==========================================

    if (
      productCardsPerRow !== undefined
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
      deliveryCharge !== undefined
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

      // Keep delivery charge to
      // two decimal places.
      settings.deliveryCharge =
        Math.round(charge * 100) / 100;
    }

    // ==========================================
    // ANNOUNCEMENT TEXT
    // ==========================================

    if (
      announcementText !== undefined
    ) {
      settings.announcementText =
        String(
          announcementText
        ).trim();
    }

    // ==========================================
    // CURRENCY
    // ==========================================

    /*
     * IMPORTANT:
     *
     * This was the missing part.
     *
     * AdminSettings.jsx sends:
     *
     * currencyCode
     * currencySymbol
     *
     * but the previous backend code did not
     * receive or save them.
     */

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

    // Only update currency when the frontend
    // actually sends a currency code.
    if (
      currencyCode !== undefined
    ) {
      const normalizedCurrencyCode =
        String(currencyCode)
          .trim()
          .toUpperCase();

      // Check whether the currency is supported.
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

      // Save currency code.
      settings.currencyCode =
        normalizedCurrencyCode;

      /*
       * IMPORTANT:
       *
       * Do NOT blindly trust the symbol
       * sent by the browser.
       *
       * Get the official symbol from the
       * backend currency list.
       */
      settings.currencySymbol =
        selectedCurrency.symbol;
    } else if (
      currencySymbol !== undefined
    ) {
      /*
       * This allows the symbol to be updated
       * only if currencyCode was not supplied.
       *
       * Normally AdminSettings.jsx sends
       * both values, so this branch will not
       * normally be used.
       */
      settings.currencySymbol =
        String(currencySymbol).trim();
    }

    // ==========================================
    // SAVE TO MONGODB
    // ==========================================

    const savedSettings =
      await settings.save();

    // ==========================================
    // RETURN SAVED SETTINGS
    // ==========================================

    res.status(200).json({
      success: true,

      message:
        "Settings saved successfully.",

      settings: {
        productCardsPerRow:
          savedSettings.productCardsPerRow,

        deliveryCharge:
          savedSettings.deliveryCharge,

        announcementText:
          savedSettings.announcementText || "",

        currencyCode:
          savedSettings.currencyCode || "USD",

        currencySymbol:
          savedSettings.currencySymbol || "$",
      },
    });
  } catch (error) {
    console.error(
      "Admin Settings PUT Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

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
            currencyCode: "USD",
            currencySymbol: "$",
          });
      }

      res.status(200).json({
        success: true,

        settings: {
          productCardsPerRow:
            settings.productCardsPerRow,

          deliveryCharge:
            settings.deliveryCharge,

          announcementText:
            settings.announcementText || "",

          currencyCode:
            settings.currencyCode || "USD",

          currencySymbol:
            settings.currencySymbol || "$",
        },
      });
    } catch (error) {
      console.error(
        "Admin Public Settings Error:",
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
// EXPORT ROUTER
// ==========================================

module.exports = router;

