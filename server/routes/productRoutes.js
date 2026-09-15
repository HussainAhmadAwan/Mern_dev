const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
  authenticateUser,
  requireAdmin,
} = require("../middleware/authMiddleware");

const {
  getProducts,
  getAllProductsAdmin,
  getProductById,
  getProductByIdAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

// ==========================================
// ADMIN PRODUCT ROUTES
// ==========================================

// Get all products including hidden products.
router.get(
  "/admin/all",
  authenticateUser,
  requireAdmin,
  getAllProductsAdmin
);

// Get a single product including hidden products.
router.get(
  "/admin/:id",
  authenticateUser,
  requireAdmin,
  getProductByIdAdmin
);

// ==========================================
// PUBLIC PRODUCT ROUTES
// ==========================================

// Get all visible products.
router.get("/", getProducts);

// Get a single visible product.
router.get("/:id", getProductById);

// ==========================================
// ADMIN PRODUCT MUTATION ROUTES
// ==========================================

// Create a product.
router.post(
  "/",
  authenticateUser,
  requireAdmin,
  upload.array("images", 10),
  createProduct
);

// Update a product.
router.put(
  "/:id",
  authenticateUser,
  requireAdmin,
  upload.array("images", 10),
  updateProduct
);

// Delete a product.
router.delete(
  "/:id",
  authenticateUser,
  requireAdmin,
  deleteProduct
);

module.exports = router;