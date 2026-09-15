import React from "react";
import { Link } from "react-router-dom";

const OrderSuccess = () => {
  // ==========================================
  // GET LAST ORDER
  // ==========================================

  const savedOrder =
    sessionStorage.getItem("lastOrder");

  let order = null;

  try {
    order = savedOrder
      ? JSON.parse(savedOrder)
      : null;
  } catch (error) {
    console.error(
      "Failed to read saved order:",
      error
    );

    order = null;
  }

  // ==========================================
  // ORDER CURRENCY
  // ==========================================

  const currencySymbol =
    String(
      order?.currencySymbol || "$"
    ).trim() || "$";

  const currencyCode =
    String(
      order?.currencyCode || "USD"
    )
      .trim()
      .toUpperCase() || "USD";

  // ==========================================
  // FORMAT ORDER PRICE
  // ==========================================

  const formatOrderPrice = (amount) => {
    const numericAmount = Number(
      amount
    );

    const safeAmount =
      Number.isFinite(numericAmount)
        ? numericAmount
        : 0;

    return `${currencySymbol}${safeAmount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // ==========================================
  // ORDER VALUES
  // ==========================================

  const subtotal = Number(
    order?.subtotal || 0
  );

  const deliveryCharge = Number(
    order?.deliveryCharge || 0
  );

  const totalPrice = Number(
    order?.totalPrice ??
      subtotal + deliveryCharge
  );

  const totalProducts = Number(
    order?.totalItems ??
      order?.items?.reduce(
        (total, item) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
      ) ??
      0
  );

  // ==========================================
  // CUSTOMER INFORMATION
  // ==========================================

  const customerName =
    `${order?.customer?.firstName || ""} ${
      order?.customer?.lastName || ""
    }`.trim() || "Customer";

  const customerEmail =
    order?.customer?.email || "N/A";

  const customerPhone =
    order?.customer?.phone || "N/A";

  return (
    <section className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gray-50 px-4 py-8 dark:bg-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-2xl min-w-0 items-center justify-center">
        <div className="w-full min-w-0 rounded-2xl bg-white p-5 shadow-lg dark:bg-slate-800 sm:p-7">
          {/* ==========================================
              SUCCESS HEADER
          ========================================== */}

          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 sm:h-[72px] sm:w-[72px]">
              <span className="text-3xl font-bold text-green-600 sm:text-4xl">
                ✓
              </span>
            </div>

            <h1 className="mt-4 break-words text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Order Placed Successfully!
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600 dark:text-gray-300">
              Thank you for shopping with us.
              Your order has been received and
              is now being processed.
            </p>
          </div>

          {/* ==========================================
              ORDER NUMBER
          ========================================== */}

          <div className="mt-5 min-w-0 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-center dark:border-slate-600 dark:bg-slate-700">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-300">
              Order Number
            </p>

            <p className="mt-1 break-all text-xl font-bold text-orange-600 sm:text-2xl">
              #{order?.orderId || "N/A"}
            </p>
          </div>

          {/* ==========================================
              CURRENCY
          ========================================== */}

          <div className="mt-3 text-center">
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-slate-700 dark:text-gray-300">
              Currency:{" "}
              {currencyCode}{" "}
              {currencySymbol}
            </span>
          </div>

          {/* ==========================================
              CUSTOMER INFORMATION
          ========================================== */}

          <div className="mt-4 min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
              Customer Information
            </h2>

            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Name
                </p>

                <p
                  className="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-200"
                  title={customerName}
                >
                  {customerName}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Email
                </p>

                <p
                  className="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-200"
                  title={customerEmail}
                >
                  {customerEmail}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Phone
                </p>

                <p
                  className="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-gray-200"
                  title={customerPhone}
                >
                  {customerPhone}
                </p>
              </div>
            </div>
          </div>

          {/* ==========================================
              ORDER SUMMARY
          ========================================== */}

          <div className="mt-4 min-w-0 rounded-xl border border-gray-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
              <h2 className="min-w-0 text-sm font-bold text-gray-900 dark:text-white">
                Order Summary
              </h2>

              <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                {totalProducts}{" "}
                {totalProducts === 1
                  ? "Product"
                  : "Products"}
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4 text-gray-600 dark:text-gray-300">
                <span>
                  Total Products
                </span>

                <span className="shrink-0 font-medium text-gray-900 dark:text-white">
                  {totalProducts}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-gray-600 dark:text-gray-300">
                <span>
                  Subtotal
                </span>

                <span className="shrink-0 font-medium text-gray-900 dark:text-white">
                  {formatOrderPrice(
                    subtotal
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-gray-600 dark:text-gray-300">
                <span>
                  Delivery Charges
                </span>

                <span className="shrink-0 font-medium text-gray-900 dark:text-white">
                  {formatOrderPrice(
                    deliveryCharge
                  )}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 dark:border-slate-700">
                <div className="flex min-w-0 items-center justify-between gap-4">
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    Total
                  </span>

                  <span className="shrink-0 text-xl font-bold text-orange-600">
                    {formatOrderPrice(
                      totalPrice
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              DELIVERY INFORMATION
          ========================================== */}

          <div className="mt-4 flex min-w-0 items-center gap-3 rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
              <span className="text-lg text-green-600">
                🚚
              </span>
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Estimated Delivery
              </h3>

              <p className="mt-0.5 break-words text-xs text-gray-600 dark:text-gray-300">
                Your order should arrive within
                3 - 5 business days.
              </p>
            </div>
          </div>

          {/* ==========================================
              BUTTONS
          ========================================== */}

          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
            <Link
              to="/Product_page"
              className="rounded-lg bg-orange-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition duration-200 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              Continue Shopping
            </Link>

            <Link
              to="/"
              className="rounded-lg border border-orange-600 px-5 py-2.5 text-center text-sm font-semibold text-orange-600 transition duration-200 hover:bg-orange-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderSuccess;