const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Store the product name.
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Store the normal product price.
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Store the original/actual price shown when the product is on sale.
    originalPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    // Store the discounted price when the product is on sale.
    discountedPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    // Control whether the product is currently on sale.
    isOnSale: {
      type: Boolean,
      default: false,
    },

    // Store the main product image.
    image: {
      type: String,
      required: true,
    },

    // Store additional product images.
    images: {
      type: [String],
      default: [],
    },

    // Store the product description.
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Store the product category.
    category: {
      type: String,
      default: "General",
      trim: true,
    },

    // Store available product stock.
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Store the product rating.
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Control whether customers can see and purchase the product.
    isVisible: {
      type: Boolean,
      default: true,
    },

    // Control whether free shipping is displayed for this product.
    freeShipping: {
      type: Boolean,
      default: true,
    },

    // Control whether the 30-day return feature is displayed.
    returns30Days: {
      type: Boolean,
      default: true,
    },

    // Control whether secure checkout is displayed.
    secureCheckout: {
      type: Boolean,
      default: true,
    },

    // Control whether the 1-year warranty is displayed.
    warranty1Year: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;