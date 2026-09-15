
import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import {
  useCart,
  getProductPrice,
} from "../context/CartContext";
import API from "../api/api";

const Cart = () => {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    totalItems,
    totalPrice,
    clearCart,
    buyNowItem,
    clearBuyNow,
    formatPrice,
    currencyLoading,
  } = useCart();

  const navigate = useNavigate();

  const [deliveryCharge, setDeliveryCharge] =
    useState(0);

  const [settingsLoading, setSettingsLoading] =
    useState(true);

  // Load delivery charge from MongoDB settings.
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setSettingsLoading(true);

        const response = await API.get(
          "/settings"
        );

        const charge = Number(
          response.data?.settings?.deliveryCharge
        );

        setDeliveryCharge(
          Number.isFinite(charge) && charge >= 0
            ? charge
            : 0
        );
      } catch (error) {
        console.error(
          "Failed to load delivery charge:",
          error
        );

        setDeliveryCharge(0);
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Check whether a cart item cannot currently be purchased.
  const isItemUnavailable = (item) => {
    const stock = Number(item.stock);

    return (
      item.inventoryUnavailable === true ||
      !Number.isFinite(stock) ||
      stock <= 0 ||
      Number(item.quantity || 0) > stock
    );
  };

  // Check whether the cart contains an inventory problem.
  const hasCartInventoryProblem =
    cartItems.some((item) =>
      isItemUnavailable(item)
    );

  // Check whether Buy Now item has an inventory problem.
  const buyNowUnavailable = buyNowItem
    ? isItemUnavailable(buyNowItem)
    : false;

  // Cart total including delivery.
  const cartGrandTotal =
    totalPrice + deliveryCharge;

  // Continue to checkout with the normal cart.
  const handleCheckout = () => {
    if (
      cartItems.length === 0 ||
      hasCartInventoryProblem ||
      settingsLoading ||
      currencyLoading
    ) {
      return;
    }

    navigate("/checkout");
  };

  // Checkout a Buy Now item.
  const handleBuyNowCheckout = () => {
    if (
      !buyNowItem ||
      buyNowUnavailable
    ) {
      return;
    }

    navigate("/checkout");
  };

  // Render inventory status.
  const renderInventoryStatus = (item) => {
    const stock = Number(item.stock);
    const quantity = Number(
      item.quantity || 1
    );

    if (
      item.inventoryUnavailable ||
      !Number.isFinite(stock) ||
      stock <= 0
    ) {
      return (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
          This product is currently unavailable.
        </div>
      );
    }

    if (quantity > stock) {
      return (
        <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Only {stock}{" "}
          {stock === 1
            ? "item"
            : "items"}{" "}
          available. Please reduce the
          quantity.
        </div>
      );
    }

    if (stock <= 5) {
      return (
        <p className="mt-2 text-xs font-semibold text-orange-600 dark:text-orange-400">
          Only {stock}{" "}
          {stock === 1
            ? "item"
            : "items"}{" "}
          left
        </p>
      );
    }

    return null;
  };

  // Render a single product item.
  const renderCartItem = (
    item,
    isBuyNow = false
  ) => {
    const sellingPrice =
      getProductPrice(item);

    const originalPrice = Number(
      item.originalPrice ??
        item.price ??
        sellingPrice
    );

    const isSale =
      item.isOnSale &&
      Number.isFinite(
        Number(item.discountedPrice)
      ) &&
      Number(item.discountedPrice) <
        originalPrice;

    const quantity = Number(
      item.quantity || 1
    );

    const stock = Number(item.stock);

    const itemTotal =
      sellingPrice * quantity;

    const unavailable =
      isItemUnavailable(item);

    const cannotIncrease =
      !Number.isFinite(stock) ||
      stock <= 0 ||
      quantity >= stock;

    return (
      <div
        key={item._id}
        className={`flex min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5 ${
          unavailable
            ? "border-red-300 dark:border-red-900"
            : "border-gray-200 dark:border-slate-700"
        }`}
      >
        <div className="flex min-w-0 gap-3 sm:gap-4">
          {/* Product image */}
          <Link
            to={`/product/${item._id}`}
            className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-700 sm:h-28 sm:w-28"
          >
            <img
              src={item.image}
              alt={item.name}
              className={`h-full w-full object-cover ${
                unavailable
                  ? "opacity-50"
                  : ""
              }`}
            />
          </Link>

          {/* Product details */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <Link
                  to={`/product/${item._id}`}
                  className="line-clamp-2 break-words text-base font-semibold text-gray-900 transition hover:text-orange-600 dark:text-white dark:hover:text-orange-400 sm:text-lg"
                >
                  {item.name}
                </Link>

                {item.category && (
                  <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                    {item.category}
                  </p>
                )}
              </div>

              {!isBuyNow && (
                <button
                  type="button"
                  onClick={() =>
                    removeFromCart(
                      item._id
                    )
                  }
                  className="shrink-0 text-xs font-medium text-red-500 transition hover:text-red-700 sm:text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Prices */}
            <div className="mt-3 flex min-w-0 max-w-full flex-wrap items-center gap-2 overflow-hidden">
              <span
                className={`max-w-full break-all text-lg font-bold ${
                  unavailable
                    ? "text-gray-500 dark:text-gray-400"
                    : "text-orange-600"
                }`}
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
                  <>
                    <span className="max-w-full break-all text-xs text-gray-400 line-through dark:text-gray-500 sm:text-sm">
                      {currencyLoading
                        ? "..."
                        : formatPrice(
                            originalPrice
                          )}
                    </span>

                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      Sale
                    </span>
                  </>
                )}
            </div>

            {/* Inventory status */}
            {renderInventoryStatus(item)}
          </div>
        </div>

        {/* Quantity + total */}
        <div className="flex min-w-0 items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-slate-700">
          {!isBuyNow ? (
            <div className="min-w-0">
              <div
                className={`flex w-fit items-center rounded-lg border ${
                  unavailable
                    ? "border-red-300 dark:border-red-900"
                    : "border-gray-300 dark:border-slate-600"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    decreaseQuantity(
                      item._id
                    )
                  }
                  disabled={
                    quantity <= 1
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center text-lg transition ${
                    quantity <= 1
                      ? "cursor-not-allowed text-gray-300 dark:text-slate-600"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                  }`}
                >
                  −
                </button>

                <span className="flex h-9 min-w-9 items-center justify-center border-x border-gray-300 px-2 text-sm font-semibold text-gray-900 dark:border-slate-600 dark:text-white">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    increaseQuantity(
                      item._id
                    )
                  }
                  disabled={
                    cannotIncrease
                  }
                  title={
                    cannotIncrease &&
                    stock > 0
                      ? `Only ${stock} available`
                      : undefined
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center text-lg transition ${
                    cannotIncrease
                      ? "cursor-not-allowed text-gray-300 dark:text-slate-600"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                  }`}
                >
                  +
                </button>
              </div>

              {Number.isFinite(
                stock
              ) &&
                stock > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {stock} available
                  </p>
                )}
            </div>
          ) : (
            <div className="min-w-0">
              <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 dark:bg-slate-700 dark:text-gray-300">
                Quantity: {quantity}
              </div>

              {Number.isFinite(
                stock
              ) &&
                stock > 0 && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {stock} available
                  </p>
                )}
            </div>
          )}

          <div className="min-w-0 text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total
            </p>

            <p className="max-w-full break-all text-base font-bold text-gray-900 dark:text-white sm:text-lg">
              {currencyLoading
                ? "..."
                : formatPrice(itemTotal)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const buyNowTotal = buyNowItem
    ? getProductPrice(buyNowItem) *
      Number(buyNowItem.quantity || 1)
    : 0;

  return (
    <main className="min-h-screen w-full max-w-full overflow-hidden bg-gray-50 px-3 py-8 transition-colors duration-300 dark:bg-slate-900 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-7xl">
        {/* Page heading */}
        <div className="mb-7 min-w-0">
          <h1 className="break-words text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Shopping Cart
          </h1>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            {totalItems} item
            {totalItems === 1
              ? ""
              : "s"}{" "}
            in your cart
          </p>
        </div>

        {/* Buy Now item */}
        {buyNowItem && (
          <section className="mb-7 min-w-0">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Buy Now
              </h2>

              <button
                type="button"
                onClick={clearBuyNow}
                className="shrink-0 text-sm font-medium text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            {renderCartItem(
              buyNowItem,
              true
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={
                  handleBuyNowCheckout
                }
                disabled={
                  buyNowUnavailable
                }
                className={`max-w-full rounded-lg px-5 py-3 text-sm font-semibold text-white transition sm:px-6 ${
                  buyNowUnavailable
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {buyNowUnavailable
                  ? "Product Unavailable"
                  : currencyLoading
                  ? "Loading..."
                  : `Buy Now — ${formatPrice(
                      buyNowTotal
                    )}`}
              </button>
            </div>
          </section>
        )}

        {/* Empty cart */}
        {cartItems.length === 0 &&
        !buyNowItem ? (
          <div className="w-full min-w-0 overflow-hidden rounded-2xl bg-white p-7 text-center shadow-sm dark:bg-slate-800 sm:p-12">
            <div className="text-6xl">
              🛒
            </div>

            <h2 className="mt-5 break-words text-2xl font-bold text-gray-900 dark:text-white">
              Your cart is empty
            </h2>

            <p className="mx-auto mt-2 max-w-xl break-words text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              Add some products to your
              cart and they will appear
              here.
            </p>

            <Link
              to="/Product_page"
              className="mt-6 inline-block max-w-full rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition hover:bg-orange-700"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Cart items */}
            <section className="min-w-0">
              <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Cart Items
                </h2>

                {cartItems.length >
                  0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="shrink-0 text-sm font-medium text-red-500 transition hover:text-red-700"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Inventory warning */}
              {hasCartInventoryProblem && (
                <div className="mb-4 w-full min-w-0 overflow-hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
                  <p className="font-semibold">
                    Some items in your
                    cart are unavailable.
                  </p>

                  <p className="mt-1 break-words">
                    Please remove
                    unavailable items or
                    adjust their quantities
                    before proceeding to
                    checkout.
                  </p>
                </div>
              )}

              <div className="min-w-0 space-y-4">
                {cartItems.map((item) =>
                  renderCartItem(item)
                )}
              </div>
            </section>

            {/* Summary */}
            <aside className="h-fit min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Order Summary
              </h2>

              <div className="mt-5 space-y-3">
                {/* Items */}
                <div className="flex min-w-0 justify-between gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Items
                  </span>

                  <span className="font-medium text-gray-900 dark:text-white">
                    {totalItems}
                  </span>
                </div>

                {/* Subtotal */}
                <div className="flex min-w-0 justify-between gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal
                  </span>

                  <span className="max-w-[55%] break-all text-right font-medium text-gray-900 dark:text-white">
                    {currencyLoading
                      ? "..."
                      : formatPrice(
                          totalPrice
                        )}
                  </span>
                </div>

                {/* Delivery charge */}
                <div className="flex min-w-0 justify-between gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Delivery Charge
                  </span>

                  <span className="max-w-[55%] break-all text-right font-medium text-gray-900 dark:text-white">
                    {settingsLoading ||
                    currencyLoading
                      ? "Loading..."
                      : formatPrice(
                          deliveryCharge
                        )}
                  </span>
                </div>

                {/* Grand total */}
                <div className="border-t border-gray-200 pt-4 dark:border-slate-700">
                  <div className="flex min-w-0 justify-between gap-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Total
                    </span>

                    <span className="max-w-[60%] break-all text-right text-xl font-bold text-orange-600">
                      {settingsLoading ||
                      currencyLoading
                        ? "Loading..."
                        : formatPrice(
                            cartGrandTotal
                          )}
                    </span>
                  </div>
                </div>
              </div>

              {hasCartInventoryProblem && (
                <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  Fix the inventory issue above
                  before checkout.
                </p>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={
                  cartItems.length ===
                    0 ||
                  hasCartInventoryProblem ||
                  settingsLoading ||
                  currencyLoading
                }
                className={`mt-6 w-full rounded-lg px-5 py-3 font-semibold text-white transition ${
                  cartItems.length ===
                    0 ||
                  hasCartInventoryProblem ||
                  settingsLoading ||
                  currencyLoading
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {settingsLoading ||
                currencyLoading
                  ? "Loading..."
                  : hasCartInventoryProblem
                  ? "Fix Inventory Issues"
                  : "Proceed to Checkout"}
              </button>

              <Link
                to="/Product_page"
                className="mt-3 block text-center text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
};

export default Cart;