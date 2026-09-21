import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import {
  useCart,
  getProductPrice,
} from "../context/CartContext";

const SaleProducts = () => {
  const {
    addToCart,
    formatPrice,
    currencyLoading,
  } = useCart();

  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [productColumns, setProductColumns] = useState(4);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaleProducts();
    fetchProductSettings();
  }, []);

  const fetchSaleProducts = async () => {
    try {
      const response = await API.get(
        "/api/products?sale=true"
      );

      setProducts(response.data.products || []);
    } catch (error) {
      console.log(
        "Failed to load sale products:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProductSettings = async () => {
    try {
      const response = await API.get("/settings");

      const savedColumns = Number(
        response.data.settings?.productCardsPerRow || 4
      );

      if ([3, 4, 5, 6].includes(savedColumns)) {
        setProductColumns(savedColumns);
      } else {
        setProductColumns(4);
      }
    } catch (error) {
      console.log(
        "Failed to load product settings:",
        error
      );

      setProductColumns(4);
    }
  };

  // Convert device-uploaded images to the backend URL while keeping URL images unchanged.
  // const getImageUrl = (image) => {
  //   if (!image || typeof image !== "string") {
  //     return "/placeholder.jpg";
  //   }

  //   const trimmedImage = image.trim();

  //   if (!trimmedImage) {
  //     return "/placeholder.jpg";
  //   }

  //   if (
  //     trimmedImage.startsWith("http://") ||
  //     trimmedImage.startsWith("https://") ||
  //     trimmedImage.startsWith("data:")
  //   ) {
  //     return trimmedImage;
  //   }

  //   const normalizedPath = trimmedImage.startsWith("/")
  //     ? trimmedImage
  //     : `/${trimmedImage}`;

  //   if (normalizedPath.startsWith("/uploads/")) {
  //     return `http://localhost:5050${normalizedPath}`;
  //   }

  //   return trimmedImage;
  // };


const getImageUrl = (image) => {
  if (!image || typeof image !== "string") {
    return "/placeholder.jpg";
  }

  const trimmedImage = image.trim();

  if (!trimmedImage) {
    return "/placeholder.jpg";
  }

  if (
    trimmedImage.startsWith("http://") ||
    trimmedImage.startsWith("https://") ||
    trimmedImage.startsWith("data:")
  ) {
    return trimmedImage;
  }

  const normalizedPath = trimmedImage.startsWith("/")
    ? trimmedImage
    : `/${trimmedImage}`;

  if (normalizedPath.startsWith("/uploads/")) {
    const backendUrl = (
      import.meta.env.VITE_API_URL ||
      "http://localhost:5050"
    ).replace(/\/$/, "");

    return `${backendUrl}${normalizedPath}`;
  }

  return trimmedImage;
};







  const handleAddToCart = (product) => {
    addToCart(product);
    navigate("/cart");
  };

  const gridColumnsClass = {
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }[productColumns] ||
    "sm:grid-cols-2 lg:grid-cols-4";

  // Keep image height compact and proportional for each card layout.
  const imageHeightClass = {
    3: "h-40 sm:h-44 lg:h-48",
    4: "h-36 sm:h-40 lg:h-44",
    5: "h-32 sm:h-36 lg:h-40",
    6: "h-28 sm:h-32 lg:h-36",
  }[productColumns] ||
    "h-36 sm:h-40 lg:h-44";

  // Use smaller padding as more cards are displayed in a row.
  const cardPaddingClass = {
    3: "p-3.5",
    4: "p-3.5",
    5: "p-3",
    6: "p-2.5",
  }[productColumns] || "p-3.5";

  // Show only enough products to create one configured row.
  const visibleProducts = products.slice(
    0,
    productColumns
  );

  // Hide the entire section if there are no sale products.
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-full overflow-hidden bg-white px-3 py-7 transition-colors duration-300 dark:bg-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        {/* Section heading */}
        <div className="mb-5 flex min-w-0 items-end justify-between gap-3 sm:mb-6 sm:gap-4">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-xl">
                🔥
              </span>

              <h2 className="truncate text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                On Sale
              </h2>
            </div>

            <p className="mt-1 break-words text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Grab these products before the offer ends.
            </p>
          </div>

          <Link
            to="/Product_page?sale=true"
            className="shrink-0 whitespace-nowrap text-sm font-semibold text-orange-600 transition hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 sm:text-base"
          >
            See All →
          </Link>
        </div>

        {/* Loading state */}
        {loading && (
          <div
            className={`grid w-full min-w-0 grid-cols-1 items-stretch gap-4 sm:gap-5 lg:gap-6 ${gridColumnsClass}`}
          >
            {Array.from({
              length: productColumns,
            }).map((_, index) => (
              <div
                key={index}
                className="h-64 w-full animate-pulse overflow-hidden rounded-2xl bg-gray-200 dark:bg-slate-800"
              />
            ))}
          </div>
        )}

        {/* Sale products */}
        {!loading && (
          <div
            className={`grid w-full min-w-0 grid-cols-1 items-stretch gap-4 sm:gap-5 lg:gap-6 ${gridColumnsClass}`}
          >
            {visibleProducts.map((product) => {
              const sellingPrice =
                getProductPrice(product);

              const originalPrice = Number(
                product.originalPrice ??
                  product.price
              );

              const discountPercentage =
                originalPrice > 0 &&
                sellingPrice < originalPrice
                  ? Math.round(
                      ((originalPrice -
                        sellingPrice) /
                        originalPrice) *
                        100
                    )
                  : 0;

              const productImage = getImageUrl(
                product.image
              );

              return (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="group flex h-full min-w-0 max-w-full overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  <article className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-orange-200 group-hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:group-hover:border-orange-500/40">
                    {/* Main product image */}
                    <div
                      className={`relative w-full shrink-0 overflow-hidden bg-gray-100 dark:bg-slate-700 ${imageHeightClass}`}
                    >
                      <img
                        src={productImage}
                        alt={product.name || "Product"}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        onError={(event) => {
                          event.currentTarget.src =
                            "/placeholder.jpg";
                        }}
                      />

                      {/* Sale badge */}
                      <div className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-md sm:left-2.5 sm:top-2.5 sm:px-2 sm:py-1 sm:text-[10px]">
                        {discountPercentage > 0
                          ? `${discountPercentage}% OFF`
                          : "SALE"}
                      </div>
                    </div>

                    {/* Product information */}
                    <div
                      className={`flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden ${cardPaddingClass}`}
                    >
                      {/* Keep product names at the same height. */}
                      <h3
                        className={`min-h-[2.5rem] min-w-0 overflow-hidden break-words font-semibold leading-5 text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 line-clamp-2 ${
                          productColumns >= 5
                            ? "text-sm"
                            : "text-sm sm:text-base"
                        }`}
                      >
                        {product.name}
                      </h3>

                      {/* Keep descriptions at the same height. */}
                      <p
                        className={`mt-1 min-h-[2rem] min-w-0 overflow-hidden break-words text-gray-600 dark:text-gray-300 line-clamp-2 ${
                          productColumns >= 5
                            ? "text-xs leading-4"
                            : "text-xs sm:text-sm sm:leading-4"
                        }`}
                      >
                        {product.description}
                      </p>

                      {/* Price and button are always aligned at the bottom. */}
                      <div
                        className={`mt-auto min-w-0 ${
                          productColumns >= 5
                            ? "pt-2.5"
                            : "pt-3"
                        }`}
                      >
                        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5 overflow-hidden">
                          <span
                            className={`min-w-0 max-w-full break-all font-bold text-orange-600 ${
                              productColumns >= 5
                                ? "text-sm sm:text-base"
                                : "text-base sm:text-lg"
                            }`}
                          >
                            {currencyLoading
                              ? "..."
                              : formatPrice(
                                  sellingPrice
                                )}
                          </span>

                          {originalPrice >
                            sellingPrice && (
                            <span className="min-w-0 break-all text-[10px] text-gray-400 line-through dark:text-gray-500 sm:text-xs">
                              {currencyLoading
                                ? "..."
                                : formatPrice(
                                    originalPrice
                                  )}
                            </span>
                          )}
                        </div>

                        {/* Add to cart */}
                        <button
                          type="button"
                          disabled={
                            Number(product.stock || 0) <=
                            0
                          }
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();

                            if (
                              Number(
                                product.stock || 0
                              ) > 0
                            ) {
                              handleAddToCart(
                                product
                              );
                            }
                          }}
                          className={`mt-2 w-full rounded-lg px-2.5 py-2 text-xs font-medium text-white shadow-sm transition-all duration-200 sm:text-sm ${
                            Number(product.stock || 0) <=
                            0
                              ? "cursor-not-allowed bg-gray-400"
                              : "bg-orange-600 hover:bg-orange-700 active:scale-[0.98]"
                          }`}
                        >
                          {Number(
                            product.stock || 0
                          ) <= 0
                            ? "Out of Stock"
                            : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default SaleProducts;

