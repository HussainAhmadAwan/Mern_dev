const Product = require("../models/Product");

// Adjust whole-number prices to end in .99.
const adjustPrice = (price) => {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return 0;
  }

  if (Number.isInteger(numericPrice)) {
    return Math.max(0, numericPrice - 0.01);
  }

  return Math.round(numericPrice * 100) / 100;
};

// Convert a value into a safe non-negative number.
const parsePrice = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return numericValue;
};

// Parse a boolean value safely from multipart/form-data.
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
};

// Build and validate sale pricing.
const prepareSalePricing = ({
  price,
  originalPrice,
  discountedPrice,
  isOnSale,
}) => {
  const regularPrice = parsePrice(price);

  if (regularPrice === null) {
    return {
      error: "Price must be a valid number greater than or equal to 0.",
    };
  }

  const saleEnabled = parseBoolean(isOnSale, false);

  if (!saleEnabled) {
    return {
      price: adjustPrice(regularPrice),
      originalPrice: null,
      discountedPrice: null,
      isOnSale: false,
    };
  }

  const suppliedOriginalPrice = parsePrice(
    originalPrice !== undefined &&
      originalPrice !== null &&
      originalPrice !== ""
      ? originalPrice
      : regularPrice
  );

  const salePrice = parsePrice(discountedPrice);

  if (suppliedOriginalPrice === null) {
    return {
      error:
        "Original price must be a valid number greater than or equal to 0.",
    };
  }

  if (salePrice === null) {
    return {
      error:
        "Discounted price must be a valid number greater than or equal to 0.",
    };
  }

  if (salePrice >= suppliedOriginalPrice) {
    return {
      error: "Discounted price must be lower than the original price.",
    };
  }

  const adjustedOriginalPrice =
    adjustPrice(suppliedOriginalPrice);

  const adjustedDiscountedPrice =
    adjustPrice(salePrice);

  if (adjustedDiscountedPrice >= adjustedOriginalPrice) {
    return {
      error:
        "Discounted price must be lower than the original price after price adjustment.",
    };
  }

  return {
    price: adjustedOriginalPrice,
    originalPrice: adjustedOriginalPrice,
    discountedPrice: adjustedDiscountedPrice,
    isOnSale: true,
  };
};

// Parse additional image URLs.
const parseImageUrls = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed =
      typeof value === "string"
        ? JSON.parse(value)
        : value;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((url) => String(url).trim())
      .filter(Boolean);
  } catch (error) {
    return [];
  }
};

// Parse removed images.
const parseRemovedImages = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed =
      typeof value === "string"
        ? JSON.parse(value)
        : value;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((image) => String(image).trim())
      .filter(Boolean);
  } catch (error) {
    return [];
  }
};

// Create the complete image list.
const buildImageList = ({
  uploadedImages,
  additionalImageUrls,
}) => {
  const uploadedPaths = uploadedImages.map(
    (file) => `/uploads/${file.filename}`
  );

  return [
    ...uploadedPaths,
    ...additionalImageUrls,
  ];
};

// ==========================================
// GET PUBLIC PRODUCTS
// GET /api/products
// ==========================================

