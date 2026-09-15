import React, { useEffect, useState } from "react";
import api from "../api/axios";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Store the selected ID for the popup.
  const [selectedId, setSelectedId] = useState(null);

  // Store which type of ID is selected.
  const [selectedIdType, setSelectedIdType] = useState("");

  // Fetch dashboard statistics.
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/stats");

        console.log("Admin Stats:", response.data);

        if (response.data.success) {
          setStats(response.data.stats);

          setRecentOrders(
            response.data.stats.recentOrders || []
          );
        }
      } catch (error) {
        console.error(
          "Failed to load admin statistics:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Open the ID popup.
  const openIdPopup = (id, type) => {
    setSelectedId(id);
    setSelectedIdType(type);
  };

  // Close the ID popup.
  const closeIdPopup = () => {
    setSelectedId(null);
    setSelectedIdType("");
  };

  // Get the short MongoDB ID.
  const getShortMongoId = (id) => {
    if (!id) {
      return "N/A";
    }

    return String(id).slice(-6);
  };

  return (
    <div>
      {/* Page Title */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-2">
          Welcome to your Shopee Admin Dashboard.
        </p>

        {loading && (
          <p className="text-orange-600 mt-2">
            Loading dashboard statistics...
          </p>
        )}

        {error && (
          <p className="text-red-600 mt-2">
            {error}
          </p>
        )}
      </div>

      {/* Stat Cards */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orders */}

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Total Orders
              </p>

              <h2 className="text-3xl font-bold mt-2 dark:text-white">
                {loading ? "..." : stats.totalOrders}
              </h2>
            </div>

            <div className="text-4xl">
              🛍️
            </div>
          </div>
        </div>

        {/* Products */}

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Total Products
              </p>

              <h2 className="text-3xl font-bold mt-2 dark:text-white">
                {loading ? "..." : stats.totalProducts}
              </h2>
            </div>

            <div className="text-4xl">
              📦
            </div>
          </div>
        </div>

        {/* Users */}

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Total Users
              </p>

              <h2 className="text-3xl font-bold mt-2 dark:text-white">
                {loading ? "..." : stats.totalUsers}
              </h2>
            </div>

            <div className="text-4xl">
              👥
            </div>
          </div>
        </div>

        {/* Revenue */}

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Total Revenue
              </p>

              <h2 className="text-3xl font-bold mt-2 text-orange-600">
                {loading
                  ? "..."
                  : `$${Number(stats.totalRevenue).toFixed(2)}`}
              </h2>
            </div>

            <div className="text-4xl">
              💰
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}

      <div className="mt-8 overflow-hidden rounded-xl bg-white shadow dark:bg-gray-800">
        {/* Header */}

        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Recent Orders
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Latest orders placed by customers.
          </p>
        </div>

        {/* Empty State */}

        {recentOrders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mb-3 text-4xl">
              🛍️
            </div>

            <h3 className="font-semibold text-gray-800 dark:text-white">
              No Orders Yet
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Customer orders will appear here.
            </p>
          </div>
        ) : (
          /* Responsive Table */

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    OrderID
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    MongoID
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Items
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Total
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Status
                  </th>

                  <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    {/* OrderID */}

                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          openIdPopup(
                            order.orderId,
                            "OrderID"
                          )
                        }
                        className="font-mono text-sm font-semibold text-orange-600 hover:underline"
                      >
                        {order.orderId || "N/A"}
                      </button>
                    </td>

                    {/* MongoID */}

                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          openIdPopup(
                            order._id,
                            "MongoID"
                          )
                        }
                        className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        #{getShortMongoId(order._id)}
                      </button>
                    </td>

                    {/* Customer */}

                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {`${order.customer?.firstName || ""} ${
                          order.customer?.lastName || ""
                        }`.trim() || "Unknown Customer"}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.customer?.email || "No email"}
                      </p>
                    </td>

                    {/* Items */}

                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {order.totalItems ||
                        order.items?.length ||
                        0}
                    </td>

                    {/* Total */}

                    <td className="px-4 py-3 font-semibold text-orange-600">
                      $
                      {Number(
                        order.totalPrice || 0
                      ).toFixed(2)}
                    </td>

                    {/* Status */}

                    <td className="px-4 py-3">
                      <span
                        className={`
                          inline-flex
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          ${
                            order.status?.toLowerCase() ===
                            "delivered"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : order.status?.toLowerCase() ===
                                "shipped"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                              : order.status?.toLowerCase() ===
                                  "cancelled" ||
                                order.status?.toLowerCase() ===
                                  "canceled"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                          }
                        `}
                      >
                        {order.status || "Pending"}
                      </span>
                    </td>

                    {/* Date */}

                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {order.createdAt
                        ? new Date(
                            order.createdAt
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ID Popup */}

      {selectedId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeIdPopup}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedIdType}
              </h2>

              <button
                type="button"
                onClick={closeIdPopup}
                className="text-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-gray-100 p-3 dark:bg-slate-900">
              <p className="break-all font-mono text-sm text-gray-800 dark:text-gray-200">
                {selectedId}
              </p>
            </div>

            <button
              type="button"
              onClick={closeIdPopup}
              className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;