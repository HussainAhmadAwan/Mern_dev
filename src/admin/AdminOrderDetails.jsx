import React, {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import api from "../api/axios";
import { getImageUrl } from "../api/config";
import { getStatusClasses } from "../utils/orderStatus";

const AdminOrderDetails = () => {
  const { id } = useParams();

  const [order, setOrder] =
    useState(null);

  const [status, setStatus] =
    useState("");

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================
  // FETCH ORDER DETAILS
  // ==========================================

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            `/orders/${id}`
          );

        if (response.data.success) {
          const fetchedOrder =
            response.data.order;

          setOrder(fetchedOrder);

          setStatus(
            fetchedOrder.status ||
              "Pending"
          );
        } else {
          setError(
            response.data.message ||
              "Failed to load order details."
          );
        }
      } catch (error) {
        console.error(
          "Failed to load order:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Failed to load order details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // ==========================================
  // FORMAT SAVED ORDER PRICE
  // ==========================================

  const formatOrderPrice = (
    amount
  ) => {
    const numericAmount =
      Number(amount);

    const safeAmount =
      Number.isFinite(
        numericAmount
      )
        ? numericAmount
        : 0;

    const symbol =
      String(
        order?.currencySymbol ||
          "$"
      ).trim() || "$";

    return `${symbol}${safeAmount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  const handleStatusUpdate =
    async () => {
      try {
        setUpdatingStatus(true);
        setStatusMessage("");
        setError("");

        const response =
          await api.put(
            `/orders/${id}/status`,
            {
              status,
            }
          );

        if (response.data.success) {
          const updatedOrder =
            response.data.order;

          setOrder(updatedOrder);

          setStatus(
            updatedOrder.status ||
              "Pending"
          );

          setStatusMessage(
            "Order status updated successfully."
          );
        } else {
          setError(
            response.data.message ||
              "Failed to update order status."
          );
        }
      } catch (error) {
        console.error(
          "Failed to update order status:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Failed to update order status."
        );
      } finally {
        setUpdatingStatus(false);
      }
    };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white p-6 shadow dark:bg-slate-800 sm:p-8">
        <p className="break-words text-orange-600">
          Loading order details...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <div className="mb-6 break-words rounded-xl border border-red-300 bg-red-100 p-5 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>

        <Link
          to="/admin/orders"
          className="inline-flex max-w-full items-center rounded-lg bg-gray-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  // ==========================================
  // ORDER NOT FOUND
  // ==========================================

  if (!order) {
    return (
      <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white p-6 shadow dark:bg-slate-800 sm:p-8">
        <p className="break-words text-gray-500 dark:text-gray-400">
          Order not found.
        </p>

        <Link
          to="/admin/orders"
          className="mt-5 inline-flex items-center rounded-lg bg-gray-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  // ==========================================
  // CUSTOMER
  // ==========================================

  const customerName =
    `${order.customer?.firstName || ""} ${
      order.customer?.lastName || ""
    }`.trim() ||
    "Customer";

  // ==========================================
  // STATUS
  // ==========================================

  const statusClasses =
    getStatusClasses(
      order.status ||
        "Pending"
    );

  // ==========================================
  // CURRENCY
  // ==========================================

  const currencyCode =
    String(
      order.currencyCode ||
        "USD"
    )
      .trim()
      .toUpperCase();

  const currencySymbol =
    String(
      order.currencySymbol ||
        "$"
    ).trim() || "$";

  // ==========================================
  // SAFE ORDER VALUES
  // ==========================================

  const subtotal =
    Number(
      order.subtotal || 0
    );

  const deliveryCharge =
    Number(
      order.deliveryCharge || 0
    );

  const totalPrice =
    Number(
      order.totalPrice || 0
    );

  const totalItems =
    Number(
      order.totalItems || 0
    );

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden lg:space-y-8">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
            Order Details
          </h1>

          <p className="mt-2 break-all text-sm text-gray-500 dark:text-gray-400">
            Order #{order._id}
          </p>
        </div>

        <Link
          to="/admin/orders"
          className="inline-flex w-fit shrink-0 items-center rounded-lg bg-gray-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          ← Back to Orders
        </Link>
      </div>

      {/* ==========================================
          ORDER SUMMARY
      ========================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-4 md:gap-6">

        {/* Order ID */}

        <div className="min-w-0 overflow-hidden rounded-xl bg-white p-5 shadow dark:bg-slate-800 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Order ID
          </p>

          <p className="mt-2 break-all font-mono text-sm font-semibold text-gray-800 dark:text-white">
            {order._id}
          </p>
        </div>

        {/* Order Date */}

        <div className="min-w-0 overflow-hidden rounded-xl bg-white p-5 shadow dark:bg-slate-800 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Order Date
          </p>

          <p className="mt-2 break-words font-semibold text-gray-800 dark:text-white">
            {order.createdAt
              ? new Date(
                  order.createdAt
                ).toLocaleString()
              : "N/A"}
          </p>
        </div>

        {/* Currency */}

        <div className="min-w-0 overflow-hidden rounded-xl bg-white p-5 shadow dark:bg-slate-800 sm:p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Currency
          </p>

          <p className="mt-2 break-words font-semibold text-gray-800 dark:text-white">
            {currencyCode}{" "}
            {currencySymbol}
          </p>
        </div>

        {/* Status */}

        <div className="min-w-0 overflow-hidden rounded-xl bg-white p-5 shadow dark:bg-slate-800 sm:p-6">
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Order Status
          </p>

          <div className="mb-4">
            <span
              className={`inline-flex max-w-full rounded-full px-3 py-1 text-sm font-semibold ${statusClasses}`}
            >
              {order.status ||
                "Pending"}
            </span>
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(
                e.target.value
              );

              setStatusMessage("");
              setError("");
            }}
            className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="Pending">
              Pending
            </option>

            <option value="Processing">
              Processing
            </option>

            <option value="Shipped">
              Shipped
            </option>

            <option value="Delivered">
              Delivered
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>

          <button
            type="button"
            onClick={
              handleStatusUpdate
            }
            disabled={
              updatingStatus ||
              status ===
                order.status
            }
            className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-3 font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingStatus
              ? "Updating..."
              : "Update Status"}
          </button>

          {statusMessage && (
            <p className="mt-3 break-words text-sm font-medium text-green-600 dark:text-green-400">
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      {/* ==========================================
          CUSTOMER + PAYMENT
      ========================================== */}

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">

        {/* Customer Information */}

        <div className="min-w-0 overflow-hidden rounded-xl bg-white p-5 shadow dark:bg-slate-800 sm:p-6">
          <h2 className="mb-6 break-words text-xl font-bold text-gray-800 dark:text-white">
            Customer Information
          </h2>

          <div className="space-y-5">

            {/* Name */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Name
              </p>

              <p className="break-words font-medium text-gray-800 dark:text-white">
                {customerName}
              </p>
            </div>

            {/* Email */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Email
              </p>

              <p className="break-all font-medium text-gray-800 dark:text-white">
                {order.customer?.email ||
                  "N/A"}
              </p>
            </div>

            {/* Phone */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Phone
              </p>

              <p className="break-words font-medium text-gray-800 dark:text-white">
                {order.customer?.phone ||
                  "N/A"}
              </p>
            </div>

            {/* Shipping Address */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Shipping Address
              </p>

              <p className="break-words font-medium text-gray-800 dark:text-white">
                {order.customer?.address ||
                  "N/A"}
              </p>

              <p className="break-words text-gray-500 dark:text-gray-400">
                {order.customer?.city ||
                  ""}

                {order.customer?.zipCode
                  ? `, ${order.customer.zipCode}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Information */}

        <div className="min-w-0 overflow-hidden rounded-xl bg-white p-5 shadow dark:bg-slate-800 sm:p-6">
          <h2 className="mb-6 break-words text-xl font-bold text-gray-800 dark:text-white">
            Payment Information
          </h2>

          <div className="space-y-5">

            {/* Payment Method */}

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Payment Method
              </p>

              <p className="break-words font-medium text-gray-800 dark:text-white">
                {order.paymentMethod ||
                  "N/A"}
              </p>
            </div>

            {/* Total Items */}

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Items
              </p>

              <p className="font-medium text-gray-800 dark:text-white">
                {totalItems}
              </p>
            </div>

            {/* Subtotal */}

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Subtotal
              </p>

              <p className="break-words font-semibold text-gray-800 dark:text-white">
                {formatOrderPrice(
                  subtotal
                )}
              </p>
            </div>

            {/* Delivery Charges */}

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Delivery Charges
              </p>

              <p className="break-words font-semibold text-gray-800 dark:text-white">
                {deliveryCharge > 0
                  ? formatOrderPrice(
                      deliveryCharge
                    )
                  : "Free"}
              </p>
            </div>

            {/* Total Amount */}

            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Amount
              </p>

              <p className="break-words text-2xl font-bold text-orange-600">
                {formatOrderPrice(
                  totalPrice
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          ORDERED PRODUCTS
      ========================================== */}

      <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white shadow dark:bg-slate-800">

        <div className="border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <h2 className="break-words text-xl font-bold text-gray-800 dark:text-white">
            Ordered Products
          </h2>
        </div>

        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">

            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200 sm:px-6">
                  Product
                </th>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200 sm:px-6">
                  Price
                </th>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200 sm:px-6">
                  Quantity
                </th>

                <th className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200 sm:px-6">
                  Subtotal
                </th>

              </tr>
            </thead>

            <tbody>
              {order.items?.map(
                (item, index) => {
                  const itemPrice =
                    Number(
                      item.price || 0
                    );

                  const itemQuantity =
                    Number(
                      item.quantity || 0
                    );

                  const itemSubtotal =
                    itemPrice *
                    itemQuantity;

                  return (
                    <tr
                      key={
                        item.productId ||
                        `${item.name || "product"}-${index}`
                      }
                      className="border-t border-gray-200 dark:border-gray-700"
                    >

                      {/* Product */}

                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex min-w-0 items-center gap-4">

                          {item.image ? (
                            <img
                              src={getImageUrl(
                                item.image
                              )}
                              alt={
                                item.name ||
                                "Product"
                              }
                              className="h-16 w-16 shrink-0 rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 dark:bg-slate-700">
                              No Image
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="break-words font-semibold text-gray-800 dark:text-white">
                              {item.name ||
                                "Product"}
                            </p>

                            {item.productId && (
                              <p className="mt-1 break-all text-xs text-gray-500 dark:text-gray-400">
                                ID:{" "}
                                {
                                  item.productId
                                }
                              </p>
                            )}
                          </div>

                        </div>
                      </td>

                      {/* Price */}

                      <td className="whitespace-nowrap px-5 py-4 text-gray-700 dark:text-gray-300 sm:px-6">
                        {formatOrderPrice(
                          itemPrice
                        )}
                      </td>

                      {/* Quantity */}

                      <td className="whitespace-nowrap px-5 py-4 text-gray-700 dark:text-gray-300 sm:px-6">
                        {itemQuantity}
                      </td>

                      {/* Subtotal */}

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-orange-600 sm:px-6">
                        {formatOrderPrice(
                          itemSubtotal
                        )}
                      </td>

                    </tr>
                  );
                }
              )}
            </tbody>

            {/* Order Total */}

            <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-gray-600">

                <td
                  colSpan="3"
                  className="px-5 py-5 text-right font-bold text-gray-800 dark:text-white sm:px-6"
                >
                  Order Total:
                </td>

                <td className="whitespace-nowrap px-5 py-5 text-xl font-bold text-orange-600 sm:px-6">
                  {formatOrderPrice(
                    totalPrice
                  )}
                </td>

              </tr>
            </tfoot>

          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;