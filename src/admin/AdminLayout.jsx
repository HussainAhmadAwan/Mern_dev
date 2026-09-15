// useState controls whether the sidebar is expanded or collapsed.
import React, { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import api from "../api/axios";

const AdminLayout = () => {

  // Stores the current expanded/collapsed state of the sidebar.
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
// Stores whether the admin panel is currently using dark mode.
const [darkMode, setDarkMode] = useState(
  localStorage.getItem("adminTheme") === "dark"
);


  // Switches the admin panel between light and dark themes.
      const toggleTheme = () => {
        const newTheme = !darkMode;
      
        setDarkMode(newTheme);
      
        if (newTheme) {
          document.documentElement.classList.add("dark");
          localStorage.setItem("adminTheme", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("adminTheme", "light");
        }
      };

      // Applies the saved admin theme when the layout loads.
          useEffect(() => {
            if (darkMode) {
              document.documentElement.classList.add("dark");
            } else {
              document.documentElement.classList.remove("dark");
            }
          }, [darkMode]);

         

          // ==========================================
          // GLOBAL SEARCH STATE
          // ==========================================
          
          const [searchQuery, setSearchQuery] = useState("");
          
          const [searchResults, setSearchResults] = useState({
            products: [],
            users: [],
            orders: [],
          });
          
          const [searchLoading, setSearchLoading] = useState(false);
          const [showSearchResults, setShowSearchResults] = useState(false);
          
          const searchRef = useRef(null);
          const navigate = useNavigate();



          // ==========================================
          // GLOBAL ADMIN SEARCH
          // ==========================================
          
          useEffect(() => {
            const query = searchQuery.trim();
          
            // Clear results when search is empty
            if (!query) {
              setSearchResults({
                products: [],
                users: [],
                orders: [],
              });
          
              setSearchLoading(false);
              setShowSearchResults(false);
          
              return;
            }
          
            // Don't search for only one character
            if (query.length < 2) {
              setShowSearchResults(true);
              return;
            }
          
            setShowSearchResults(true);
            setSearchLoading(true);
          
            // Wait 300ms before sending the request
            const timer = setTimeout(async () => {
              try {
                const response = await api.get("/admin/search", {
                  params: {
                    q: query,
                  },
                });
          
                setSearchResults({
                  products: response.data.products || [],
                  users: response.data.users || [],
                  orders: response.data.orders || [],
                });
          
              } catch (error) {
                console.error("Global Search Error:", error);
          
                setSearchResults({
                  products: [],
                  users: [],
                  orders: [],
                });
          
              } finally {
                setSearchLoading(false);
              }
            }, 300);
          
            return () => clearTimeout(timer);
          
          }, [searchQuery]);
          
          
          // ==========================================
          // CLOSE SEARCH WHEN CLICKING OUTSIDE
          // ==========================================
          
          useEffect(() => {
          
            const handleClickOutside = (event) => {
              if (
                searchRef.current &&
                !searchRef.current.contains(event.target)
              ) {
                setShowSearchResults(false);
              }
            };
          
            document.addEventListener(
              "mousedown",
              handleClickOutside
            );
          
            return () => {
              document.removeEventListener(
                "mousedown",
                handleClickOutside
              );
            };
          
          }, []);
          
          
          // ==========================================
          // HANDLE SEARCH RESULT CLICK
          // ==========================================
          
          const handleSearchResultClick = (path) => {
          
            setSearchQuery("");
          
            setSearchResults({
              products: [],
              users: [],
              orders: [],
            });
          
            setShowSearchResults(false);
          
            navigate(path);
          };
          
          
          // ==========================================
          // FORMAT ORDER CUSTOMER NAME
          // ==========================================
          
          const getCustomerName = (order) => {
          
            const firstName =
              order.customer?.firstName || "";
          
            const lastName =
              order.customer?.lastName || "";
          
            return (
              `${firstName} ${lastName}`.trim() ||
              "Unknown Customer"
            );
          };
          
          
          // ==========================================
          // TRUNCATE LONG IDs
          // ==========================================
          
          const truncateId = (id, length = 12) => {
          
            if (!id) return "";
          
            if (id.length <= length) {
              return id;
            }
          
            return `${id.substring(0, length)}...`;
          };



  return (
    <div className="h-screen overflow-hidden bg-gray-100 dark:bg-slate-900">

      {/* ================= HEADER ================= */}
      {/* Admin top bar with branding, global search, theme toggle, and store link. */}
          <header className="h-16 bg-black text-white flex items-center gap-4 px-4 sm:px-6">
          
            {/* Admin branding. */}
            <Link
              to="/admin"
              className="text-xl sm:text-2xl font-bold text-orange-500 whitespace-nowrap"
            >
              🛒 Shopee Admin
            </Link>
          
            {/* ========================================== */}
            {/* GLOBAL ADMIN SEARCH */}
            {/* ========================================== */}
            
            <div
              ref={searchRef}
              className="relative flex-1 max-w-2xl mx-auto"
            >
            
              {/* Search input */}
              <div className="relative">
            
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) {
                      setShowSearchResults(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowSearchResults(false);
                    }
                  }}
                  placeholder="Search anything..."
                  className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 pl-10 pr-10 text-sm text-white placeholder-gray-400 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
            
                {/* Search icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
            
                {/* Clear button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
            
              </div>
            
            
              {/* ========================================== */}
              {/* SEARCH RESULTS DROPDOWN */}
              {/* ========================================== */}
            
              {showSearchResults && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-slate-800">
            
                  {/* Loading */}
                  {searchLoading && (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Searching...
                    </div>
                  )}
            
            
                  {/* Results */}
                  {!searchLoading && (
                    <>
            
                      {/* ====================================== */}
                      {/* PRODUCTS */}
                      {/* ====================================== */}
            
                      {searchResults.products.length > 0 && (
                        <div>
            
                          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-400">
                            Products
                          </div>
            
                          {searchResults.products.map((product) => (
            
                            <button
                              key={product._id}
                              type="button"
                              onClick={() =>
                                handleSearchResultClick(
                                  "/admin/products"
                                )
                              }
                              className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-orange-50 dark:border-gray-700 dark:hover:bg-slate-700"
                            >
            
                              {/* Product image */}
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700">
            
                                {product.image ? (
                                  <img
                                    src={
                                      product.image.startsWith("http")
                                        ? product.image
                                        : `http://localhost:5050${product.image}`
                                    }
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-lg">
                                    📦
                                  </div>
                                )}
            
                              </div>
            
                              {/* Product information */}
                              <div className="min-w-0 flex-1">
            
                                <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                                  {product.name}
                                </p>
            
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {product.category || "General"}
                                  {" • "}
                                  Rs. {Number(product.price || 0).toFixed(2)}
                                </p>
            
                              </div>
            
                              {/* Product icon */}
                              <span className="text-gray-400">
                                →
                              </span>
            
                            </button>
            
                          ))}
            
                        </div>
                      )}
            
            
                      {/* ====================================== */}
                      {/* USERS */}
                      {/* ====================================== */}
            
                      {searchResults.users.length > 0 && (
                        <div>
            
                          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-400">
                            Users
                          </div>
            
                          {searchResults.users.map((user) => (
            
                            <button
                              key={user._id}
                              type="button"
                              onClick={() =>
                                handleSearchResultClick(
                                  `/admin/users/${user._id}`
                                )
                              }
                              className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-orange-50 dark:border-gray-700 dark:hover:bg-slate-700"
                            >
            
                              {/* User image */}
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
            
                                {user.profilePicture ? (
                                  <img
                                    src={
                                      user.profilePicture.startsWith("http")
                                        ? user.profilePicture
                                        : `http://localhost:5050${user.profilePicture}`
                                    }
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
                                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                )}
            
                              </div>
            
                              {/* User information */}
                              <div className="min-w-0 flex-1">
            
                                <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
                                  {user.name}
                                </p>
            
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </p>
            
                              </div>
            
                              {/* Role */}
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                                  user.role === "admin"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                }`}
                              >
                                {user.role}
                              </span>
            
                            </button>
            
                          ))}
            
                        </div>
                      )}


            
            
                      {/* ====================================== */}
                      {/* ORDERS */}
                      {/* ====================================== */}
            
                      {searchResults.orders.length > 0 && (
                        <div>
            
                          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-400">
                            Orders
                          </div>
            
                          {searchResults.orders.map((order) => (
            
                            <button
                              key={order._id}
                              type="button"
                              onClick={() =>
                                handleSearchResultClick(
                                  `/admin/orders/${order._id}`
                                )
                              }
                              className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition hover:bg-orange-50 dark:border-gray-700 dark:hover:bg-slate-700"
                            >
            
                              {/* Order icon */}
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-lg dark:bg-orange-900/30">
                                🛍️
                              </div>
            
                              {/* Order information */}
                              <div className="min-w-0 flex-1">
            
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                  Order #{truncateId(order._id, 10)}
                                </p>
            
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {getCustomerName(order)}
                                  {" • "}
                                  {order.customer?.email || "No email"}
                                </p>
            
                              </div>
            
                              {/* Order total/status */}
                              <div className="text-right">
            
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                  Rs. {Number(order.totalPrice || 0).toFixed(2)}
                                </p>
            
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {order.status}
                                </p>
            
                              </div>
            
                            </button>
            
                          ))}
            
                        </div>
                      )}
            
            
                      {/* ====================================== */}
                      {/* NO RESULTS */}
                      {/* ====================================== */}
            
                      {searchResults.products.length === 0 &&
                        searchResults.users.length === 0 &&
                        searchResults.orders.length === 0 && (
            
                          <div className="px-4 py-8 text-center">
            
                            <div className="mb-2 text-3xl">
                              🔍
                            </div>
            
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              No results found
                            </p>
            
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Try searching for a product, user, or order.
                            </p>
            
                          </div>
                        )}
            
                    </>
                  )}
            
                </div>
              )}
            
            </div>
          
            {/* Admin header actions. */}
            <div className="flex items-center gap-2">
          
              {/* Toggles the admin panel between light and dark mode. */}
              <button
                type="button"
                onClick={toggleTheme}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-gray-200 transition hover:bg-orange-500 hover:text-white"
              >
                {darkMode ? (
                  // Sun icon for switching back to light mode.
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                ) : (
                  // Moon icon for switching to dark mode.
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
                  </svg>
                )}
              </button>
          
              {/* Opens the customer-facing store. */}
              <Link
                to="/"
                className="hidden sm:block text-sm whitespace-nowrap hover:text-orange-400"
              >
                View Store
              </Link>
          
            </div>
          
          </header>
       
       
      {/* ================= MAIN AREA ================= */}
      <div className="flex h-[calc(100vh-4rem)]">

        {/* ================= SIDEBAR ================= */}
        {/* Makes the sidebar the positioning reference for the collapse button. */}
            <aside
              className={`h-full bg-white dark:bg-slate-800 shadow-lg flex-shrink-0 transition-all duration-300 flex flex-col ${
                sidebarCollapsed ? "w-20" : "w-64"
              }`}
            >

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">

            <Link
              to="/admin"
              title={sidebarCollapsed ? "Dashboard" : ""}
              className={`flex items-center rounded-lg px-4 py-3 hover:bg-orange-100 hover:text-orange-600 transition ${
                sidebarCollapsed ? "justify-center" : "gap-3"
              }`}
            >
              <span>📊</span>
            
              {!sidebarCollapsed && (
                <span>Dashboard</span>
              )}
            </Link>
            
            <Link
              to="/admin/products"
              title={sidebarCollapsed ? "Products" : ""}
              className={`flex items-center rounded-lg px-4 py-3 hover:bg-orange-100 hover:text-orange-600 transition ${
                sidebarCollapsed ? "justify-center" : "gap-3"
              }`}
            >
              <span>📦</span>
            
              {!sidebarCollapsed && (
                <span>Products</span>
              )}
            </Link>
            
            <Link
              to="/admin/orders"
              title={sidebarCollapsed ? "Orders" : ""}
              className={`flex items-center rounded-lg px-4 py-3 hover:bg-orange-100 hover:text-orange-600 transition ${
                sidebarCollapsed ? "justify-center" : "gap-3"
              }`}
            >
              <span>🛍️</span>
            
              {!sidebarCollapsed && (
                <span>Orders</span>
              )}
            </Link>
            
            <Link
              to="/admin/users"
              title={sidebarCollapsed ? "Users" : ""}
              className={`flex items-center rounded-lg px-4 py-3 hover:bg-orange-100 hover:text-orange-600 transition ${
                sidebarCollapsed ? "justify-center" : "gap-3"
              }`}
            >
              <span>👥</span>
            
              {!sidebarCollapsed && (
                <span>Users</span>
              )}
            </Link>

            {/* Settings link. */}
            <Link
              to="/admin/settings"
              title={sidebarCollapsed ? "Settings" : ""}
              className={`flex items-center rounded-lg px-4 py-3 hover:bg-orange-100 hover:text-orange-600 transition ${
                sidebarCollapsed ? "justify-center" : "gap-3"
              }`}
            >
              <span>⚙️</span>
            
              {!sidebarCollapsed && (
                <span>Settings</span>
              )}
            </Link>
            
            <Link
              to="/"
              title={sidebarCollapsed ? "Exit Admin" : ""}
              className={`mt-8 flex items-center rounded-lg px-4 py-3 hover:bg-red-100 hover:text-red-600 transition ${
                sidebarCollapsed ? "justify-center" : "gap-3"
              }`}
            >
              <span>🚪</span>
            
              {!sidebarCollapsed && (
                <span>Exit Admin</span>
              )}
            </Link>

          </nav>

         {/* Keeps the sidebar toggle inside the sidebar at its bottom-right corner. */}
            <button
              type="button"
              onClick={() =>
                setSidebarCollapsed((previous) => !previous)
              }
              title={
                sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              className="mt-auto mr-4 mb-8 self-end flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-md transition hover:bg-orange-50 hover:text-orange-600 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-orange-900/30 dark:hover:text-orange-400">
              {sidebarCollapsed ? (
                // Sidebar icon pointing right when collapsed.
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M8 4v16" />
                  <path d="m13 9 3 3-3 3" />
                </svg>
              ) : (
                // Sidebar icon pointing left when expanded.
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M16 4v16" />
                  <path d="m11 9-3 3 3 3" />
                </svg>
              )}
            </button>

        </aside>


        {/* ================= PAGE CONTENT ================= */}
        {/* Allows page content to shrink correctly when the sidebar changes width. */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

          <Outlet />

        </main>

      </div>

    </div>
  );
};

export default AdminLayout;