const getProducts = async (req, res) => {
  try {
    const filter = {
      // Products without isVisible are treated as visible for backwards compatibility.
      isVisible: { $ne: false },
    };

    // Filter by sale status.
    if (req.query.sale === "true") {
      filter.isOnSale = true;
    }

    // Filter by category.
    if (
      req.query.category &&
      req.query.category.trim()
    ) {
      filter.category = req.query.category.trim();
    }

    // Search products.
    if (
      req.query.search &&
      req.query.search.trim()
    ) {
      const searchRegex = new RegExp(
        req.query.search.trim(),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "Get Public Products Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET ALL PRODUCTS FOR ADMIN
// GET /api/products/admin/all
// ==========================================

const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "Get Admin Products Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET SINGLE PUBLIC PRODUCT
// GET /api/products/:id
// ==========================================

const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isVisible: { $ne: false },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Get Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET SINGLE PRODUCT FOR ADMIN
// GET /api/products/admin/:id
// ==========================================

const getProductByIdAdmin = async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Get Admin Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// CREATE PRODUCT
// POST /api/products
// ==========================================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      originalPrice,
      discountedPrice,
      isOnSale,
      image,
      description,
      category,
      stock,
      rating,
      isVisible,
      freeShipping,
      returns30Days,
      secureCheckout,
      warranty1Year,
      additionalImageUrls,
      mainImageType,
      mainImageUrl,
      mainImagePath,
      mainImageIndex,
    } = req.body;

    // Validate required fields.
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Product name and description are required.",
      });
    }

    // Prepare sale pricing.
    const salePricing =
      prepareSalePricing({
        price,
        originalPrice,
        discountedPrice,
        isOnSale,
      });

    if (salePricing.error) {
      return res.status(400).json({
        success: false,
        message: salePricing.error,
      });
    }

    // Parse image URLs.
    const imageUrls =
      parseImageUrls(additionalImageUrls);

    // Get uploaded image paths.
    const uploadedImages = Array.isArray(
      req.files
    )
      ? req.files
      : [];

    const uploadedPaths = uploadedImages.map(
      (file) => `/uploads/${file.filename}`
    );

    // Combine uploaded images and image URLs.
    let allImages = [
      ...uploadedPaths,
      ...imageUrls,
    ];

    // Support the existing single image field.
    if (
      image &&
      !allImages.includes(image)
    ) {
      allImages.push(image);
    }

    // Require at least one image.
    if (allImages.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one product image is required.",
      });
    }

    // Determine the main image.
    let mainImage = allImages[0];

    if (
      mainImageType === "url" &&
      mainImageUrl
    ) {
      mainImage = mainImageUrl;
    }

    if (
      mainImageType === "existing-file" &&
      mainImagePath
    ) {
      mainImage = mainImagePath;
    }

    if (
      mainImageType === "file" &&
      mainImageIndex !== undefined
    ) {
      const index = Number(mainImageIndex);

      if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < uploadedPaths.length
      ) {
        mainImage = uploadedPaths[index];
      }
    }

    // Make sure the selected main image exists in the image list.
    if (
      mainImage &&
      !allImages.includes(mainImage)
    ) {
      allImages.unshift(mainImage);
    }

    const numericStock = Number(stock || 0);
    const numericRating = Number(rating || 0);

    // Validate stock.
    if (
      !Number.isFinite(numericStock) ||
      numericStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Stock must be a valid number greater than or equal to 0.",
      });
    }

    // Validate rating.
    if (
      !Number.isFinite(numericRating) ||
      numericRating < 0 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rating must be between 0 and 5.",
      });
    }

    // Create the product.
    const product = new Product({
      name: name.trim(),

      price: salePricing.price,

      originalPrice:
        salePricing.originalPrice,

      discountedPrice:
        salePricing.discountedPrice,

      isOnSale:
        salePricing.isOnSale,

      image: mainImage,

      images: allImages,

      description:
        description.trim(),

      category:
        category?.trim() || "General",

      stock: numericStock,

      rating: numericRating,

      isVisible: parseBoolean(
        isVisible,
        true
      ),

      // Save the four product feature settings.
      freeShipping: parseBoolean(
        freeShipping,
        true
      ),

      returns30Days: parseBoolean(
        returns30Days,
        true
      ),

      secureCheckout: parseBoolean(
        secureCheckout,
        true
      ),

      warranty1Year: parseBoolean(
        warranty1Year,
        true
      ),
    });

    const savedProduct =
      await product.save();

    res.status(201).json({
      success: true,
      message:
        "Product created successfully.",
      product: savedProduct,
    });
  } catch (error) {
    console.error(
      "Create Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ==========================================

const updateProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const {
      name,
      price,
      originalPrice,
      discountedPrice,
      isOnSale,
      image,
      description,
      category,
      stock,
      rating,
      isVisible,
      freeShipping,
      returns30Days,
      secureCheckout,
      warranty1Year,
      additionalImageUrls,
      mainImageType,
      mainImageUrl,
      mainImagePath,
      mainImageIndex,
      removedImages,
    } = req.body;

    // Update basic fields.
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Product name cannot be empty.",
        });
      }

      product.name =
        String(name).trim();
    }

    if (description !== undefined) {
      if (
        !String(description).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product description cannot be empty.",
        });
      }

      product.description =
        String(description).trim();
    }

    if (category !== undefined) {
      product.category =
        String(category).trim() ||
        "General";
    }

    // Update stock.
    if (stock !== undefined) {
      const numericStock =
        Number(stock);

      if (
        !Number.isFinite(numericStock) ||
        numericStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a valid number greater than or equal to 0.",
        });
      }

      product.stock =
        numericStock;
    }

    // Update rating.
    if (rating !== undefined) {
      const numericRating =
        Number(rating);

      if (
        !Number.isFinite(numericRating) ||
        numericRating < 0 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be between 0 and 5.",
        });
      }

      product.rating =
        numericRating;
    }

    // Update visibility.
    if (
      isVisible !== undefined
    ) {
      product.isVisible =
        parseBoolean(
          isVisible,
          product.isVisible !== false
        );
    }

    // Update product feature settings.
    if (freeShipping !== undefined) {
      product.freeShipping =
        parseBoolean(
          freeShipping,
          true
        );
    }

    if (returns30Days !== undefined) {
      product.returns30Days =
        parseBoolean(
          returns30Days,
          true
        );
    }

    if (secureCheckout !== undefined) {
      product.secureCheckout =
        parseBoolean(
          secureCheckout,
          true
        );
    }

    if (warranty1Year !== undefined) {
      product.warranty1Year =
        parseBoolean(
          warranty1Year,
          true
        );
    }

    // Update sale pricing when pricing fields are supplied.
    if (
      price !== undefined ||
      originalPrice !== undefined ||
      discountedPrice !== undefined ||
      isOnSale !== undefined
    ) {
      const salePricing =
        prepareSalePricing({
          price:
            price !== undefined
              ? price
              : product.price,

          originalPrice:
            originalPrice !== undefined
              ? originalPrice
              : product.originalPrice,

          discountedPrice:
            discountedPrice !== undefined
              ? discountedPrice
              : product.discountedPrice,

          isOnSale:
            isOnSale !== undefined
              ? isOnSale
              : product.isOnSale,
        });

      if (salePricing.error) {
        return res.status(400).json({
          success: false,
          message:
            salePricing.error,
        });
      }

      product.price =
        salePricing.price;

      product.originalPrice =
        salePricing.originalPrice;

      product.discountedPrice =
        salePricing.discountedPrice;

      product.isOnSale =
        salePricing.isOnSale;
    }

    // Parse images.
    const uploadedImages =
      Array.isArray(req.files)
        ? req.files
        : [];

    const uploadedPaths =
      uploadedImages.map(
        (file) =>
          `/uploads/${file.filename}`
      );

    const imageUrls =
      parseImageUrls(
        additionalImageUrls
      );

    // Start with existing images.
    let existingImages =
      Array.isArray(product.images)
        ? [...product.images]
        : [];

    // Support old products where only image exists.
    if (
      product.image &&
      !existingImages.includes(
        product.image
      )
    ) {
      existingImages.unshift(
        product.image
      );
    }

    // Remove selected existing images.
    const imagesToRemove =
      parseRemovedImages(
        removedImages
      );

    existingImages =
      existingImages.filter(
        (item) =>
          !imagesToRemove.includes(
            item
          )
      );

    // Add new uploaded files.
    let allImages = [
      ...existingImages,
      ...uploadedPaths,
    ];

    // Add new image URLs.
    imageUrls.forEach((url) => {
      if (!allImages.includes(url)) {
        allImages.push(url);
      }
    });

    // Support the existing single image field.
    if (
      image &&
      !allImages.includes(image)
    ) {
      allImages.push(image);
    }

    // Determine the main image.
    let mainImage =
      product.image;

    if (
      mainImageType === "url" &&
      mainImageUrl
    ) {
      mainImage = mainImageUrl;
    } else if (
      mainImageType ===
        "existing-file" &&
      mainImagePath
    ) {
      mainImage = mainImagePath;
    } else if (
      mainImageType === "file" &&
      mainImageIndex !== undefined
    ) {
      const index =
        Number(mainImageIndex);

      if (
        Number.isInteger(index) &&
        index >= 0 &&
        index < uploadedPaths.length
      ) {
        mainImage =
          uploadedPaths[index];
      }
    }

    // If the current main image was removed, select another image.
    if (
      !mainImage ||
      !allImages.includes(
        mainImage
      )
    ) {
      mainImage =
        allImages[0] || "";
    }

    // Prevent saving a product without an image.
    if (!mainImage) {
      return res.status(400).json({
        success: false,
        message:
          "At least one product image is required.",
      });
    }

    // Make sure the main image is included.
    if (
      !allImages.includes(
        mainImage
      )
    ) {
      allImages.unshift(
        mainImage
      );
    }

    product.image =
      mainImage;

    product.images =
      allImages;

    // Save updated product.
    const updatedProduct =
      await product.save();

    res.status(200).json({
      success: true,
      message:
        "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      "Update Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE PRODUCT
// DELETE /api/products/:id
// ==========================================

const deleteProduct = async (req, res) => {
  try {
    const product =
      await Product.findById(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    await Product.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Product Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getAllProductsAdmin,
  getProductById,
  getProductByIdAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
};