import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/axios";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getStatusClasses } from "../utils/orderStatus";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const NORMAL_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
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

  const [updatingStatusId, setUpdatingStatusId] =
    useState(null);

  // Bulk print selection
  const [selectedOrders, setSelectedOrders] =
    useState([]);

  const [isBulkPrinting, setIsBulkPrinting] =
    useState(false);

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
        const fetchedOrders =
          response.data.orders || [];

        setOrders(fetchedOrders);

        // Remove selections for orders that no longer exist.
        setSelectedOrders((currentSelected) =>
          currentSelected.filter((id) =>
            fetchedOrders.some(
              (order) =>
                String(order._id) === String(id)
            )
          )
        );
      } else {
        setError(
          response.data?.message ||
            "Failed to load orders."
        );
      }
    } catch (err) {
      console.error(
        "Failed to fetch orders:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleDateString(
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

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleTimeString(
      undefined,
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // ==========================================
  // CUSTOMER
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
  // COUPON
  // ==========================================

  const getCouponCode = (order) => {
    return (
      order?.coupon?.code ||
      order?.couponCode ||
      ""
    );
  };

  const getCouponDiscount = (order) => {
    return Number(
      order?.couponDiscount ||
        order?.coupon?.discount ||
        0
    );
  };

  // ==========================================
  // SHORT MONGO ID
  // ==========================================

  const getShortMongoId = (id) => {
    if (!id) {
      return "—";
    }

    const value = String(id);

    if (value.length <= 8) {
      return value;
    }

    return `...${value.slice(-8)}`;
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
  // ORDER CURRENCY
  // ==========================================

  /*
   * Orders store currencyCode/currencySymbol as a
   * snapshot at the time the order was created.
   *
   * This is important because changing the admin
   * currency later must not turn an old INR order
   * into USD when printing it.
   */
  const getOrderCurrencySymbol = (order) => {
    if (order?.currencySymbol) {
      return order.currencySymbol;
    }

    const code = String(
      order?.currencyCode || ""
    ).toUpperCase();

    const symbols = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹",
      PKR: "₨",
      AED: "د.إ",
      SAR: "﷼",
      BDT: "৳",
      CNY: "¥",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
    };

    return symbols[code] || "";
  };

  const getOrderCurrencyCode = (order) => {
    return String(
      order?.currencyCode || ""
    ).toUpperCase();
  };

  const formatOrderPrice = (
    order,
    amount
  ) => {
    const value = Number(amount || 0);

    /*
     * Prefer the order's stored currency snapshot.
     */
    if (
      order?.currencySymbol ||
      order?.currencyCode
    ) {
      const symbol =
        getOrderCurrencySymbol(order);

      return `${symbol}${value.toFixed(2)}`;
    }

    /*
     * Fallback for old orders which may not have
     * currency information stored.
     */
    try {
      return formatPrice(value);
    } catch {
      return value.toFixed(2);
    }
  };

  // ==========================================
  // ESCAPE HTML
  // ==========================================

  const escapeHtml = (value) => {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // ==========================================
  // BUILD PRINT SLIP HTML
  // ==========================================

  const buildSlipHtml = (order) => {
    const customer =
      order?.customer || {};

    const customerName =
      getCustomerName(order);

    const couponCode =
      getCouponCode(order);

    const couponDiscount =
      getCouponDiscount(order);

    const currencySymbol =
      getOrderCurrencySymbol(order);

    const currencyCode =
      getOrderCurrencyCode(order);

    const items = Array.isArray(order?.items)
      ? order.items
      : [];

    const formatSlipPrice = (amount) => {
      const value = Number(amount || 0);

      return `${currencySymbol}${value.toFixed(2)}`;
    };

    const createdDate = order?.createdAt
      ? new Date(
          order.createdAt
        ).toLocaleString()
      : "—";

    const itemsHtml = items
      .map((item) => {
        const name =
          item?.name || "Product";

        const quantity =
          Number(item?.quantity || 0);

        const price =
          Number(item?.price || 0);

        const lineTotal =
          price * quantity;

        return `
          <div class="item">
            <div class="item-name">
              ${escapeHtml(name)}
            </div>

            <div class="item-row">
              <span>
                ${quantity} × ${formatSlipPrice(
                  price
                )}
              </span>

              <span>
                ${formatSlipPrice(
                  lineTotal
                )}
              </span>
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="slip">

        <div class="center">
          <div class="store-name">
            SHOPEE
          </div>

          <div class="slip-title">
            Customer Order Slip
          </div>

          ${
            currencyCode
              ? `
                <div class="currency">
                  ${escapeHtml(currencyCode)}
                  ${
                    currencySymbol
                      ? ` · ${escapeHtml(
                          currencySymbol
                        )}`
                      : ""
                  }
                </div>
              `
              : ""
          }
        </div>

        <div class="divider"></div>

        <div class="order-meta">
          <div>
            <div class="meta-label">
              Order
            </div>

            <div class="meta-value">
              ${escapeHtml(
                order?.orderId ||
                  order?._id ||
                  "—"
              )}
            </div>
          </div>

          <div>
            <div class="meta-label">
              Status
            </div>

            <div class="meta-value">
              ${escapeHtml(
                order?.status ||
                  "Pending"
              )}
            </div>
          </div>

          <div>
            <div class="meta-label">
              Date
            </div>

            <div class="meta-value">
              ${escapeHtml(createdDate)}
            </div>
          </div>

          <div>
            <div class="meta-label">
              Payment
            </div>

            <div class="meta-value">
              ${escapeHtml(
                order?.paymentMethod ||
                  "—"
              )}
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section-title">
          Customer
        </div>

        <div class="customer">
          <strong>
            ${escapeHtml(customerName)}
          </strong>

          <br />

          ${escapeHtml(
            customer.phone || "—"
          )}

          <br />

          ${escapeHtml(
            customer.email || "—"
          )}

          <br />

          ${escapeHtml(
            customer.address || "—"
          )}

          <br />

          ${escapeHtml(
            customer.city || "—"
          )}

          ${
            customer.zipCode
              ? ` - ${escapeHtml(
                  customer.zipCode
                )}`
              : ""
          }
        </div>

        <div class="divider"></div>

        <div class="section-title">
          Items
        </div>

        ${
          itemsHtml ||
          `
            <div class="muted">
              No items
            </div>
          `
        }

        <div class="divider"></div>

        <div class="totals">

          <div class="total-row">
            <span>Items</span>

            <span>
              ${Number(
                order?.totalItems || 0
              )}
            </span>
          </div>

          <div class="total-row">
            <span>Subtotal</span>

            <span>
              ${formatSlipPrice(
                order?.subtotal
              )}
            </span>
          </div>

          ${
            couponCode
              ? `
                <div class="total-row coupon">
                  <span>
                    Coupon (${escapeHtml(
                      couponCode
                    )})
                  </span>

                  <span>
                    -${formatSlipPrice(
                      couponDiscount
                    )}
                  </span>
                </div>
              `
              : ""
          }

          <div class="total-row">
            <span>Delivery</span>

            <span>
              ${formatSlipPrice(
                order?.deliveryCharge
              )}
            </span>
          </div>

          <div class="divider"></div>

          <div class="total-row grand-total">
            <span>TOTAL</span>

            <span>
              ${formatSlipPrice(
                order?.totalPrice
              )}
            </span>
          </div>

        </div>

        <div class="divider"></div>

        <div class="footer">
          Thank you for shopping with Shopee.
          <br />
          Please keep this slip with the order.
        </div>

      </div>
    `;
  };

  // ==========================================
  // PRINT SINGLE ORDER
  // ==========================================

  const printOrderSlip = (order) => {
    if (!order) {
      return;
    }

    const popup = window.open(
      "",
      "_blank",
      "width=520,height=780,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      setError(
        "Please allow pop-ups in your browser to print the order slip."
      );

      return;
    }

    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />

          <title>
            Order Slip - ${escapeHtml(
              order?.orderId ||
                order?._id ||
                ""
            )}
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            @page {
              size: 80mm auto;
              margin: 4mm;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #111111;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
              font-size: 11px;
            }

            body {
              width: 72mm;
              margin: 0 auto;
            }

            .slip {
              width: 100%;
              padding: 1px 0;
            }

            .center {
              text-align: center;
            }

            .store-name {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 0.5px;
            }

            .slip-title {
              margin-top: 2px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
            }

            .currency {
              margin-top: 2px;
              font-size: 9px;
              font-weight: 600;
              color: #444444;
            }

            .muted {
              color: #555555;
            }

            .divider {
              border-top: 1px dashed #555555;
              margin: 6px 0;
            }

            .order-meta {
              display: grid;
              grid-template-columns:
                1fr 1fr;
              gap: 4px 8px;
              font-size: 10px;
            }

            .meta-label {
              color: #555555;
              font-size: 9px;
            }

            .meta-value {
              margin-top: 1px;
              font-weight: 700;
              word-break: break-word;
            }

            .section-title {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              margin-bottom: 4px;
            }

            .customer {
              line-height: 1.4;
              font-size: 10px;
              word-break: break-word;
            }

            .item {
              padding: 4px 0;
              border-bottom:
                1px dotted #999999;
            }

            .item:last-child {
              border-bottom: none;
            }

            .item-name {
              font-size: 10px;
              font-weight: 700;
              line-height: 1.3;
              word-break: break-word;
            }

            .item-row {
              display: flex;
              justify-content:
                space-between;
              gap: 8px;
              margin-top: 2px;
              font-size: 10px;
            }

            .totals {
              margin-top: 4px;
              font-size: 10px;
            }

            .total-row {
              display: flex;
              justify-content:
                space-between;
              gap: 8px;
              padding: 2px 0;
            }

            .grand-total {
              font-size: 14px;
              font-weight: 800;
              padding-top: 4px;
            }

            .coupon {
              font-weight: 700;
            }

            .footer {
              margin-top: 8px;
              text-align: center;
              font-size: 9px;
              line-height: 1.4;
              color: #555555;
            }

            @media print {
              html,
              body {
                width: 72mm;
              }

              .slip {
                page-break-inside:
                  avoid;
              }
            }
          </style>
        </head>

        <body>
          ${buildSlipHtml(order)}

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 350);
            };
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  };

  // ==========================================
  // BULK PRINT
  // ==========================================

  const printSelectedOrderSlips = () => {
    const selected = orders.filter(
      (order) =>
        selectedOrders.includes(
          String(order._id)
        )
    );

    if (!selected.length) {
      setError(
        "Select at least one order to print."
      );

      return;
    }

    const popup = window.open(
      "",
      "_blank",
      "width=900,height=900,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      setError(
        "Please allow pop-ups in your browser to print order slips."
      );

      return;
    }

    setIsBulkPrinting(true);

    const slipsHtml = selected
      .map(
        (order) => `
          <div class="slip-page">
            ${buildSlipHtml(order)}
          </div>
        `
      )
      .join("");

    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />

          <title>
            Shopee Order Slips
          </title>

          <style>
            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #111111;
              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            body {
              padding: 8mm;
            }

            .print-container {
              display: grid;
              grid-template-columns:
                repeat(
                  auto-fit,
                  minmax(
                    72mm,
                    1fr
                  )
                );
              gap: 8mm;
              align-items: start;
            }

            .slip-page {
              width: 72mm;
              max-width: 72mm;
              page-break-inside:
                avoid;
              break-inside: avoid;
              overflow: hidden;
            }

            .slip {
              width: 72mm;
              padding: 2mm;
              border: 1px solid #cccccc;
            }

            .center {
              text-align: center;
            }

            .store-name {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 0.5px;
            }

            .slip-title {
              margin-top: 2px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
            }

            .currency {
              margin-top: 2px;
              font-size: 9px;
              font-weight: 600;
              color: #444444;
            }

            .muted {
              color: #555555;
            }

            .divider {
              border-top:
                1px dashed #555555;
              margin: 6px 0;
            }

            .order-meta {
              display: grid;
              grid-template-columns:
                1fr 1fr;
              gap: 4px 8px;
              font-size: 10px;
            }

            .meta-label {
              color: #555555;
              font-size: 9px;
            }

            .meta-value {
              margin-top: 1px;
              font-weight: 700;
              word-break: break-word;
            }

            .section-title {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              margin-bottom: 4px;
            }

            .customer {
              line-height: 1.4;
              font-size: 10px;
              word-break: break-word;
            }

            .item {
              padding: 4px 0;
              border-bottom:
                1px dotted #999999;
            }

            .item:last-child {
              border-bottom: none;
            }

            .item-name {
              font-size: 10px;
              font-weight: 700;
              line-height: 1.3;
              word-break: break-word;
            }

            .item-row {
              display: flex;
              justify-content:
                space-between;
              gap: 8px;
              margin-top: 2px;
              font-size: 10px;
            }

            .totals {
              margin-top: 4px;
              font-size: 10px;
            }

            .total-row {
              display: flex;
              justify-content:
                space-between;
              gap: 8px;
              padding: 2px 0;
            }

            .grand-total {
              font-size: 14px;
              font-weight: 800;
              padding-top: 4px;
            }

            .coupon {
              font-weight: 700;
            }

            .footer {
              margin-top: 8px;
              text-align: center;
              font-size: 9px;
              line-height: 1.4;
              color: #555555;
            }

            @media print {
              body {
                padding: 0;
              }

              .print-container {
                display: grid;
                grid-template-columns:
                  repeat(
                    2,
                    72mm
                  );
                gap: 5mm;
              }

              .slip-page {
                page-break-inside:
                  avoid;
                break-inside: avoid;
              }
            }
          </style>
        </head>

        <body>
          <div class="print-container">
            ${slipsHtml}
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    popup.document.close();

    setSelectedOrders([]);
    setTimeout(() => {
      setIsBulkPrinting(false);
    }, 800);
  };

  // ==========================================
  // STATUS UPDATE
  // ==========================================

  const handleStatusChange = async (
    order,
    newStatus
  ) => {
    const currentStatus =
      order?.status || "Pending";

    if (currentStatus === newStatus) {
      return;
    }

    if (newStatus === "Cancelled") {
      const confirmed =
        window.confirm(
          `Are you sure you want to cancel order ${
            order?.orderId ||
            order?._id ||
            ""
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

      await fetchOrders(true);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ==========================================
  // STATUS SELECT
  // ==========================================

  const getStatusSelectClasses = (
    status
  ) => {
    const base =
      "h-8 w-full min-w-0 rounded-md border px-2 text-[11px] font-semibold outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

    switch (status) {
      case "Pending":
        return `${base} border-yellow-300 bg-yellow-50 text-yellow-800 focus:border-yellow-400 focus:ring-yellow-200 dark:border-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-200 dark:focus:ring-yellow-900`;

      case "Processing":
        return `${base} border-blue-300 bg-blue-50 text-blue-800 focus:border-blue-400 focus:ring-blue-200 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-200 dark:focus:ring-blue-900`;

      case "Shipped":
        return `${base} border-purple-300 bg-purple-50 text-purple-800 focus:border-purple-400 focus:ring-purple-200 dark:border-purple-700 dark:bg-purple-950/50 dark:text-purple-200 dark:focus:ring-purple-900`;

      case "Delivered":
        return `${base} border-green-300 bg-green-50 text-green-800 focus:border-green-400 focus:ring-green-200 dark:border-green-700 dark:bg-green-950/50 dark:text-green-200 dark:focus:ring-green-900`;

      case "Cancelled":
        return `${base} border-red-300 bg-red-50 text-red-800 focus:border-red-400 focus:ring-red-200 dark:border-red-700 dark:bg-red-950/50 dark:text-red-200 dark:focus:ring-red-900`;

      default:
        return `${base} border-gray-300 bg-white text-gray-800 focus:border-orange-500 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200 dark:focus:ring-orange-900`;
    }
  };

  const canChangeStatus = (status) => {
    return (
      status !== "Delivered" &&
      status !== "Cancelled"
    );
  };

  const renderStatusSelect = (order) => {
    const status =
      order?.status || "Pending";

    const isUpdating =
      updatingStatusId === order?._id;

    if (!canChangeStatus(status)) {
      return (
        <span
          className={`inline-flex min-h-7 items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
            status
          )}`}
        >
          {status}
        </span>
      );
    }

    return (
      <select
        value={status}
        disabled={isUpdating}
        onChange={(event) =>
          handleStatusChange(
            order,
            event.target.value
          )
        }
        className={getStatusSelectClasses(
          status
        )}
        title="Change order status"
      >
        {ORDER_STATUSES.map(
          (option) => {
            const currentIndex =
              NORMAL_STATUSES.indexOf(
                status
              );

            const optionIndex =
              NORMAL_STATUSES.indexOf(
                option
              );

            const isCancelled =
              option === "Cancelled";

            const isBackward =
              currentIndex !== -1 &&
              optionIndex !== -1 &&
              optionIndex < currentIndex;

            const isInvalidCancellation =
              isCancelled &&
              status !== "Pending" &&
              status !== "Processing";

            const isDisabled =
              option !== status &&
              (isBackward ||
                isInvalidCancellation);

            return (
              <option
                key={option}
                value={option}
                disabled={isDisabled}
              >
                {option}
              </option>
            );
          }
        )}
      </select>
    );
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

      const couponCode =
        getCouponCode(order).toLowerCase();

      const orderStatus =
        order?.status || "Pending";

      const matchesSearch =
        !search ||
        customerName.includes(search) ||
        customerEmail.includes(search) ||
        orderId.includes(search) ||
        mongoId.includes(search) ||
        couponCode.includes(search);

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
  // BULK SELECTION
  // ==========================================

  const filteredOrderIds = useMemo(
    () =>
      filteredOrders.map((order) =>
        String(order._id)
      ),
    [filteredOrders]
  );

  const allFilteredSelected =
    filteredOrderIds.length > 0 &&
    filteredOrderIds.every((id) =>
      selectedOrders.includes(id)
    );

  const toggleOrderSelection = (orderId) => {
    const id = String(orderId);

    setSelectedOrders((current) => {
      if (current.includes(id)) {
        return current.filter(
          (selectedId) =>
            selectedId !== id
        );
      }

      return [...current, id];
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedOrders((current) =>
        current.filter(
          (id) =>
            !filteredOrderIds.includes(id)
        )
      );

      return;
    }

    setSelectedOrders((current) => {
      const merged = new Set([
        ...current,
        ...filteredOrderIds,
      ]);

      return Array.from(merged);
    });
  };

  const clearSelectedOrders = () => {
    setSelectedOrders([]);
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
        className={`flex min-w-[115px] flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition ${
          isActive
            ? "border-orange-400 bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-300 dark:ring-orange-900"
            : "border-gray-200 bg-white hover:border-orange-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-500"
        }`}
      >
        <span className="text-base">
          {icon}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {label}
          </span>

          <span className="block text-base font-bold text-gray-900 dark:text-white">
            {value}
          </span>
        </span>
      </button>
    );
  };

  // ==========================================
  // ACTIONS
  // ==========================================

  const renderActions = (order) => {
    return (
      <div className="flex items-center justify-center gap-1">
        <Link
          to={`/admin/orders/${order._id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-sm text-gray-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-600 dark:text-gray-200 dark:hover:border-orange-500 dark:hover:bg-orange-950/30 dark:hover:text-orange-400"
          title="View order"
          aria-label="View order"
        >
          👁️
        </Link>

        <button
          type="button"
          onClick={() =>
            printOrderSlip(order)
          }
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-sm text-gray-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-600 dark:text-gray-200 dark:hover:border-orange-500 dark:hover:bg-orange-950/30 dark:hover:text-orange-400"
          title="Print order slip"
          aria-label="Print order slip"
        >
          🖨️
        </button>
      </div>
    );
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
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
    <div className="min-w-0 space-y-3">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Orders
          </h1>

          <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
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
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-orange-500 px-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
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

      {/* ERROR */}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="flex gap-2 overflow-x-auto pb-1">
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

      {/* SEARCH / FILTER */}
      <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
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
            placeholder="Search order ID, customer, email or coupon..."
            className="h-9 w-full rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:ring-orange-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="order-status-filter"
            className="whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            Status
          </label>

          <select
            id="order-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="h-9 rounded-md border border-gray-300 bg-white px-2.5 text-sm text-gray-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200 dark:focus:ring-orange-900"
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

      {/* RESULT + BULK ACTIONS */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {filteredOrders.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {orders.length}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {selectedOrders.length > 0 && (
            <>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {selectedOrders.length} selected
              </span>

              <button
                type="button"
                onClick={
                  printSelectedOrderSlips
                }
                disabled={isBulkPrinting}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-orange-500 px-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                🖨️{" "}
                {isBulkPrinting
                  ? "Preparing..."
                  : "Print Selected"}
              </button>

              <button
                type="button"
                onClick={
                  clearSelectedOrders
                }
                className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:border-orange-400 hover:text-orange-600 dark:border-slate-600 dark:text-gray-200 dark:hover:border-orange-500 dark:hover:text-orange-400"
              >
                Clear
              </button>
            </>
          )}

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
      </div>

      {/* EMPTY */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-5 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="text-5xl">
            📦
          </div>

          <h2 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
            No orders found
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try changing your search or
            status filter.
          </p>
        </div>
      ) : (
        <>
          {/* ========================================
              DESKTOP TABLE
              ======================================== */}

          <div className="hidden min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 md:block">
            <div className="max-h-[calc(100vh-275px)] overflow-y-auto overflow-x-hidden">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  {/* Checkbox */}
                  <col className="w-[3.5%]" />

                  {/* Order */}
                  <col className="w-[8.5%]" />

                  {/* Mongo */}
                  <col className="w-[9%]" />

                  {/* Customer */}
                  <col className="w-[14%]" />

                  {/* Items */}
                  <col className="w-[5.5%]" />

                  {/* Subtotal */}
                  <col className="w-[9%]" />

                  {/* Delivery */}
                  <col className="w-[8.5%]" />

                  {/* Total */}
                  <col className="w-[9%]" />

                  {/* Coupon moved before status */}
                  <col className="w-[9%]" />

                  {/* Status moved right */}
                  <col className="w-[11%]" />

                  {/* Date */}
                  <col className="w-[8%]" />

                  {/* Action */}
                  <col className="w-[5%]" />
                </colgroup>

                <thead className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-900">
                  <tr>
                    {/* SELECT */}
                    <th className="px-1 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          allFilteredSelected
                        }
                        onChange={
                          toggleSelectAllFiltered
                        }
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-orange-500 dark:border-slate-600"
                        title="Select all visible orders"
                        aria-label="Select all visible orders"
                      />
                    </th>

                    {/* ORDER */}
                    <th className="px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Order ID
                    </th>

                    {/* MONGO */}
                    <th className="px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Mongo ID
                    </th>

                    {/* CUSTOMER */}
                    <th className="px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Customer
                    </th>

                    {/* ITEMS */}
                    <th className="px-1 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Items
                    </th>

                    {/* SUBTOTAL */}
                    <th className="px-1.5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Subtotal
                    </th>

                    {/* DELIVERY */}
                    <th className="px-1.5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Delivery
                    </th>

                    {/* TOTAL */}
                    <th className="px-1.5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Total
                    </th>

                    {/* COUPON */}
                    <th className="px-1.5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Coupon
                    </th>

                    {/* STATUS */}
                    <th className="px-1.5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Status
                    </th>

                    {/* DATE */}
                    <th className="px-1.5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Date
                    </th>

                    {/* ACTION */}
                    <th className="px-1 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredOrders.map(
                    (order) => {
                      const couponCode =
                        getCouponCode(order);

                      const couponDiscount =
                        getCouponDiscount(
                          order
                        );

                      const isSelected =
                        selectedOrders.includes(
                          String(order._id)
                        );

                      return (
                        <tr
                          key={order._id}
                          className={`transition hover:bg-gray-50 dark:hover:bg-slate-900/40 ${
                            isSelected
                              ? "bg-orange-50/60 dark:bg-orange-950/10"
                              : ""
                          }`}
                        >
                          {/* SELECT */}
                          <td className="px-1 py-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={
                                isSelected
                              }
                              onChange={() =>
                                toggleOrderSelection(
                                  order._id
                                )
                              }
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-orange-500 dark:border-slate-600"
                              aria-label={`Select order ${
                                order.orderId ||
                                order._id
                              }`}
                            />
                          </td>

                          {/* ORDER ID */}
                          <td className="px-2 py-3 align-middle">
                            <button
                              type="button"
                              onClick={() =>
                                openIdPopup(
                                  order.orderId,
                                  "Order ID"
                                )
                              }
                              className="block max-w-full truncate text-[12px] font-bold text-orange-500 hover:text-orange-600 hover:underline"
                              title={
                                order.orderId ||
                                "Order ID"
                              }
                            >
                              {order.orderId ||
                                "—"}
                            </button>
                          </td>

                          {/* MONGO ID */}
                          <td className="px-2 py-3 align-middle">
                            <button
                              type="button"
                              onClick={() =>
                                openIdPopup(
                                  order._id,
                                  "Mongo ID"
                                )
                              }
                              className="block max-w-full truncate font-mono text-[11px] text-gray-600 hover:text-orange-500 dark:text-gray-300 dark:hover:text-orange-400"
                              title="Click to view full MongoDB ID"
                            >
                              {getShortMongoId(
                                order._id
                              )}
                            </button>
                          </td>

                          {/* CUSTOMER */}
                          <td className="px-2 py-3 align-middle">
                            <div className="min-w-0">
                              <p
                                className="truncate text-[12px] font-semibold text-gray-900 dark:text-white"
                                title={getCustomerName(
                                  order
                                )}
                              >
                                {getCustomerName(
                                  order
                                )}
                              </p>

                              <p
                                className="mt-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400"
                                title={
                                  order?.customer
                                    ?.email || ""
                                }
                              >
                                {order?.customer
                                  ?.email || "—"}
                              </p>
                            </div>
                          </td>

                          {/* ITEMS */}
                          <td className="px-1 py-3 text-center align-middle">
                            <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-200">
                              {Number(
                                order?.totalItems ||
                                  0
                              )}
                            </span>
                          </td>

                          {/* SUBTOTAL */}
                          <td className="px-1.5 py-3 text-right align-middle">
                            <span className="block truncate whitespace-nowrap text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                              {formatOrderPrice(
                                order,
                                order?.subtotal
                              )}
                            </span>
                          </td>

                          {/* DELIVERY */}
                          <td className="px-1.5 py-3 text-right align-middle">
                            <span className="block truncate whitespace-nowrap text-[11px] font-semibold text-gray-800 dark:text-gray-200">
                              {formatOrderPrice(
                                order,
                                order?.deliveryCharge
                              )}
                            </span>
                          </td>

                          {/* TOTAL */}
                          <td className="px-1.5 py-3 text-right align-middle">
                            <span className="block truncate whitespace-nowrap text-[12px] font-bold text-gray-900 dark:text-white">
                              {formatOrderPrice(
                                order,
                                order?.totalPrice
                              )}
                            </span>
                          </td>

                          {/* COUPON */}
                          <td className="px-1.5 py-3 align-middle">
                            {couponCode ? (
                              <div className="min-w-0">
                                <span
                                  className="block max-w-full truncate rounded-md border border-orange-200 bg-orange-50 px-1.5 py-1 text-[10px] font-bold text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
                                  title={`Coupon: ${couponCode}`}
                                >
                                  🎟️{" "}
                                  {couponCode}
                                </span>

                                {couponDiscount >
                                  0 && (
                                  <p className="mt-1 truncate text-[10px] font-semibold text-green-600 dark:text-green-400">
                                    -
                                    {formatOrderPrice(
                                      order,
                                      couponDiscount
                                    )}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                —
                              </span>
                            )}
                          </td>

                          {/* STATUS */}
                          <td className="px-1.5 py-3 align-middle">
                            {renderStatusSelect(
                              order
                            )}
                          </td>

                          {/* DATE */}
                          <td className="px-1.5 py-3 align-middle">
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                                {formatDate(
                                  order.createdAt
                                )}
                              </p>

                              <p className="mt-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400">
                                {formatTime(
                                  order.createdAt
                                )}
                              </p>
                            </div>
                          </td>

                          {/* ACTION */}
                          <td className="px-1 py-3 align-middle">
                            {renderActions(
                              order
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================
              MOBILE CARDS
              ======================================== */}

          <div className="space-y-2 md:hidden">
            {filteredOrders.map(
              (order) => {
                const couponCode =
                  getCouponCode(order);

                const couponDiscount =
                  getCouponDiscount(
                    order
                  );

                const status =
                  order?.status ||
                  "Pending";

                const isSelected =
                  selectedOrders.includes(
                    String(order._id)
                  );

                return (
                  <div
                    key={order._id}
                    className={`overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-slate-800 ${
                      isSelected
                        ? "border-orange-400 dark:border-orange-500"
                        : "border-gray-200 dark:border-slate-700"
                    }`}
                  >
                    {/* CARD HEADER */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 dark:border-slate-700">
                      <div className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={
                            isSelected
                          }
                          onChange={() =>
                            toggleOrderSelection(
                              order._id
                            )
                          }
                          className="h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-orange-500 dark:border-slate-600"
                          aria-label={`Select order ${
                            order.orderId ||
                            order._id
                          }`}
                        />

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              openIdPopup(
                                order.orderId,
                                "Order ID"
                              )
                            }
                            className="block max-w-[180px] truncate text-sm font-bold text-orange-500"
                          >
                            {order.orderId ||
                              "—"}
                          </button>

                          <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                            {formatDate(
                              order.createdAt
                            )}{" "}
                            ·{" "}
                            {formatTime(
                              order.createdAt
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="w-[120px] shrink-0">
                        {renderStatusSelect(
                          order
                        )}
                      </div>
                    </div>

                    {/* CUSTOMER */}
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {getCustomerName(
                          order
                        )}
                      </p>

                      <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {order?.customer
                          ?.email || "—"}
                      </p>

                      <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {order?.customer
                          ?.phone || "—"}
                      </p>
                    </div>

                    {/* SUMMARY */}
                    <div className="grid grid-cols-4 border-y border-gray-100 dark:border-slate-700">
                      <div className="px-1.5 py-2.5 text-center">
                        <p className="text-[9px] font-medium uppercase text-gray-400">
                          Items
                        </p>

                        <p className="mt-0.5 text-xs font-bold text-gray-900 dark:text-white">
                          {Number(
                            order?.totalItems ||
                              0
                          )}
                        </p>
                      </div>

                      <div className="border-l border-gray-100 px-1.5 py-2.5 text-center dark:border-slate-700">
                        <p className="text-[9px] font-medium uppercase text-gray-400">
                          Subtotal
                        </p>

                        <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-white">
                          {formatOrderPrice(
                            order,
                            order?.subtotal
                          )}
                        </p>
                      </div>

                      <div className="border-l border-gray-100 px-1.5 py-2.5 text-center dark:border-slate-700">
                        <p className="text-[9px] font-medium uppercase text-gray-400">
                          Delivery
                        </p>

                        <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-900 dark:text-white">
                          {formatOrderPrice(
                            order,
                            order?.deliveryCharge
                          )}
                        </p>
                      </div>

                      <div className="border-l border-gray-100 px-1.5 py-2.5 text-center dark:border-slate-700">
                        <p className="text-[9px] font-medium uppercase text-gray-400">
                          Total
                        </p>

                        <p className="mt-0.5 truncate text-xs font-bold text-orange-600 dark:text-orange-400">
                          {formatOrderPrice(
                            order,
                            order?.totalPrice
                          )}
                        </p>
                      </div>
                    </div>

                    {/* COUPON */}
                    {couponCode && (
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                        <div className="min-w-0">
                          <span className="inline-flex max-w-full items-center rounded-md border border-orange-200 bg-orange-50 px-1.5 py-1 text-[10px] font-bold text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300">
                            🎟️

                            <span className="ml-1 truncate">
                              {couponCode}
                            </span>
                          </span>
                        </div>

                        {couponDiscount >
                          0 && (
                          <span className="whitespace-nowrap text-[10px] font-semibold text-green-600 dark:text-green-400">
                            -
                            {formatOrderPrice(
                              order,
                              couponDiscount
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    {/* FOOTER */}
                    <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2.5 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() =>
                          openIdPopup(
                            order._id,
                            "Mongo ID"
                          )
                        }
                        className="max-w-[140px] truncate font-mono text-[9px] text-gray-400 hover:text-orange-500"
                      >
                        ID{" "}
                        {getShortMongoId(
                          order._id
                        )}
                      </button>

                      {renderActions(
                        order
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </>
      )}

      {/* ========================================
          FULL ID POPUP
          ======================================== */}

      {selectedId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeIdPopup}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-800"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
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

            <div className="mt-4 rounded-lg bg-gray-100 p-3 dark:bg-slate-900">
              <p className="break-all font-mono text-xs text-gray-800 dark:text-gray-200">
                {selectedId}
              </p>
            </div>

            <button
              type="button"
              onClick={closeIdPopup}
              className="mt-4 w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-orange-600"
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