import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/axios";

import { useCart } from "../context/CartContext";

import { getImageUrl } from "../api/config";

import { getStatusClasses } from "../utils/orderStatus";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { formatPrice } = useCart();

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshLoading, setRefreshLoading] =
    useState(false);

  const [cancelLoading, setCancelLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const fetchOrder =
    useCallback(
      async (
        showLoading = false
      ) => {
        try {
          if (showLoading) {
            setLoading(true);
          }

          setError("");

          const response =
            await api.get(
              `/orders/${id}`
            );

          const latestOrder =
            response.data?.order ||
            null;

          setOrder(
            latestOrder
          );

          setLastUpdated(
            new Date()
          );
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
          if (showLoading) {
            setLoading(false);
          }
        }
      },
      [id]
    );

  useEffect(() => {
    if (id) {
      fetchOrder(true);
    }
  }, [id, fetchOrder]);

  useEffect(() => {
    if (!id || !order) {
      return;
    }

    const interval =
      setInterval(() => {
        fetchOrder(false);
      }, 15000);

    return () =>
      clearInterval(
        interval
      );
  }, [
    id,
    order,
    fetchOrder,
  ]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          fetchOrder(false);
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [id, fetchOrder]);

  const handleRefresh =
    async () => {
      try {
        setRefreshLoading(
          true
        );

        await fetchOrder(false);
      } finally {
        setRefreshLoading(
          false
        );
      }
    };

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "N/A";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "N/A";
    }

    return parsedDate.toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const formatLastUpdated = (
    date
  ) => {
    if (!date) {
      return "Not checked yet";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Not checked yet";
    }

    return parsedDate.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  };

  const handleCancelOrder =
    async () => {
      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this order?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setCancelLoading(
          true
        );

        setError("");

        const response =
          await api.put(
            `/orders/${id}/cancel`
          );

        setOrder(
          response.data?.order ||
            null
        );

        setLastUpdated(
          new Date()
        );

        alert(
          response.data?.message ||
            "Order cancelled successfully."
        );
      } catch (error) {
        console.error(
          "Cancel Order Error:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Failed to cancel the order."
        );
      } finally {
        setCancelLoading(
          false
        );
      }
    };

  if (loading) {
    return (
      <section className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-5 dark:bg-slate-900 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-5xl min-w-0">
          <div className="h-7 w-44 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />

          <div className="mt-4 h-52 animate-pulse rounded-xl bg-white dark:bg-slate-800" />

          <div className="mt-4 h-40 animate-pulse rounded-xl bg-white dark:bg-slate-800" />
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-5 dark:bg-slate-900 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-2xl min-w-0">
          <div className="rounded-xl bg-white p-6 text-center shadow-sm dark:bg-slate-800 sm:p-7">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                !
              </span>
            </div>

            <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
              Unable to Load Order
            </h1>

            <p className="mt-1.5 break-words text-sm text-gray-500 dark:text-gray-400">
              {error ||
                "The requested order could not be found."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/orders"
                )
              }
              className="mt-4 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Back to My Orders
            </button>
          </div>
        </div>
      </section>
    );
  }

  const statusClasses =
    getStatusClasses(
      order.status
    );

  const subtotal = Number(
    order.subtotal || 0
  );

  const couponDiscount =
    Number(
      order.couponDiscount ||
        0
    );

  const deliveryCharge =
    Number(
      order.deliveryCharge ||
        0
    );

  const totalPrice = Number(
    order.totalPrice ??
      subtotal -
        couponDiscount +
        deliveryCharge
  );

  const canCancel =
    order.status !==
      "Shipped" &&
    order.status !==
      "Delivered" &&
    order.status !==
      "Cancelled";

  const customerName =
    `${order.customer?.firstName || ""} ${
      order.customer?.lastName || ""
    }`.trim() ||
    "Customer";

  const trackingSteps = [
    {
      key: "Pending",
      title: "Order Placed",
      description:
        "Your order has been received.",
      icon: "✓",
    },

    {
      key: "Processing",
      title: "Processing",
      description:
        "Your order is being prepared.",
      icon: "⚙",
    },

    {
      key: "Shipped",
      title: "Shipped",
      description:
        "Your order is on the way.",
      icon: "🚚",
    },

    {
      key: "Delivered",
      title: "Delivered",
      description:
        "Your order has been delivered.",
      icon: "✓",
    },
  ];

  const statusOrder = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
  ];

  const currentStatusIndex =
    statusOrder.indexOf(
      order.status
    );

  const isCancelled =
    order.status ===
    "Cancelled";

  return (
    <section className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-5 dark:bg-slate-900 sm:px-6 sm:py-6">
      <div className="mx-auto w-full max-w-5xl min-w-0">
        {/* Back */}
        <div className="mb-4">
          <Link
            to="/orders"
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Back to My Orders
          </Link>
        </div>

        {/* Order Header */}
        <div className="min-w-0 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Order Number
              </p>

              <h1 className="mt-0.5 break-all text-xl font-bold text-orange-600 sm:text-2xl">
                #{order.orderId ||
                  "N/A"}
              </h1>

              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Placed on{" "}
                {formatDate(
                  order.createdAt
                )}
              </p>
            </div>

            <span
              className={`w-fit shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${statusClasses}`}
            >
              {order.status ||
                "Pending"}
            </span>
          </div>

          <div className="mt-4 flex min-w-0 flex-col gap-2 border-t border-gray-100 pt-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Status updates automatically every 15 seconds.
              </p>

              <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                Last checked:{" "}
                {formatLastUpdated(
                  lastUpdated
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleRefresh
              }
              disabled={
                refreshLoading ||
                cancelLoading
              }
              className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              <span
                className={
                  refreshLoading
                    ? "animate-spin"
                    : ""
                }
              >
                ↻
              </span>

              {refreshLoading
                ? "Refreshing..."
                : "Refresh Status"}
            </button>
          </div>

          {canCancel && (
            <div className="mt-3 border-t border-gray-100 pt-3 dark:border-slate-700">
              <button
                type="button"
                onClick={
                  handleCancelOrder
                }
                disabled={
                  cancelLoading ||
                  refreshLoading
                }
                className="rounded-lg border border-red-500 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLoading
                  ? "Cancelling..."
                  : "Cancel Order"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-3 break-words rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Tracking */}
        <div className="mt-4 min-w-0 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Order Tracking
              </h2>

              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Track the progress of your order.
              </p>
            </div>

            {!isCancelled && (
              <span className="shrink-0 text-xs font-semibold text-orange-600">
                {order.status ||
                  "Pending"}
              </span>
            )}
          </div>

          {isCancelled ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500 text-lg text-white">
                  ×
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-red-700 dark:text-red-400">
                    Order Cancelled
                  </h3>

                  <p className="mt-0.5 break-words text-xs text-red-600 dark:text-red-300">
                    This order has been cancelled and will not be delivered.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              {/* Desktop */}
              <div className="hidden sm:block">
                <div className="relative">
                  <div className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-gray-200 dark:bg-slate-700" />

                  <div
                    className="absolute left-[12.5%] top-5 h-1 rounded-full bg-orange-500 transition-all duration-500"
                    style={{
                      width:
                        currentStatusIndex <=
                        0
                          ? "0%"
                          : currentStatusIndex ===
                            1
                          ? "25%"
                          : currentStatusIndex ===
                            2
                          ? "50%"
                          : "75%",
                    }}
                  />

                  <div className="relative grid grid-cols-4">
                    {trackingSteps.map(
                      (
                        step,
                        index
                      ) => {
                        const completed =
                          currentStatusIndex >=
                          index;

                        const active =
                          currentStatusIndex ===
                          index;

                        return (
                          <div
                            key={
                              step.key
                            }
                            className="flex min-w-0 flex-col items-center text-center"
                          >
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 text-sm font-bold transition-all ${
                                completed
                                  ? "border-orange-500 bg-orange-500 text-white"
                                  : "border-gray-200 bg-white text-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-500"
                              } ${
                                active
                                  ? "ring-4 ring-orange-100 dark:ring-orange-900/30"
                                  : ""
                              }`}
                            >
                              {
                                step.icon
                              }
                            </div>

                            <h3
                              className={`mt-2.5 text-sm font-bold ${
                                completed
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {
                                step.title
                              }
                            </h3>

                            <p
                              className={`mt-0.5 max-w-[150px] text-xs leading-5 ${
                                completed
                                  ? "text-gray-500 dark:text-gray-400"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              {
                                step.description
                              }
                            </p>

                            {active && (
                              <span className="mt-1.5 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                Current Status
                              </span>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile */}
              <div className="sm:hidden">
                {trackingSteps.map(
                  (
                    step,
                    index
                  ) => {
                    const completed =
                      currentStatusIndex >=
                      index;

                    const active =
                      currentStatusIndex ===
                      index;

                    const isLast =
                      index ===
                      trackingSteps.length -
                        1;

                    return (
                      <div
                        key={
                          step.key
                        }
                        className="relative flex gap-3"
                      >
                        {!isLast && (
                          <div
                            className={`absolute left-5 top-10 h-full w-1 ${
                              currentStatusIndex >
                              index
                                ? "bg-orange-500"
                                : "bg-gray-200 dark:bg-slate-700"
                            }`}
                          />
                        )}

                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 text-sm font-bold ${
                            completed
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-gray-200 bg-white text-gray-400 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-500"
                          } ${
                            active
                              ? "ring-4 ring-orange-100 dark:ring-orange-900/30"
                              : ""
                          }`}
                        >
                          {
                            step.icon
                          }
                        </div>

                        <div
                          className={`min-w-0 ${
                            isLast
                              ? ""
                              : "pb-6"
                          }`}
                        >
                          <h3
                            className={`text-sm font-bold ${
                              completed
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {
                              step.title
                            }
                          </h3>

                          <p
                            className={`mt-0.5 break-words text-xs leading-5 ${
                              completed
                                ? "text-gray-500 dark:text-gray-400"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {
                              step.description
                            }
                          </p>

                          {active && (
                            <span className="mt-1.5 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              Current Status
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        {/* Products */}
        <div className="mt-4 min-w-0 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-800">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-700 sm:px-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Ordered Products
            </h2>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {(order.items || []).map(
              (item, index) => {
                const itemPrice =
                  Number(
                    item.price || 0
                  );

                const quantity =
                  Number(
                    item.quantity ||
                      0
                  );

                const itemTotal =
                  itemPrice *
                  quantity;

                return (
                  <div
                    key={`${item.productId || item.name}-${index}`}
                    className="flex min-w-0 gap-3 px-4 py-3 sm:px-5"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700">
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
                          const image =
                            event.currentTarget;

                          if (
                            image
                              .dataset
                              .fallback ===
                            "true"
                          ) {
                            return;
                          }

                          image.dataset.fallback =
                            "true";

                          image.src =
                            "/placeholder.png";
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {item.name ||
                          "Product"}
                      </h3>

                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Quantity:{" "}
                        {
                          quantity
                        }
                      </p>

                      <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">
                        {formatPrice(
                          itemPrice
                        )}{" "}
                        each
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatPrice(
                          itemTotal
                        )}
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Customer + Payment */}
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
          {/* Delivery */}
          <div className="min-w-0 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Delivery Information
            </h2>

            <div className="mt-3 space-y-2.5">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Name
                </p>

                <p className="mt-0.5 break-words text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {customerName}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Email
                </p>

                <p className="mt-0.5 break-all text-sm text-gray-700 dark:text-gray-300">
                  {order.customer?.email ||
                    "N/A"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Phone
                </p>

                <p className="mt-0.5 break-words text-sm text-gray-700 dark:text-gray-300">
                  {order.customer?.phone ||
                    "N/A"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Address
                </p>

                <p className="mt-0.5 break-words text-sm leading-5 text-gray-700 dark:text-gray-300">
                  {order.customer?.address ||
                    "N/A"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    City
                  </p>

                  <p className="mt-0.5 break-words text-sm text-gray-700 dark:text-gray-300">
                    {order.customer?.city ||
                      "N/A"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    ZIP Code
                  </p>

                  <p className="mt-0.5 break-words text-sm text-gray-700 dark:text-gray-300">
                    {order.customer
                      ?.zipCode ||
                      "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="min-w-0 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Payment Information
            </h2>

            <div className="mt-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Payment Method
              </p>

              <p className="mt-0.5 break-words text-sm font-semibold text-gray-800 dark:text-gray-200">
                {order.paymentMethod ||
                  "N/A"}
              </p>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3.5 dark:bg-slate-900">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-300">
                  <span>
                    Subtotal
                  </span>

                  <span className="shrink-0 font-medium text-gray-900 dark:text-white">
                    {formatPrice(
                      subtotal
                    )}
                  </span>
                </div>

                {order.coupon &&
                  couponDiscount >
                    0 && (
                    <div className="flex justify-between gap-4 text-green-600 dark:text-green-400">
                      <span className="min-w-0">
                        Coupon{" "}
                        <span className="font-semibold">
                          {
                            order
                              .coupon
                              .code
                          }
                        </span>
                      </span>

                      <span className="shrink-0 font-medium">
                        -
                        {formatPrice(
                          couponDiscount
                        )}
                      </span>
                    </div>
                  )}

                <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-300">
                  <span>
                    Delivery Charges
                  </span>

                  <span className="shrink-0 font-medium text-gray-900 dark:text-white">
                    {formatPrice(
                      deliveryCharge
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-2.5 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-gray-900 dark:text-white">
                      Total
                    </span>

                    <span className="shrink-0 text-lg font-bold text-orange-600">
                      {formatPrice(
                        totalPrice
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="mt-4 flex min-w-0 flex-col gap-2.5 sm:flex-row sm:justify-end">
          <Link
            to="/Product_page"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            Continue Shopping
          </Link>

          <Link
            to="/orders"
            className="rounded-lg bg-orange-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            My Orders
          </Link>
        </div>
      </div>
    </section>
  );
};

export default OrderDetails;