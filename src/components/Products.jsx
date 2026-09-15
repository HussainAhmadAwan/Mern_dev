import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import React, { useEffect, useState } from "react";
import API from "../api/api";
import {
  useCart,
  getProductPrice,
} from "../context/CartContext";

// Display products with responsive cards and URL-based filters.
const Products = () => {
  const {
    addToCart,
    formatPrice,
    currencyLoading,
  } = useCart();

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [productColumns, setProductColumns] = useState(4);

  // Read URL filters.
  const searchText =
    searchParams.get("search")?.trim().toLowerCase() || "";

  const categoryFilter =
    searchParams.get("category")?.trim() || "";

  const saleFilter =
    searchParams.get("sale") === "true";

  // Add product to cart and open cart.
  const handleAddToCart = (product) => {
    addToCart(product);
    navigate("/cart");
  };

  // Fetch products.
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch product layout setting.
  useEffect(() => {
    fetchProductSettings();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await API.get("/api/products");

      setProducts(response.data.products || []);
    } catch (error) {
      console.log(
        "Failed to load products:",
        error
      );
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

  // Convert backend upload paths into browser-ready image URLs.
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "";
    }

    const image = String(imagePath).trim();

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    if (image.startsWith("/uploads/")) {
      return `http://localhost:5050${image}`;
    }

    if (image.startsWith("uploads/")) {
      return `http://localhost:5050/${image}`;
    }

    return image;
  };

  // Apply search, category, and sale filters.
  const filteredProducts = products.filter(
    (product) => {
      // Search filter.
      if (
        searchText &&
        !product.name
          ?.toLowerCase()
          .includes(searchText) &&
        !product.description
          ?.toLowerCase()
          .includes(searchText) &&
        !product.category
          ?.toLowerCase()
          .includes(searchText)
      ) {
        return false;
      }

      // Category filter.
      if (
        categoryFilter &&
        product.category?.toLowerCase() !==
          categoryFilter.toLowerCase()
      ) {
        return false;
      }

      // Sale filter.
      if (saleFilter && !product.isOnSale) {
        return false;
      }

      return true;
    }
  );

  // Grid columns.
  const gridColumnsClass = {
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }[productColumns] ||
    "sm:grid-cols-2 lg:grid-cols-4";

  // Keep cards progressively more compact for larger grids.
  const imageHeightClass = {
    3: "h-40 sm:h-44 lg:h-48",
    4: "h-36 sm:h-40 lg:h-44",
    5: "h-32 sm:h-36 lg:h-40",
    6: "h-28 sm:h-32 lg:h-36",
  }[productColumns] ||
    "h-36 sm:h-40 lg:h-44";

  // Keep card padding compact according to the selected grid size.
  const cardPaddingClass = {
    3: "p-3.5",
    4: "p-3.5",
    5: "p-3",
    6: "p-2.5",
  }[productColumns] || "p-3.5";

  // Keep text compact according to the selected grid size.
  const productNameClass = {
    3: "text-base sm:text-lg",
    4: "text-base sm:text-lg",
    5: "text-sm sm:text-base",
    6: "text-sm",
  }[productColumns] ||
    "text-base sm:text-lg";

  const productDescriptionClass = {
    3: "text-sm",
    4: "text-sm",
    5: "text-xs sm:text-sm",
    6: "text-xs",
  }[productColumns] ||
    "text-sm";

  const productPriceClass = {
    3: "text-lg sm:text-xl",
    4: "text-lg sm:text-xl",
    5: "text-base sm:text-lg",
    6: "text-sm sm:text-base",
  }[productColumns] ||
    "text-lg sm:text-xl";

  // Work out the page heading.
  let heading = "All Products";
  let description =
    "Discover our complete collection.";

  if (saleFilter) {
    heading = "On Sale";
    description =
      "Grab these products at special prices.";
  } else if (categoryFilter) {
    heading = categoryFilter;
    description = `Explore our ${categoryFilter} products.`;
  } else if (searchText) {
    heading = `Search Results for "${searchText}"`;
    description = `${filteredProducts.length} product${
      filteredProducts.length === 1
        ? ""
        : "s"
    } found`;
  }

  return (
    <section className="w-full max-w-full overflow-hidden bg-gray-50 px-3 py-7 transition-colors duration-300 dark:bg-slate-900/50 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        {/* Page heading */}
        <div className="mb-6 w-full min-w-0 text-center sm:mb-8">
          <h2 className="break-words text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
            {heading}
          </h2>

          <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            {description}
          </p>
        </div>

        {/* No products message */}
        {filteredProducts.length === 0 && (
          <div className="mb-8 w-full min-w-0 overflow-hidden rounded-2xl bg-white p-5 text-center shadow-md dark:bg-slate-800 sm:p-8">
            <div className="text-4xl sm:text-5xl">
              {saleFilter
                ? "🔥"
                : categoryFilter
                ? "🛍️"
                : "🔍"}
            </div>

            <h3 className="mt-4 break-words text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
              No products found
            </h3>

            <p className="mx-auto mt-2 max-w-2xl break-words text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              {saleFilter
                ? "There are currently no products on sale."
                : categoryFilter
                ? `There are currently no products in "${categoryFilter}".`
                : searchText
                ? `We couldn't find any products matching "${searchText}".`
                : "There are currently no products available."}
            </p>

            <Link
              to="/Product_page"
              className="mt-5 inline-block max-w-full rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white transition duration-200 hover:bg-orange-700"
            >
              View All Products
            </Link>
          </div>
        )}

        {/* Product grid */}
        {filteredProducts.length > 0 && (
          <div
            className={`grid w-full min-w-0 grid-cols-1 items-stretch gap-3 sm:gap-4 lg:gap-5 ${gridColumnsClass}`}
          >
            {filteredProducts.map((product) => {
              const sellingPrice =
                getProductPrice(product);

              const originalPrice = Number(
                product.originalPrice ??
                  product.price ??
                  0
              );

              const isSale =
                product.isOnSale &&
                Number.isFinite(
                  Number(product.discountedPrice)
                ) &&
                Number(product.discountedPrice) <
                  originalPrice;

              const discountPercentage =
                isSale && originalPrice > 0
                  ? Math.round(
                      ((originalPrice -
                        Number(
                          product.discountedPrice
                        )) /
                        originalPrice) *
                        100
                    )
                  : 0;

              const imageUrl = getImageUrl(
                product.image
              );

              return (
                <Link
                  key={product._id}
                  to={`/product/${product._id}`}
                  className="group flex min-w-0 max-w-full"
                >
                  <article className="flex min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-orange-200 group-hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:group-hover:border-orange-500/40 dark:group-hover:shadow-orange-950/20">
                    {/* Product image */}
                    <div
                      className={`relative w-full max-w-full shrink-0 overflow-hidden bg-gray-100 dark:bg-slate-700 ${imageHeightClass}`}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full max-w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl text-gray-400">
                          🛍️
                        </div>
                      )}

                      {/* Sale badge */}
                      {isSale && (
                        <div className="absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold text-white shadow-md sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
                          {discountPercentage}% OFF
                        </div>
                      )}

                      {/* Out of stock badge */}
                      {Number(product.stock || 0) <=
                        0 && (
                        <div className="absolute right-2 top-2 max-w-[calc(100%-1rem)] rounded-full bg-gray-900/80 px-2 py-1 text-[10px] font-semibold text-white sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
                          Out of Stock
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    {/* Product information */}
                    <div
                      className={`flex min-w-0 flex-1 flex-col overflow-hidden ${cardPaddingClass}`}
                    >
                      {/* Product name uses a fixed two-line area. */}
                      <h3
                        className={`min-w-0 break-words font-semibold leading-5 text-gray-900 transition-colors duration-200 group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400 ${productNameClass}`}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight:
                            productColumns >= 5
                              ? "40px"
                              : "44px",
                        }}
                      >
                        {product.name}
                      </h3>

                      {/* Description uses a fixed two-line area. */}
                      <p
                        className={`mt-1 min-w-0 break-words leading-5 text-gray-600 dark:text-gray-300 ${productDescriptionClass}`}
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          minHeight:
                            productColumns >= 5
                              ? "36px"
                              : "40px",
                        }}
                      >
                        {product.description}
                      </p>

                      {/* Price + cart button */}
                      <div
                        className={`mt-auto min-w-0 ${
                          productColumns >= 5
                            ? "pt-2.5"
                            : "pt-3"
                        }`}
                      >
                        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 overflow-hidden">
                          <span
                            className={`min-w-0 max-w-full break-all font-bold text-orange-600 ${productPriceClass}`}
                          >
                            {currencyLoading
                              ? "..."
                              : formatPrice(
                                  sellingPrice
                                )}
                          </span>

                          {isSale &&
                            originalPrice >
                              sellingPrice && (
                              <span className="min-w-0 break-all text-xs text-gray-400 line-through dark:text-gray-500 sm:text-sm">
                                {currencyLoading
                                  ? "..."
                                  : formatPrice(
                                      originalPrice
                                    )}
                              </span>
                            )}
                        </div>

                        <button
                          type="button"
                          disabled={
                            Number(
                              product.stock || 0
                            ) <= 0
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
                          className={`mt-2 w-full max-w-full rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 ${
                            Number(
                              product.stock || 0
                            ) <= 0
                              ? "cursor-not-allowed bg-gray-400"
                              : "bg-orange-600 hover:bg-orange-700 hover:shadow-md active:scale-[0.98]"
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

export default Products;

