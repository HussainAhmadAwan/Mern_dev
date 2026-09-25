import React from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";
import { getImageUrl } from "../api/config";

const Navbar = () => {
  const navigate = useNavigate();

  const { totalItems } = useCart();

  const {
    user,
    logout,
    isLoggedIn,
  } = useAuth();

  // =========================================================
  // MENUS
  // =========================================================

  const [
    profileMenuOpen,
    setProfileMenuOpen,
  ] = React.useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = React.useState(false);

  // =========================================================
  // SEARCH
  // =========================================================

  const [
    searchText,
    setSearchText,
  ] = React.useState("");

  const [
    products,
    setProducts,
  ] = React.useState([]);

  const [
    searchOpen,
    setSearchOpen,
  ] = React.useState(false);

  // =========================================================
  // LOAD PRODUCTS FOR SEARCH
  // =========================================================

  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await API.get(
          "/api/products"
        );

        setProducts(
          response.data.products || []
        );
      } catch (error) {
        console.error(
          "Failed to load products for search:",
          error
        );
      }
    };

    loadProducts();
  }, []);

  // =========================================================
  // SEARCH RESULTS
  // =========================================================

  const searchResults = React.useMemo(() => {
    const search = searchText
      .trim()
      .toLowerCase();

    if (!search) {
      return [];
    }

    return products
      .filter((product) => {
        const name =
          product.name?.toLowerCase() || "";

        const description =
          product.description?.toLowerCase() || "";

        const category =
          product.category?.toLowerCase() || "";

        return (
          name.includes(search) ||
          description.includes(search) ||
          category.includes(search)
        );
      })
      .slice(0, 5);
  }, [searchText, products]);

  // =========================================================
  // SEARCH
  // =========================================================

  const handleSearch = (event) => {
    event.preventDefault();

    const search = searchText.trim();

    if (!search) {
      return;
    }

    setSearchOpen(false);
    setMobileMenuOpen(false);

    navigate(
      `/Product_page?search=${encodeURIComponent(
        search
      )}`
    );
  };

  // =========================================================
  // PRODUCT SEARCH RESULT CLICK
  // =========================================================

  const handleProductClick = (productId) => {
    setSearchText("");
    setSearchOpen(false);
    setMobileMenuOpen(false);

    navigate(`/product/${productId}`);
  };

  // =========================================================
  // THEME
  // =========================================================

  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("theme") ||
        "light"
      );
    }

    return "light";
  });

  // Apply theme
  React.useEffect(() => {
    const root =
      window.document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme((previous) =>
      previous === "light"
        ? "dark"
        : "light"
    );
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    logout();

    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setSearchOpen(false);
  };

  // =========================================================
  // CLOSE MOBILE MENU
  // =========================================================

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-black shadow-md dark:bg-gray-900">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {/* =================================================
            MAIN NAVBAR
        ================================================== */}

        <div className="flex h-16 items-center gap-3">
          {/* Logo */}

          <Link
            to="/"
            onClick={handleMobileLinkClick}
            className="flex shrink-0 items-center gap-2"
          >
            <img
              src="https://freelogopng.com/images/all_img/1656181199icon-shopee-png.png"
              alt="Shopee Logo"
              className="h-10 w-10 object-contain sm:h-11 sm:w-11"
            />

            <span className="text-lg font-bold text-white sm:text-xl">
              Shopee
            </span>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================== */}

          <nav
            aria-label="Global"
            className="ml-16 hidden xl:block"
          >
            <ul className="flex items-center gap-4 text-sm 2xl:gap-6">
              <li>
                <Link
                  className="whitespace-nowrap text-white transition hover:text-orange-500"
                  to="/Aboutus"
                >
                  About
                </Link>
              </li>

              <li>
                <a
                  className="whitespace-nowrap text-white transition hover:text-orange-500"
                  href="#"
                >
                  Careers
                </a>
              </li>

              <li>
                <a
                  className="whitespace-nowrap text-white transition hover:text-orange-500"
                  href="#"
                >
                  Sell on Shopee
                </a>
              </li>

              <li>
                <a
                  className="whitespace-nowrap text-white transition hover:text-orange-500"
                  href="#"
                >
                  Services
                </a>
              </li>

              <li>
                <Link
                  className="whitespace-nowrap text-white transition hover:text-orange-500"
                  to="/Product_page"
                >
                  Products
                </Link>
              </li>

              <li>
                <a
                  className="whitespace-nowrap text-white transition hover:text-orange-500"
                  href="#"
                >
                  Blog
                </a>
              </li>
            </ul>
          </nav>

          {/* =================================================
              DESKTOP / TABLET SEARCH
          ================================================== */}

          <form
            onSubmit={handleSearch}
            className="ml-auto hidden flex-1 lg:flex lg:max-w-xs xl:max-w-[220px] 2xl:max-w-[260px]"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchText}
                onChange={(event) => {
                  setSearchText(
                    event.target.value
                  );

                  setSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchText.trim()) {
                    setSearchOpen(true);
                  }
                }}
                placeholder="Search products..."
                className="w-full rounded-full bg-white px-4 py-2 pr-11 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:text-white dark:placeholder:text-gray-400"
              />

              {/* Search Button */}

              <button
                type="submit"
                aria-label="Search products"
                className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-orange-600 text-white transition hover:bg-orange-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0c0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              </button>

              {/* Desktop Search Dropdown */}

              {searchOpen &&
                searchText.trim() && (
                  <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-800">
                    {searchResults.length > 0 ? (
                      <React.Fragment>
                        {searchResults.map(
                          (product) => (
                            <button
                              key={product._id}
                              type="button"
                              onClick={() =>
                                handleProductClick(
                                  product._id
                                )
                              }
                              className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-3 text-left transition hover:bg-gray-100 dark:border-slate-700 dark:hover:bg-slate-700"
                            >
                              <img
                                src={getImageUrl(
                                  product.image
                                )}
                                alt={product.name}
                                className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                onError={(
                                  event
                                ) => {
                                  event.currentTarget.style.display =
                                    "none";
                                }}
                              />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                                  {product.name}
                                </p>

                                <p className="mt-1 text-sm font-bold text-orange-600">
                                  $
                                  {Number(
                                    product.isOnSale &&
                                      Number(
                                        product.discountedPrice
                                      ) <
                                        Number(
                                          product.price
                                        )
                                      ? product.discountedPrice
                                      : product.price ||
                                          0
                                  ).toFixed(2)}
                                </p>
                              </div>
                            </button>
                          )
                        )}

                        <button
                          type="submit"
                          className="w-full px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          View all search results →
                        </button>
                      </React.Fragment>
                    ) : (
                      <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                        No products found.
                      </div>
                    )}
                  </div>
                )}
            </div>
          </form>

          {/* =================================================
              RIGHT SIDE CONTROLS
          ================================================== */}

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 lg:ml-3">
            {/* Authentication - Desktop */}

            <div className="hidden xl:block">
              {!isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <Link
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
                    to="/Login"
                  >
                    Login
                  </Link>

                  <Link
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-gray-200"
                    to="/Register"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  {/* Profile Button */}

                  <button
                    type="button"
                    onClick={() =>
                      setProfileMenuOpen(
                        (previous) =>
                          !previous
                      )
                    }
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-white transition hover:bg-gray-800"
                  >
                    {user?.profilePicture ? (
                      <img
                        src={getImageUrl(
                          user.profilePicture
                        )}
                        alt={
                          user.name || "Profile"
                        }
                        className="h-9 w-9 rounded-full border-2 border-orange-500 object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-lg font-semibold">
                        {user?.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "U"}
                      </span>
                    )}

                    <span className="hidden max-w-[100px] truncate text-sm font-medium 2xl:block">
                      {user?.name}
                    </span>

                    <span className="text-xs">
                      ▼
                    </span>
                  </button>

                  {/* Profile Dropdown */}

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg bg-white shadow-xl dark:bg-slate-800">
                      <Link
                        to="/profile"
                        onClick={() =>
                          setProfileMenuOpen(
                            false
                          )
                        }
                        className="block px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-white dark:hover:bg-slate-700"
                      >
                        👤 Profile
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() =>
                          setProfileMenuOpen(
                            false
                          )
                        }
                        className="block px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-white dark:hover:bg-slate-700"
                      >
                        📦 My Orders
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full px-4 py-3 text-left text-sm text-red-600 transition hover:bg-gray-100 dark:hover:bg-slate-700"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Theme Toggle */}

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full p-2.5 text-white transition hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5 text-yellow-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m0 13.5V21M4.978 4.978l1.59 1.59m10.864 10.864 1.59 1.59m-18-5.714h2.25m13.5 0H21M6.568 17.432l-1.59 1.59m14.04-14.04 1.59 1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"
                  />
                </svg>
              )}
            </button>

            {/* Cart */}

            <Link
              to="/cart"
              className="relative flex items-center rounded-lg p-2 text-white transition hover:bg-gray-800"
              aria-label="Shopping cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.086.836l.383 1.437m0 0L6.75 15.75h10.5l2.25-8.25H5.105m0 0L4.722 6.063M6.75 15.75a1.5 1.5 0 0 1-1.5-1.5v.75h13.5V17.25a1.5 1.5 0 0 1-1.5-1.5M9 20.25h.008v.008H9v-.008Zm6 0h.008v.008H15v-.008Z"
                />
              </svg>

              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1 text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (previous) =>
                    !previous
                )
              }
              className="rounded-lg p-2.5 text-white transition hover:bg-gray-800 xl:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            MOBILE / TABLET MENU
        ================================================== */}

        {mobileMenuOpen && (
          <div className="border-t border-gray-800 py-3 xl:hidden">
            <div className="w-full max-w-sm">
              {/* Mobile Search */}

              <form
                onSubmit={handleSearch}
                className="mb-3"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => {
                      setSearchText(
                        event.target.value
                      );

                      setSearchOpen(true);
                    }}
                    onFocus={() => {
                      if (
                        searchText.trim()
                      ) {
                        setSearchOpen(true);
                      }
                    }}
                    placeholder="Search products..."
                    className="w-full rounded-lg bg-white px-4 py-2.5 pr-12 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500 dark:bg-slate-700 dark:text-white"
                  />

                  {/* Mobile Search Button */}

                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                    aria-label="Search products"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 9.753 9.753 0 0 0 3 7.75C7.365 21 12.75 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                      />
                    </svg>
                  </button>

                  {/* Mobile Search Dropdown */}

                  {searchOpen &&
                    searchText.trim() && (
                      <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-800">
                        {searchResults.length >
                        0 ? (
                          <React.Fragment>
                            {searchResults.map(
                              (product) => (
                                <button
                                  key={
                                    product._id
                                  }
                                  type="button"
                                  onClick={() =>
                                    handleProductClick(
                                      product._id
                                    )
                                  }
                                  className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-3 text-left transition hover:bg-gray-100 dark:border-slate-700 dark:hover:bg-slate-700"
                                >
                                  <img
                                    src={getImageUrl(
                                      product.image
                                    )}
                                    alt={
                                      product.name
                                    }
                                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                    onError={(
                                      event
                                    ) => {
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                                      {
                                        product.name
                                      }
                                    </p>

                                    <p className="mt-1 text-sm font-bold text-orange-600">
                                      $
                                      {Number(
                                        product.isOnSale &&
                                          Number(
                                            product.discountedPrice
                                          ) <
                                            Number(
                                              product.price
                                            )
                                          ? product.discountedPrice
                                          : product.price ||
                                              0
                                      ).toFixed(2)}
                                    </p>
                                  </div>
                                </button>
                              )
                            )}

                            <button
                              type="submit"
                              className="w-full px-4 py-3 text-center text-sm font-semibold text-orange-600 transition hover:bg-gray-100 dark:hover:bg-slate-700"
                            >
                              View all search results →
                            </button>
                          </React.Fragment>
                        ) : (
                          <div className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                            No products found.
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </form>

              {/* =================================================
                  NAVIGATION
              ================================================== */}

              <nav aria-label="Mobile Navigation">
                <div className="flex flex-col gap-1">
                  <Link
                    to="/Aboutus"
                    onClick={
                      handleMobileLinkClick
                    }
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 hover:text-orange-500"
                  >
                    About
                  </Link>

                  <a
                    href="#"
                    onClick={
                      handleMobileLinkClick
                    }
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 hover:text-orange-500"
                  >
                    Careers
                  </a>

                  <a
                    href="#"
                    onClick={
                      handleMobileLinkClick
                    }
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 hover:text-orange-500"
                  >
                    Sell on Shopee
                  </a>

                  <a
                    href="#"
                    onClick={
                      handleMobileLinkClick
                    }
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 hover:text-orange-500"
                  >
                    Services
                  </a>

                  <Link
                    to="/Product_page"
                    onClick={
                      handleMobileLinkClick
                    }
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 hover:text-orange-500"
                  >
                    Products
                  </Link>

                  <a
                    href="#"
                    onClick={
                      handleMobileLinkClick
                    }
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 hover:text-orange-500"
                  >
                    Blog
                  </a>
                </div>
              </nav>

              {/* =================================================
                  AUTHENTICATION
              ================================================== */}

              <div className="mt-3 border-t border-gray-800 pt-3">
                {!isLoggedIn ? (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/Login"
                      onClick={
                        handleMobileLinkClick
                      }
                      className="rounded-lg bg-orange-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700"
                    >
                      Login
                    </Link>

                    <Link
                      to="/Register"
                      onClick={
                        handleMobileLinkClick
                      }
                      className="rounded-lg bg-gray-100 px-4 py-2.5 text-center text-sm font-medium text-orange-600 hover:bg-gray-200"
                    >
                      Register
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Mobile Profile */}

                    <Link
                      to="/profile"
                      onClick={
                        handleMobileLinkClick
                      }
                      className="flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-2.5 text-white hover:bg-gray-800"
                    >
                      {user?.profilePicture ? (
                        <img
                          src={getImageUrl(
                            user.profilePicture
                          )}
                          alt={
                            user.name ||
                            "Profile"
                          }
                          className="h-9 w-9 rounded-full border-2 border-orange-500 object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 font-semibold">
                          {user?.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "U"}
                        </span>
                      )}

                      <span className="text-sm font-medium">
                        {user?.name}
                      </span>
                    </Link>

                    {/* Mobile My Orders */}

                    <Link
                      to="/orders"
                      onClick={
                        handleMobileLinkClick
                      }
                      className="flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm font-medium text-white transition hover:bg-gray-800 hover:text-orange-500"
                    >
                      📦 My Orders
                    </Link>

                    {/* Mobile Logout */}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-gray-800"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;