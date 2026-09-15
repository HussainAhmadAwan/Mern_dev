import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/axios";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getStatusClasses } from "../utils/orderStatus";

// Available statuses supported by the backend.
const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const AdminOrders = () => {
  const { formatPrice } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [selectedIdType, setSelectedIdType] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Track which order is currently updating its status.
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // ==========================================
  // FETCH ORDERS
  // ==========================================

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/orders");

      if (response.data?.success) {
        setOrders(response.data.orders || []);
      } else {
        setError(
          response.data?.message ||
            "Failed to load orders."
        );
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load orders when the page opens.
  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================
  // DATE HELPERS
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleTimeString(
      undefined,
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // CUSTOMER NAME
  // ==========================================

  const getCustomerName = (order) => {
    const firstName =
      order?.customer?.firstName || "";

    const lastName =
      order?.customer?.lastName || "";

    const fullName =
      `${firstName} ${lastName}`.trim();

    return fullName || "Unknown Customer";
  };

  // ==========================================
  // SHORT MONGODB ID
  // ==========================================

  const getShortMongoId = (id) => {
    if (!id) {
      return "—";
    }

    const value = String(id);

    if (value.length <= 6) {
      return value;
    }

    return `...${value.slice(-6)}`;
  };

  // ==========================================
  // ID POPUP
  // ==========================================

  const openIdPopup = (id, type) => {
    if (!id) {
      return;
    }

    setSelectedId(String(id));
    setSelectedIdType(type);
  };

  const closeIdPopup = () => {
    setSelectedId(null);
    setSelectedIdType(null);
  };

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  const handleStatusChange = async (
    order,
    newStatus
  ) => {
    const currentStatus =
      order.status || "Pending";

    // Do nothing if the selected status is unchanged.
    if (currentStatus === newStatus) {
      return;
    }

    // Confirm cancellation before making the request.
    if (newStatus === "Cancelled") {
      const confirmed = window.confirm(
        `Are you sure you want to cancel order ${
          order.orderId || order._id
        }?\n\nThe ordered product stock will be restored.`
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setUpdatingStatusId(order._id);
      setError("");

      const response = await api.put(
        `/orders/${order._id}/status`,
        {
          status: newStatus,
        }
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Failed to update order status."
        );
      }

      const updatedOrder =
        response.data.order;

      // Update only the changed order in the table.
      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          String(item._id) ===
          String(order._id)
            ? updatedOrder
            : item
        )
      );
    } catch (err) {
      console.error(
        "Failed to update order status:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update order status."
      );

      // Refresh so the dropdown returns to the real database value.
      await fetchOrders(true);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ==========================================
  // FILTER ORDERS
  // ==========================================

  const filteredOrders = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const customerName =
        getCustomerName(order).toLowerCase();

      const customerEmail =
        String(
          order?.customer?.email || ""
        ).toLowerCase();

      const orderId =
        String(
          order?.orderId || ""
        ).toLowerCase();

      const mongoId =
        String(
          order?._id || ""
        ).toLowerCase();

      const orderStatus =
        order?.status || "Pending";

      const matchesSearch =
        !search ||
        customerName.includes(search) ||
        customerEmail.includes(search) ||
        orderId.includes(search) ||
        mongoId.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        orderStatus === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    orders,
    searchTerm,
    statusFilter,
  ]);

  // ==========================================
  // ORDER STATISTICS
  // ==========================================

  const orderStatistics = useMemo(() => {
    const statistics = {
      All: orders.length,
      Pending: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    orders.forEach((order) => {
      const status =
        order?.status || "Pending";

      if (
        Object.prototype.hasOwnProperty.call(
          statistics,
          status
        )
      ) {
        statistics[status] += 1;
      }
    });

    return statistics;
  }, [orders]);

  // ==========================================
  // STATUS SELECT CLASSES
  // ==========================================

  const getStatusSelectClasses = (status) => {
    const baseClasses =
      "rounded-lg border px-3 py-2 text-sm font-medium outline-none transition focus:ring-2";

    switch (status) {
      case "Pending":
        return `${baseClasses} border-yellow-300 bg-yellow-50 text-yellow-700 focus:ring-yellow-300 dark:border-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300`;

      case "Processing":
        return `${baseClasses} border-blue-300 bg-blue-50 text-blue-700 focus:ring-blue-300 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300`;

      case "Shipped":
        return `${baseClasses} border-purple-300 bg-purple-50 text-purple-700 focus:ring-purple-300 dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-300`;

      case "Delivered":
        return `${baseClasses} border-green-300 bg-green-50 text-green-700 focus:ring-green-300 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300`;

      case "Cancelled":
        return `${baseClasses} border-red-300 bg-red-50 text-red-700 focus:ring-red-300 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300`;

      default:
        return `${baseClasses} border-gray-300 bg-white text-gray-700 focus:ring-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200`;
    }
  };

  // ==========================================
  // STATUS CHANGE AVAILABILITY
  // ==========================================

  const canChangeStatus = (status) => {
    return (
      status !== "Delivered" &&
      status !== "Cancelled"
    );
  };

  // ==========================================
  // STATISTIC CARD
  // ==========================================

  const renderStatisticCard = (
    label,
    value,
    icon,
    status
  ) => {
    const isActive =
      statusFilter === status;

    return (
      <button
        type="button"
        onClick={() =>
          setStatusFilter(status)
        }
        className={`rounded-xl border p-4 text-left shadow-sm transition ${
          isActive
            ? "border-orange-400 bg-orange-50 ring-2 ring-orange-200 dark:border-orange-500 dark:bg-orange-950/30 dark:ring-orange-900"
            : "border-gray-200 bg-white hover:border-orange-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-500"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {label}
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          </div>

          <span className="text-2xl">
            {icon}
          </span>
        </div>
      </button>
    );
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading orders...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="space-y-6">
      {/* ==========================================
          HEADER
          ========================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Orders
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage customer orders and update
            their status.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            fetchOrders(true)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          >
            ↻
          </span>

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ==========================================
          ERROR MESSAGE
          ========================================== */}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="font-bold hover:text-red-900 dark:hover:text-red-100"
          >
            ×
          </button>
        </div>
      )}

      {/* ==========================================
          STATISTICS
          ========================================== */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {renderStatisticCard(
          "All Orders",
          orderStatistics.All,
          "📦",
          "All"
        )}

        {renderStatisticCard(
          "Pending",
          orderStatistics.Pending,
          "⏳",
          "Pending"
        )}

        {renderStatisticCard(
          "Processing",
          orderStatistics.Processing,
          "⚙️",
          "Processing"
        )}

        {renderStatisticCard(
          "Shipped",
          orderStatistics.Shipped,
          "🚚",
          "Shipped"
        )}

        {renderStatisticCard(
          "Delivered",
          orderStatistics.Delivered,
          "✅",
          "Delivered"
        )}

        {renderStatisticCard(
          "Cancelled",
          orderStatistics.Cancelled,
          "❌",
          "Cancelled"
        )}
      </div>

      {/* ==========================================
          SEARCH AND FILTER
          ========================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search by order ID, customer or email..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-orange-900"
            />
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="order-status-filter"
              className="text-sm font-medium text-gray-600 dark:text-gray-300"
            >
              Status:
            </label>

            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200 dark:focus:ring-orange-900"
            >
              <option value="All">
                All
              </option>

              {ORDER_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ==========================================
          RESULT COUNT
          ========================================== */}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {filteredOrders.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {orders.length}
          </span>{" "}
          orders
        </p>

        {(searchTerm ||
          statusFilter !== "All") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("All");
            }}
            className="text-sm font-medium text-orange-500 hover:text-orange-600"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ==========================================
          EMPTY STATE
          ========================================== */}

      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-5xl">
            📦
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No orders found
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Try changing your search or
            status filter.
          </p>
        </div>
      ) : (
        /* ==========================================
           ORDERS TABLE
           ========================================== */
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900/70">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Order ID
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Mongo ID
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Customer
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Items
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Subtotal
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Delivery
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Date
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredOrders.map(
                  (order) => {
                    const status =
                      order.status ||
                      "Pending";

                    const isUpdating =
                      updatingStatusId ===
                      order._id;

                    const statusCanChange =
                      canChangeStatus(
                        status
                      );

                    return (
                      <tr
                        key={order._id}
                        className="transition hover:bg-gray-50 dark:hover:bg-slate-900/40"
                      >
                        {/* ORDER ID */}
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              openIdPopup(
                                order.orderId,
                                "Order ID"
                              )
                            }
                            className="font-semibold text-orange-500 hover:text-orange-600 hover:underline"
                            title="Click to view full Order ID"
                          >
                            {order.orderId ||
                              "—"}
                          </button>
                        </td>

                        {/* MONGO ID */}
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              openIdPopup(
                                order._id,
                                "Mongo ID"
                              )
                            }
                            className="font-mono text-sm text-gray-600 hover:text-orange-500 dark:text-gray-300 dark:hover:text-orange-400"
                            title="Click to view full MongoDB ID"
                          >
                            {getShortMongoId(
                              order._id
                            )}
                          </button>
                        </td>

                        {/* CUSTOMER */}
                        <td className="px-4 py-4">
                          <div className="min-w-[170px]">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {getCustomerName(
                                order
                              )}
                            </p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {order
                                ?.customer
                                ?.email ||
                                "—"}
                            </p>
                          </div>
                        </td>

                        {/* ITEMS */}
                        <td className="px-4 py-4 text-center">
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {Number(
                              order.totalItems ||
                                0
                            )}
                          </span>
                        </td>

                        {/* SUBTOTAL */}
                        <td className="px-4 py-4 text-right">
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {formatPrice(
                              Number(
                                order.subtotal ||
                                  0
                              )
                            )}
                          </span>
                        </td>

                        {/* DELIVERY */}
                        <td className="px-4 py-4 text-right">
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {formatPrice(
                              Number(
                                order.deliveryCharge ||
                                  0
                              )
                            )}
                          </span>
                        </td>

                        {/* TOTAL */}
                        <td className="px-4 py-4 text-right">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatPrice(
                              Number(
                                order.totalPrice ||
                                  0
                              )
                            )}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="px-4 py-4">
                          <div className="flex min-w-[145px] flex-col gap-2">
                            {statusCanChange ? (
                              <select
                                value={status}
                                disabled={
                                  isUpdating
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleStatusChange(
                                    order,
                                    event.target
                                      .value
                                  )
                                }
                                className={getStatusSelectClasses(
                                  status
                                )}
                                title="Change order status"
                              >
                                {ORDER_STATUSES.map(
                                  (
                                    option
                                  ) => {
                                    // Prevent reopening or moving to an invalid previous status.
                                    const currentIndex =
                                      ORDER_STATUSES.indexOf(
                                        status
                                      );

                                    const optionIndex =
                                      ORDER_STATUSES.indexOf(
                                        option
                                      );

                                    const isCancelled =
                                      option ===
                                      "Cancelled";

                                    const isBackward =
                                      [
                                        "Pending",
                                        "Processing",
                                        "Shipped",
                                        "Delivered",
                                      ].includes(
                                        status
                                      ) &&
                                      [
                                        "Pending",
                                        "Processing",
                                        "Shipped",
                                        "Delivered",
                                      ].includes(
                                        option
                                      ) &&
                                      optionIndex <
                                        currentIndex;

                                    const isDisabled =
                                      option !==
                                        status &&
                                      (isBackward ||
                                        (isCancelled &&
                                          status !==
                                            "Pending" &&
                                          status !==
                                            "Processing"));

                                    return (
                                      <option
                                        key={
                                          option
                                        }
                                        value={
                                          option
                                        }
                                        disabled={
                                          isDisabled
                                        }
                                      >
                                        {option}
                                      </option>
                                    );
                                  }
                                )}
                              </select>
                            ) : (
                              <span
                                className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClasses(
                                  status
                                )}`}
                              >
                                {status}
                              </span>
                            )}

                            {isUpdating && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Updating...
                              </span>
                            )}
                          </div>
                        </td>

                        {/* DATE */}
                        <td className="px-4 py-4">
                          <div className="whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {formatDate(
                                order.createdAt
                              )}
                            </p>

                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(
                                order.createdAt
                              )}
                            </p>
                          </div>
                        </td>

                        {/* ACTION */}
                        <td className="px-4 py-4 text-center">
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-orange-400 hover:text-orange-500 dark:border-slate-600 dark:text-gray-200 dark:hover:border-orange-500 dark:hover:text-orange-400"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          FULL ID POPUP
          ========================================== */}

      {selectedId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeIdPopup}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-800"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Full {selectedIdType}
              </h2>

              <button
                type="button"
                onClick={closeIdPopup}
                className="text-2xl leading-none text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="mt-5 rounded-lg bg-gray-100 p-4 dark:bg-slate-900">
              <p className="break-all font-mono text-sm text-gray-800 dark:text-gray-200">
                {selectedId}
              </p>
            </div>

            <button
              type="button"
              onClick={closeIdPopup}
              className="mt-5 w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;