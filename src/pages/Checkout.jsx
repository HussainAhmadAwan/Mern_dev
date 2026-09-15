import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCart,
  getProductPrice,
} from "../context/CartContext";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// Generate a short frontend OrderID.
const generateOrderId = () => {
  const bytes = new Uint8Array(4);

  window.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    cartItems,
    clearCart,
    buyNowItem,
    clearBuyNow,
    formatPrice,
    currencyLoading,
  } = useCart();

  const checkoutItems = buyNowItem
    ? [buyNowItem]
    : cartItems;

  const [inventoryItems, setInventoryItems] =
    useState([]);

  const [inventoryLoading, setInventoryLoading] =
    useState(true);

  const [inventoryError, setInventoryError] =
    useState("");

  const [deliveryCharge, setDeliveryCharge] =
    useState(0);

  const [settingsLoading, setSettingsLoading] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    payment: "Cash on Delivery",
  });

  // ==========================================
  // FETCH LATEST INVENTORY
  // ==========================================

  const fetchInventory = async () => {
    if (checkoutItems.length === 0) {
      setInventoryItems([]);
      setInventoryLoading(false);
      return;
    }

    try {
      setInventoryLoading(true);
      setInventoryError("");

      const response = await api.get(
        "/api/products"
      );

      const products =
        response.data.products || [];

      const productMap = new Map(
        products.map((product) => [
          String(product._id),
          product,
        ])
      );

      const latestInventory =
        checkoutItems.map((item) => {
          const latestProduct =
            productMap.get(
              String(item._id)
            );

          if (!latestProduct) {
            return {
              ...item,
              stock: 0,
              inventoryUnavailable: true,
              inventoryMessage:
                "This product is no longer available.",
            };
          }

          const latestStock = Math.max(
            0,
            Number(latestProduct.stock || 0)
          );

          const requestedQuantity =
            Math.max(
              1,
              Number(item.quantity || 1)
            );

          return {
            ...item,
            ...latestProduct,
            requestedQuantity,
            stock: latestStock,
            inventoryUnavailable:
              latestStock < requestedQuantity,
            inventoryMessage:
              latestStock === 0
                ? "This product is currently out of stock."
                : latestStock <
                  requestedQuantity
                ? `Only ${latestStock} ${
                    latestStock === 1
                      ? "item is"
                      : "items are"
                  } currently available.`
                : "",
          };
        });

      setInventoryItems(
        latestInventory
      );
    } catch (error) {
      console.error(
        "Failed to check inventory:",
        error
      );

      setInventoryError(
        "Unable to check the latest stock. Please refresh and try again."
      );
    } finally {
      setInventoryLoading(false);
    }
  };

  // ==========================================
  // CHECK INVENTORY WHEN CHECKOUT CHANGES
  // ==========================================

  useEffect(() => {
    fetchInventory();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyNowItem, cartItems]);

  // ==========================================
  // LOAD DELIVERY SETTINGS
  // ==========================================

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setSettingsLoading(true);

        const response = await api.get(
          "/settings"
        );

        if (response.data.success) {
          const charge = Number(
            response.data.settings
              ?.deliveryCharge ?? 0
          );

          if (
            Number.isFinite(charge) &&
            charge >= 0
          ) {
            setDeliveryCharge(
              Math.round(charge * 100) / 100
            );
          } else {
            setDeliveryCharge(0);
          }
        }
      } catch (error) {
        console.error(
          "Failed to load delivery settings:",
          error
        );

        setDeliveryCharge(0);
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ==========================================
  // CALCULATE TOTAL ITEMS
  // ==========================================

  const checkoutTotalItems =
    checkoutItems.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

  // ==========================================
  // CALCULATE SUBTOTAL
  // ==========================================

  const checkoutSubtotal =
    checkoutItems.reduce(
      (total, item) => {
        const price =
          getProductPrice(item);

        return (
          total +
          price *
            Number(item.quantity || 0)
        );
      },
      0
    );

  const roundedCheckoutSubtotal =
    Math.round(
      checkoutSubtotal * 100
    ) / 100;

  // ==========================================
  // CALCULATE GRAND TOTAL
  // ==========================================

  const checkoutGrandTotal =
    Math.round(
      (
        roundedCheckoutSubtotal +
        Number(deliveryCharge || 0)
      ) * 100
    ) / 100;

  // ==========================================
  // CHECK INVENTORY PROBLEMS
  // ==========================================

  const hasInventoryProblem =
    inventoryItems.some(
      (item) =>
        item.inventoryUnavailable
    );

  // ==========================================
  // UPDATE FORM
  // ==========================================

  const handleChange = (e) => {
    setFormData((previous) => ({
      ...previous,
      [e.target.name]:
        e.target.value,
    }));
  };

  // ==========================================
  // PLACE ORDER
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (checkoutItems.length === 0) {
      alert(
        "There are no products to checkout."
      );
      return;
    }

    try {
      setLoading(true);
      setInventoryError("");

      // ==========================================
      // FINAL INVENTORY CHECK
      // ==========================================

      const inventoryResponse =
        await api.get(
          "/api/products"
        );

      const latestProducts =
        inventoryResponse.data
          .products || [];

      const latestProductMap =
        new Map(
          latestProducts.map(
            (product) => [
              String(product._id),
              product,
            ]
          )
        );

      const inventoryProblems = [];

      checkoutItems.forEach((item) => {
        const latestProduct =
          latestProductMap.get(
            String(item._id)
          );

        if (!latestProduct) {
          inventoryProblems.push(
            `"${item.name}" is no longer available.`
          );
          return;
        }

        const latestStock =
          Math.max(
            0,
            Number(
              latestProduct.stock || 0
            )
          );

        const requestedQuantity =
          Number(
            item.quantity || 0
          );

        if (
          latestStock <
          requestedQuantity
        ) {
          inventoryProblems.push(
            `"${latestProduct.name}": only ${latestStock} ${
              latestStock === 1
                ? "item is"
                : "items are"
            } available, but you requested ${requestedQuantity}.`
          );
        }
      });

      // ==========================================
      // STOP IF STOCK CHANGED
      // ==========================================

      if (
        inventoryProblems.length > 0
      ) {
        await fetchInventory();

        alert(
          `Inventory has changed:\n\n${inventoryProblems.join(
            "\n"
          )}\n\nPlease update your cart and try again.`
        );

        return;
      }

      // ==========================================
      // PREPARE ORDER ITEMS
      // ==========================================

      const orderItems =
        checkoutItems.map((item) => ({
          productId: item._id,
          name: item.name,
          image: item.image,
          price:
            getProductPrice(item),
          quantity: Number(
            item.quantity
          ),
        }));

      const frontendOrderId =
        generateOrderId();

      // ==========================================
      // PREPARE ORDER DATA
      // ==========================================
      //
      // IMPORTANT:
      // We intentionally DO NOT send subtotal,
      // delivery charge, total price, or currency
      // as trusted values.
      //
      // The backend gets the latest settings and
      // product prices directly from MongoDB.
      //
      const orderData = {
        orderId:
          frontendOrderId,

        customer: {
          firstName:
            formData.firstName,

          lastName:
            formData.lastName,

          email:
            formData.email,

          phone:
            formData.phone,

          address:
            formData.address,

          city:
            formData.city,

          zipCode:
            formData.zipCode,
        },

        paymentMethod:
          formData.payment,

        items: orderItems,

        totalItems:
          checkoutTotalItems,
      };

      // ==========================================
      // SEND ORDER
      // ==========================================

      const response =
        await api.post(
          "/orders",
          orderData
        );

      // ==========================================
      // ORDER CREATED
      // ==========================================

      if (response.data.success) {
        // Save the complete server-verified order.
        sessionStorage.setItem(
          "lastOrder",
          JSON.stringify(
            response.data.order
          )
        );

        if (buyNowItem) {
          clearBuyNow();
        } else {
          clearCart();
        }

        navigate(
          "/order-success"
        );
      }
    } catch (error) {
      console.error(
        "Order placement error:",
        error.response?.data ||
          error.message
      );

      const serverMessage =
        error.response?.data
          ?.message;

      if (
        error.response?.status ===
          400 &&
        serverMessage
      ) {
        await fetchInventory();

        alert(serverMessage);
      } else {
        alert(
          serverMessage ||
            "Something went wrong while placing your order."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen w-full min-w-0 overflow-x-hidden bg-gray-50 py-5 dark:bg-slate-900 sm:py-7">
      <div className="mx-auto w-full max-w-6xl min-w-0 px-4 sm:px-6">
        <h1 className="mb-5 text-center text-2xl font-bold text-gray-900 dark:text-white sm:mb-6 sm:text-3xl">
          Checkout
        </h1>

        {inventoryError && (
          <div className="mb-4 break-words rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {inventoryError}
          </div>
        )}

        {!inventoryLoading &&
          hasInventoryProblem && (
            <div className="mb-4 break-words rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-300">
              Some products in your order do
              not have enough stock. Please
              review the items below before
              placing your order.
            </div>
          )}

        <div className="grid min-w-0 gap-5 lg:grid-cols-2 lg:gap-6">
          {/* Checkout Form */}
          <form
            onSubmit={handleSubmit}
            className="min-w-0 rounded-xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-5"
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
              Shipping Details
            </h2>

            <div className="grid min-w-0 gap-2.5 sm:grid-cols-2">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                required
                value={
                  formData.firstName
                }
                onChange={
                  handleChange
                }
                className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />

              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                required
                value={
                  formData.lastName
                }
                onChange={
                  handleChange
                }
                className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                required
                value={
                  formData.phone
                }
                onChange={
                  handleChange
                }
                className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <textarea
              name="address"
              placeholder="Address"
              required
              rows="2"
              value={
                formData.address
              }
              onChange={
                handleChange
              }
              className="mt-2.5 w-full min-w-0 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />

            <div className="mt-2.5 grid min-w-0 gap-2.5 sm:grid-cols-2">
              <input
                type="text"
                name="city"
                placeholder="City"
                required
                value={
                  formData.city
                }
                onChange={
                  handleChange
                }
                className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />

              <input
                type="text"
                name="zipCode"
                placeholder="ZIP Code"
                required
                value={
                  formData.zipCode
                }
                onChange={
                  handleChange
                }
                className="w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div className="mt-4">
              <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">
                Payment Method
              </h3>

              <div className="flex min-w-0 flex-wrap gap-x-5 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-white">
                  <input
                    type="radio"
                    name="payment"
                    value="Cash on Delivery"
                    checked={
                      formData.payment ===
                      "Cash on Delivery"
                    }
                    onChange={
                      handleChange
                    }
                    className="accent-orange-600"
                  />
                  Cash on Delivery
                </label>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-white">
                  <input
                    type="radio"
                    name="payment"
                    value="Credit Card"
                    checked={
                      formData.payment ===
                      "Credit Card"
                    }
                    onChange={
                      handleChange
                    }
                    className="accent-orange-600"
                  />
                  Credit Card
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                settingsLoading ||
                currencyLoading ||
                inventoryLoading ||
                hasInventoryProblem ||
                checkoutItems.length === 0
              }
              className="mt-5 w-full rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading
                ? "Placing Order..."
                : inventoryLoading
                ? "Checking Stock..."
                : settingsLoading ||
                  currencyLoading
                ? "Loading..."
                : hasInventoryProblem
                ? "Update Stock Before Ordering"
                : "Place Order"}
            </button>
          </form>

          {/* Order Summary */}
          <div className="h-fit min-w-0 rounded-xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-5">
            <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
              Order Summary
            </h2>

            <div className="space-y-2">
              {checkoutItems.map(
                (item) => {
                  const inventoryItem =
                    inventoryItems.find(
                      (
                        inventoryProduct
                      ) =>
                        String(
                          inventoryProduct._id
                        ) ===
                        String(
                          item._id
                        )
                    );

                  const sellingPrice =
                    getProductPrice(
                      item
                    );

                  const isSale =
                    item.isOnSale &&
                    Number.isFinite(
                      Number(
                        item.discountedPrice
                      )
                    ) &&
                    Number(
                      item.discountedPrice
                    ) <
                      Number(
                        item.originalPrice ??
                          item.price ??
                          0
                      );

                  const originalPrice =
                    Number(
                      item.originalPrice ??
                        item.price ??
                        0
                    );

                  const itemTotal =
                    sellingPrice *
                    Number(
                      item.quantity || 0
                    );

                  const currentStock =
                    inventoryItem
                      ? Number(
                          inventoryItem.stock ||
                            0
                        )
                      : Number(
                          item.stock || 0
                        );

                  const inventoryProblem =
                    inventoryItem?.inventoryUnavailable;

                  return (
                    <div
                      key={item._id}
                      className={`min-w-0 rounded-lg border p-2.5 dark:border-slate-700 ${
                        inventoryProblem
                          ? "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-900/10"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 shrink-0 rounded-lg border object-cover dark:border-slate-600"
                          />

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </h3>

                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              Qty:{" "}
                              {
                                item.quantity
                              }
                            </p>

                            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-orange-600">
                                {formatPrice(
                                  sellingPrice
                                )}
                              </span>

                              {isSale && (
                                <span className="text-[11px] text-gray-400 line-through">
                                  {formatPrice(
                                    originalPrice
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right text-sm font-bold text-orange-600">
                          {formatPrice(
                            itemTotal
                          )}
                        </div>
                      </div>

                      {inventoryProblem && (
                        <div className="mt-2 break-words border-t border-red-200 pt-2 text-xs font-medium text-red-600 dark:border-red-900/50 dark:text-red-400">
                          {inventoryItem?.inventoryMessage ||
                            `Only ${currentStock} ${
                              currentStock ===
                              1
                                ? "item is"
                                : "items are"
                            } currently available.`}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-4 space-y-2 border-t pt-3 dark:border-slate-700">
              <div className="flex justify-between gap-4 text-sm text-gray-700 dark:text-gray-300">
                <span>
                  Total Products
                </span>

                <span className="shrink-0">
                  {
                    checkoutTotalItems
                  }
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm text-gray-700 dark:text-gray-300">
                <span>
                  Subtotal
                </span>

                <span className="shrink-0">
                  {formatPrice(
                    roundedCheckoutSubtotal
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm text-gray-700 dark:text-gray-300">
                <span>
                  Delivery Charges
                </span>

                <span className="shrink-0 font-medium">
                  {settingsLoading
                    ? "Loading..."
                    : formatPrice(
                        deliveryCharge
                      )}
                </span>
              </div>

              <div className="mt-2 flex min-w-0 items-center justify-between gap-4 border-t pt-3 text-lg font-bold text-orange-600 dark:border-slate-700">
                <span>
                  Total Price
                </span>

                <span className="shrink-0">
                  {formatPrice(
                    checkoutGrandTotal
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;