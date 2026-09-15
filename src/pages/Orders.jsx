import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { getStatusClasses } from "../utils/orderStatus";

const Orders = () => {
  const { formatPrice } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Build a valid product image URL.
  const getImageUrl = (image) => {
    if (!image) return "/placeholder.png";

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    if (image.startsWith("/")) {
      return `http://localhost:5050${image}`;
    }

    return `http://localhost:5050/${image}`;
  };

  // Fetch customer's orders.
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/orders/my-orders"
        );

        setOrders(
          response.data?.orders || []
        );
      } catch (error) {
        console.error(
          "Failed to load orders:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load your orders."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Format order date.
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // Calculate total product quantity.
  const getTotalItems = (order) => {
    if (
      Number.isFinite(
        Number(order?.totalItems)
      )
    ) {
      return Number(order.totalItems);
    }

    return (
      order?.items?.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      ) || 0
    );
  };

  // Show loading state.
  if (loading) {
    return (
      <section className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-5 dark:bg-slate-900 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-6xl min-w-0">
          <div className="mb-4">
            <div className="h-7 w-36 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />

            <div className="mt-1.5 h-3.5 w-56 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-xl bg-white shadow-sm dark:bg-slate-800"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-5 dark:bg-slate-900 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-6xl min-w-0">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            My Orders
          </h1>

          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            View and manage your recent orders.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty Orders */}
        {!error &&
          orders.length === 0 && (
            <div className="rounded-xl bg-white px-5 py-10 text-center shadow-sm dark:bg-slate-800">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <span className="text-2xl">
                  📦
                </span>
              </div>

              <h2 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                No Orders Yet
              </h2>

              <p className="mx-auto mt-1.5 max-w-md text-sm text-gray-500 dark:text-gray-400">
                You haven't placed any orders
                yet. Start shopping and your
                orders will appear here.
              </p>

              <Link
                to="/Product_page"
                className="mt-4 inline-block rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Start Shopping
              </Link>
            </div>
          )}

        {/* Orders */}
        {!error &&
          orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusClasses =
                  getStatusClasses(
                    order.status
                  );

                const totalItems =
                  getTotalItems(order);

                return (
                  <div
                    key={order._id}
                    className="min-w-0 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800"
                  >
                    {/* Order Header */}
                    <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-700 sm:px-5">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                            Order Number
                          </p>

                          <p className="mt-0.5 truncate text-sm font-bold text-orange-600">
                            #{order.orderId || "N/A"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses}`}
                        >
                          {order.status ||
                            "Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Order Content */}
                    <div className="px-4 py-3 sm:px-5">
                      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Products Preview */}
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex shrink-0 -space-x-2">
                            {(order.items || [])
                              .slice(0, 3)
                              .map(
                                (
                                  item,
                                  index
                                ) => (
                                  <div
                                    key={`${item.productId || item.name}-${index}`}
                                    className="h-11 w-11 overflow-hidden rounded-lg border-2 border-white bg-gray-100 dark:border-slate-800 dark:bg-slate-700"
                                  >
                                    <img
                                      src={getImageUrl(
                                        item.image
                                      )}
                                      alt={
                                        item.name ||
                                        "Product"
                                      }
                                      className="h-full w-full object-cover"
                                      onError={(
                                        event
                                      ) => {
                                        if (
                                          event.currentTarget.src.endsWith(
                                            "/placeholder.png"
                                          )
                                        ) {
                                          return;
                                        }

                                        event.currentTarget.src =
                                          "/placeholder.png";
                                      }}
                                    />
                                  </div>
                                )
                              )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {order
                                .items?.[0]
                                ?.name ||
                                "Order Items"}
                            </p>

                            {order.items
                              ?.length > 1 && (
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                +{" "}
                                {order.items
                                  .length -
                                  1}{" "}
                                more{" "}
                                {order.items
                                  .length -
                                  1 ===
                                1
                                  ? "product"
                                  : "products"}
                              </p>
                            )}

                            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                              {totalItems}{" "}
                              {totalItems ===
                              1
                                ? "item"
                                : "items"}
                            </p>
                          </div>
                        </div>

                        {/* Order Information */}
                        <div className="grid min-w-0 grid-cols-3 gap-3 sm:gap-6 lg:min-w-[390px]">
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                              Date
                            </p>

                            <p className="mt-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200 sm:text-sm">
                              {formatDate(
                                order.createdAt
                              )}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                              Payment
                            </p>

                            <p
                              className="mt-0.5 truncate text-xs font-semibold text-gray-800 dark:text-gray-200 sm:text-sm"
                              title={
                                order.paymentMethod ||
                                "N/A"
                              }
                            >
                              {order.paymentMethod ||
                                "N/A"}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                              Total
                            </p>

                            <p className="mt-0.5 break-words text-sm font-bold text-orange-600">
                              {formatPrice(
                                Number(
                                  order.totalPrice ||
                                    0
                                )
                              )}
                            </p>
                          </div>
                        </div>

                        {/* View Button */}
                        <div className="shrink-0">
                          <Link
                            to={`/orders/${order._id}`}
                            className="block rounded-lg border border-orange-600 px-4 py-2 text-center text-xs font-semibold text-orange-600 transition hover:bg-orange-600 hover:text-white sm:text-sm"
                          >
                            View Order
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </section>
  );
};

export default Orders;