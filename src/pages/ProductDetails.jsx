import React, { useEffect, useState } from "react";
import {
  useParams,
  Link,
  useNavigate,
} from "react-router-dom";
import API from "../api/api";
import {
  getProductPrice,
  useCart,
} from "../context/CartContext";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    addToCart,
    buyNow,
    formatPrice,
    currencyLoading,
  } = useCart();

  // Store selected quantity.
  const [quantity, setQuantity] = useState(1);

  // Store product.
  const [product, setProduct] = useState(null);

  // Store selected product image.
  const [selectedImage, setSelectedImage] = useState("");

  // Store related products from the same category.
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Store loading state.
  const [loading, setLoading] = useState(true);

  // Store related products loading state.
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Store error message.
  const [error, setError] = useState("");

  // Convert uploaded image paths into usable browser URLs.
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "";
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    if (imagePath.startsWith("/uploads/")) {
      return `http://localhost:5050${imagePath}`;
    }

    return imagePath;
  };

  // Fetch product from MongoDB.
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setQuantity(1);
        setSelectedImage("");
        setRelatedProducts([]);

        const response = await API.get(
          `/api/products/${id}`
        );

        setProduct(response.data.product);
      } catch (error) {
        console.error(
          "Error fetching product:",
          error
        );

        setError("Unable to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Prepare the product gallery and load the first image.
  useEffect(() => {
    if (!product) {
      return;
    }

    const allImages = [
      ...(product.image ? [product.image] : []),
      ...(Array.isArray(product.images)
        ? product.images
        : []),
    ].filter(Boolean);

    const uniqueImages = [
      ...new Set(allImages),
    ];

    setSelectedImage(
      uniqueImages.length > 0
        ? uniqueImages[0]
        : ""
    );
  }, [product]);

  // Fetch products from the same category.
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product?.category) {
        setRelatedProducts([]);
        return;
      }

      try {
        setRelatedLoading(true);

        const response = await API.get(
          "/api/products",
          {
            params: {
              category: product.category,
            },
          }
        );

        const products =
          response.data.products || [];

        // Exclude the current product and show up to four related products.
        const filteredProducts = products
          .filter(
            (item) => item._id !== product._id
          )
          .slice(0, 4);

        setRelatedProducts(
          filteredProducts
        );
      } catch (error) {
        console.error(
          "Error fetching related products:",
          error
        );

        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-screen w-full max-w-full items-center justify-center overflow-hidden px-4">
        <div className="break-words text-center text-xl font-bold text-orange-600 sm:text-2xl">
          Loading product...
        </div>
      </div>
    );
  }

  // Error state.
  if (error) {
    return (
      <div className="flex min-h-screen w-full max-w-full flex-col items-center justify-center overflow-hidden px-4">
        <h2 className="break-words text-center text-xl font-bold text-red-600 sm:text-2xl">
          {error}
        </h2>

        <Link
          to="/products"
          className="mt-5 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700 sm:px-6 sm:py-3"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  // Product not found.
  if (!product) {
    return (
      <div className="flex min-h-screen w-full max-w-full items-center justify-center overflow-hidden px-4">
        <h2 className="break-words text-center text-2xl font-bold dark:text-white">
          Product Not Found
        </h2>
      </div>
    );
  }

  // Combine the main image and all additional images without duplicates.
  const productImages = [
    ...(product.image
      ? [product.image]
      : []),
    ...(Array.isArray(product.images)
      ? product.images
      : []),
  ].filter(Boolean);

  const uniqueProductImages = [
    ...new Set(productImages),
  ];

  // Use the first image as a fallback for the main image.
  const mainImage =
    selectedImage ||
    uniqueProductImages[0] ||
    product.image ||
    "";

  // Increase quantity.
  const increaseQuantity = () => {
    if (
      quantity < Number(product.stock || 0)
    ) {
      setQuantity((prev) => prev + 1);
    }
  };

  // Decrease quantity.
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Get current customer selling price.
  const sellingPrice =
    getProductPrice(product);

  // Calculate selected quantity total.
  const total =
    sellingPrice * quantity;

  // Check whether product is on sale.
  const isSale =
    product.isOnSale &&
    Number.isFinite(
      Number(product.discountedPrice)
    ) &&
    Number(product.discountedPrice) <
      Number(
        product.originalPrice ??
          product.price ??
          0
      );

  // Get original/reference price.
  const originalPrice = Number(
    product.originalPrice ??
      product.price ??
      0
  );

  // Add product to cart.
  const handleAddToCart = () => {
    addToCart(product, quantity);
    navigate("/cart");
  };

  // Buy product now.
  const handleBuyNow = () => {
    buyNow(product, quantity);
    navigate("/checkout");
  };

  return (
    <section className="min-h-screen w-full max-w-full overflow-hidden bg-gray-50 py-7 transition-colors duration-300 dark:bg-slate-900 sm:py-10">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/products"
          className="inline-block max-w-full break-words text-sm font-semibold text-orange-600 transition hover:text-orange-700 hover:underline sm:text-base"
        >
          ← Back to Products
        </Link>

        {/* Main Product Section */}
        <div className="mt-5 grid min-w-0 gap-7 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-10">
          {/* Product Gallery */}
          <div className="min-w-0">
            {/* Main Product Image */}
            <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-slate-800">
              <div className="flex h-[360px] w-full items-center justify-center sm:h-[420px]">
                {mainImage ? (
                  <img
                    src={getImageUrl(
                      mainImage
                    )}
                    alt={product.name}
                    className="h-full w-full object-contain p-4 sm:p-6"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                    No image available
                  </div>
                )}
              </div>
            </div>

            {/* Additional Product Images */}
            {uniqueProductImages.length >
              0 && (
              <div className="mx-auto mt-4 w-full max-w-[560px]">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {uniqueProductImages.map(
                    (image, index) => {
                      const isSelected =
                        image ===
                        mainImage;

                      return (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() =>
                            setSelectedImage(
                              image
                            )
                          }
                          aria-label={`View product image ${
                            index + 1
                          }`}
                          className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition sm:h-24 sm:w-24 ${
                            isSelected
                              ? "border-orange-600 ring-2 ring-orange-200 dark:ring-orange-900"
                              : "border-gray-200 hover:border-orange-400 dark:border-slate-600 dark:hover:border-orange-500"
                          }`}
                        >
                          <img
                            src={getImageUrl(
                              image
                            )}
                            alt={`${product.name} ${
                              index + 1
                            }`}
                            className="h-full w-full object-contain p-1"
                          />
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="min-w-0 overflow-hidden lg:max-w-[460px]">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 break-words text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {product.name}
              </h1>

              {isSale && (
                <span className="shrink-0 rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  On Sale
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-lg text-yellow-500">
              ★★★★★

              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({product.rating || 0}{" "}
                Rating)
              </span>
            </div>

            {/* Product Price */}
            <div className="mt-5 min-w-0">
              {isSale ? (
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <span className="max-w-full break-all text-3xl font-bold text-orange-600">
                    {currencyLoading
                      ? "..."
                      : formatPrice(
                          Number(
                            product.discountedPrice
                          )
                        )}
                  </span>

                  <span className="max-w-full break-all text-lg font-medium text-gray-400 line-through">
                    {currencyLoading
                      ? "..."
                      : formatPrice(
                          originalPrice
                        )}
                  </span>

                  {originalPrice >
                    0 &&
                    Number(
                      product.discountedPrice
                    ) <
                      originalPrice && (
                      <span className="shrink-0 rounded-md bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Save{" "}
                        {Math.round(
                          ((originalPrice -
                            Number(
                              product.discountedPrice
                            )) /
                            originalPrice) *
                            100
                        )}
                        %
                      </span>
                    )}
                </div>
              ) : (
                <span className="max-w-full break-all text-3xl font-bold text-orange-600">
                  {currencyLoading
                    ? "..."
                    : formatPrice(
                        sellingPrice
                      )}
                </span>
              )}
            </div>

            {/* Selected Quantity Total */}
            <div className="mt-3 break-words text-sm text-gray-500 dark:text-gray-400">
              Total for {quantity} item
              {quantity === 1
                ? ""
                : "s"}
              :{" "}
              <span className="font-bold text-gray-800 dark:text-white">
                {currencyLoading
                  ? "..."
                  : formatPrice(total)}
              </span>
            </div>

            {/* Short Description */}
            <p className="mt-5 break-words text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base">
              {product.description}
            </p>

            {/* Category */}
            <p className="mt-4 break-words text-sm text-gray-600 dark:text-gray-300 sm:text-base">
              Category:
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                {product.category}
              </span>
            </p>

            {/* Stock */}
            <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-300 sm:text-base">
              Stock:
              <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                {product.stock}
              </span>
            </p>

            {/* Quantity */}
            <div className="mt-6 flex min-w-0 flex-wrap items-center gap-4">
              <span className="text-base font-semibold text-gray-800 dark:text-white">
                Quantity
              </span>

              <div className="flex h-10 shrink-0 overflow-hidden rounded-lg border-2 border-gray-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={
                    decreaseQuantity
                  }
                  disabled={
                    quantity === 1
                  }
                  aria-label="Decrease quantity"
                  className="flex w-10 items-center justify-center border-r border-gray-300 bg-gray-100 text-xl font-bold text-gray-800 transition hover:bg-orange-100 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                >
                  −
                </button>

                <span className="flex w-12 items-center justify-center bg-white text-base font-bold text-gray-900 dark:bg-slate-800 dark:text-white">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={
                    increaseQuantity
                  }
                  disabled={
                    Number(
                      product.stock ||
                        0
                    ) <= quantity
                  }
                  aria-label="Increase quantity"
                  className="flex w-10 items-center justify-center border-l border-gray-300 bg-gray-100 text-xl font-bold text-gray-800 transition hover:bg-orange-100 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex w-full min-w-0 flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={
                  handleAddToCart
                }
                disabled={
                  Number(
                    product.stock || 0
                  ) <= 0
                }
                className="w-full rounded-lg bg-orange-600 px-6 py-2.5 font-semibold text-white transition hover:bg-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto sm:min-w-40"
              >
                {Number(
                  product.stock || 0
                ) <= 0
                  ? "Out of Stock"
                  : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={
                  handleBuyNow
                }
                disabled={
                  Number(
                    product.stock || 0
                  ) <= 0
                }
                className="w-full rounded-lg border border-orange-600 px-6 py-2.5 font-semibold text-orange-600 transition hover:bg-orange-600 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:border-gray-400 disabled:text-gray-400 dark:disabled:border-gray-600 dark:disabled:text-gray-500 sm:w-auto sm:min-w-40"
              >
                Buy Now
              </button>
            </div>

            {/* Dynamic Product Features */}
            <div className="mt-7 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {product.freeShipping !==
                false && (
                <p>
                  ✅ Free Shipping
                </p>
              )}

              {product.returns30Days !==
                false && (
                <p>
                  ✅ 30-Day Returns
                </p>
              )}

              {product.secureCheckout !==
                false && (
                <p>
                  ✅ Secure Checkout
                </p>
              )}

              {product.warranty1Year !==
                false && (
                <p>
                  ✅ 1-Year Warranty
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-9 w-full min-w-0 overflow-hidden rounded-xl bg-white p-5 shadow-md dark:bg-slate-800 sm:mt-12 sm:p-7">
          <h2 className="mb-4 break-words text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Product Description
          </h2>

          <p className="break-words text-sm leading-7 text-gray-600 dark:text-gray-300 sm:text-base sm:leading-8">
            {product.description}
          </p>
        </div>

        {/* Related Products */}
        {!relatedLoading &&
          relatedProducts.length >
            0 && (
            <div className="mt-10 w-full min-w-0 sm:mt-12">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="break-words text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                    Related Products
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    More products from{" "}
                    {product.category}
                  </p>
                </div>

                <Link
                  to="/products"
                  className="text-sm font-semibold text-orange-600 transition hover:text-orange-700 hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map(
                  (relatedProduct) => {
                    const relatedSellingPrice =
                      getProductPrice(
                        relatedProduct
                      );

                    const relatedOriginalPrice =
                      Number(
                        relatedProduct.originalPrice ??
                          relatedProduct.price ??
                          0
                      );

                    const relatedIsSale =
                      relatedProduct.isOnSale &&
                      Number.isFinite(
                        Number(
                          relatedProduct.discountedPrice
                        )
                      ) &&
                      Number(
                        relatedProduct.discountedPrice
                      ) <
                        relatedOriginalPrice;

                    const relatedImage =
                      relatedProduct.image ||
                      (Array.isArray(
                        relatedProduct.images
                      ) &&
                      relatedProduct
                        .images.length >
                        0
                        ? relatedProduct
                            .images[0]
                        : "");

                    return (
                      <Link
                        key={
                          relatedProduct._id
                        }
                        to={`/product/${relatedProduct._id}`}
                        className="group min-w-0 overflow-hidden rounded-xl bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-800"
                      >
                        {/* Related product image */}
                        <div className="flex h-52 items-center justify-center overflow-hidden bg-gray-100 dark:bg-slate-700">
                          {relatedImage ? (
                            <img
                              src={getImageUrl(
                                relatedImage
                              )}
                              alt={
                                relatedProduct.name
                              }
                              className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <span className="text-sm text-gray-400">
                              No image
                            </span>
                          )}
                        </div>

                        {/* Related product information */}
                        <div className="min-w-0 p-4">
                          <h3 className="break-words text-base font-semibold text-gray-900 transition group-hover:text-orange-600 dark:text-white">
                            {
                              relatedProduct.name
                            }
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {relatedIsSale ? (
                              <>
                                <span className="break-all text-lg font-bold text-orange-600">
                                  {currencyLoading
                                    ? "..."
                                    : formatPrice(
                                        Number(
                                          relatedProduct.discountedPrice
                                        )
                                      )}
                                </span>

                                <span className="break-all text-sm text-gray-400 line-through">
                                  {currencyLoading
                                    ? "..."
                                    : formatPrice(
                                        relatedOriginalPrice
                                      )}
                                </span>
                              </>
                            ) : (
                              <span className="break-all text-lg font-bold text-orange-600">
                                {currencyLoading
                                  ? "..."
                                  : formatPrice(
                                      relatedSellingPrice
                                    )}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-1 text-sm text-yellow-500">
                            ★★★★★

                            <span className="ml-1 text-gray-500 dark:text-gray-400">
                              (
                              {relatedProduct.rating ||
                                0}
                              )
                            </span>
                          </div>

                          <span className="mt-3 inline-block text-sm font-semibold text-orange-600">
                            View Product →
                          </span>
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          )}
      </div>
    </section>
  );
};

export default ProductDetails;