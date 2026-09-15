import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import API from "../api/api";

// Create Context.
const CartContext = createContext();

// Custom hook so we can use the cart anywhere.
export const useCart = () => useContext(CartContext);

// Get the actual selling price of a product.
export const getProductPrice = (product) => {
  const discountedPrice = Number(product?.discountedPrice);
  const regularPrice = Number(product?.price || 0);

  if (
    product?.isOnSale &&
    Number.isFinite(discountedPrice) &&
    discountedPrice >= 0 &&
    discountedPrice < regularPrice
  ) {
    return discountedPrice;
  }

  return Number.isFinite(regularPrice) ? regularPrice : 0;
};

// Format a number using the currently selected currency.
const createPriceFormatter = (currencySymbol = "$") => {
  return (amount) => {
    const numericAmount = Number(amount);

    const safeAmount = Number.isFinite(numericAmount)
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
};

// Provider Component.
export const CartProvider = ({ children }) => {
  // Stores all cart products.
  const [cartItems, setCartItems] = useState(() => {
    // Load saved cart from localStorage.
    const savedCart = localStorage.getItem("cart");

    try {
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to load cart:", error);
      return [];
    }
  });

  // Store the Buy Now product.
  const [buyNowItem, setBuyNowItem] = useState(null);

  // Indicates whether the cart is checking current inventory.
  const [inventoryLoading, setInventoryLoading] =
    useState(false);

  // ==========================================
  // CURRENCY SETTINGS
  // ==========================================

  const [currencyCode, setCurrencyCode] = useState("USD");

  const [currencySymbol, setCurrencySymbol] =
    useState("$");

  const [currencyLoading, setCurrencyLoading] =
    useState(true);

  // Load currency settings from MongoDB.
  const fetchCurrencySettings = async () => {
    try {
      setCurrencyLoading(true);

      const response = await API.get("/settings");

      const settings = response.data?.settings || {};

      const savedCurrencyCode =
        String(settings.currencyCode || "USD")
          .trim()
          .toUpperCase();

      const savedCurrencySymbol =
        String(settings.currencySymbol || "$").trim();

      setCurrencyCode(
        savedCurrencyCode || "USD"
      );

      setCurrencySymbol(
        savedCurrencySymbol || "$"
      );
    } catch (error) {
      console.error(
        "Failed to load currency settings:",
        error
      );

      // Safe fallback.
      setCurrencyCode("USD");
      setCurrencySymbol("$");
    } finally {
      setCurrencyLoading(false);
    }
  };

  // Load currency when the cart provider starts.
  useEffect(() => {
    fetchCurrencySettings();
  }, []);

  // Format prices throughout the website.
  const formatPrice = (amount) => {
    return createPriceFormatter(currencySymbol)(
      amount
    );
  };

  // ==========================================
  // SAVE CART
  // ==========================================

  // Save cart whenever it changes.
  useEffect(() => {
    localStorage.setItem(
      "cart",
      JSON.stringify(cartItems)
    );
  }, [cartItems]);

  // ==========================================
  // SYNC CART WITH MONGODB INVENTORY
  // ==========================================

  const syncCartInventory = async () => {
    if (cartItems.length === 0) {
      return;
    }

    try {
      setInventoryLoading(true);

      // Get the latest public products from MongoDB.
      const response = await API.get("/api/products");

      const products = response.data.products || [];

      const productMap = new Map(
        products.map((product) => [
          String(product._id),
          product,
        ])
      );

      setCartItems((currentItems) => {
        return currentItems
          .map((item) => {
            const latestProduct = productMap.get(
              String(item._id)
            );

            // Product was removed or is hidden.
            if (!latestProduct) {
              return {
                ...item,
                stock: 0,
                inventoryUnavailable: true,
              };
            }

            const latestStock = Math.max(
              0,
              Number(latestProduct.stock || 0)
            );

            const currentQuantity = Math.max(
              1,
              Number(item.quantity || 1)
            );

            // Keep quantity within current stock.
            const syncedQuantity =
              latestStock > 0
                ? Math.min(
                    currentQuantity,
                    latestStock
                  )
                : currentQuantity;

            return {
              ...item,
              ...latestProduct,
              quantity: syncedQuantity,
              stock: latestStock,
              inventoryUnavailable:
                latestStock === 0,
            };
          })
          .filter((item) => {
            // Keep unavailable products in the cart so
            // the customer can see what happened.
            return true;
          });
      });
    } catch (error) {
      console.error(
        "Failed to synchronize cart inventory:",
        error
      );
    } finally {
      setInventoryLoading(false);
    }
  };

  // Synchronize saved cart with MongoDB when the
  // cart provider first loads.
  useEffect(() => {
    syncCartInventory();

    // Run once when the application loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================
  // ADD TO CART
  // ==========================================

  const addToCart = (product, quantity = 1) => {
    const requestedQuantity = Math.max(
      1,
      Number(quantity || 1)
    );

    const availableStock = Math.max(
      0,
      Number(product.stock || 0)
    );

    if (availableStock <= 0) {
      alert(
        `"${product.name}" is currently out of stock.`
      );

      return false;
    }

    let addedSuccessfully = false;

    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item._id === product._id
      );

      if (existingItem) {
        const currentQuantity = Number(
          existingItem.quantity || 0
        );

        const newQuantity =
          currentQuantity + requestedQuantity;

        if (newQuantity > availableStock) {
          alert(
            `Only ${availableStock} ${
              availableStock === 1
                ? "item is"
                : "items are"
            } available for "${product.name}".`
          );

          return prevItems;
        }

        addedSuccessfully = true;

        return prevItems.map((item) =>
          item._id === product._id
            ? {
                ...item,
                ...product,
                quantity: newQuantity,
                stock: availableStock,
                inventoryUnavailable: false,
              }
            : item
        );
      }

      const finalQuantity = Math.min(
        requestedQuantity,
        availableStock
      );

      if (requestedQuantity > availableStock) {
        alert(
          `Only ${availableStock} ${
            availableStock === 1
              ? "item is"
              : "items are"
          } available for "${product.name}".`
        );
      }

      addedSuccessfully = true;

      return [
        ...prevItems,
        {
          ...product,
          quantity: finalQuantity,
          stock: availableStock,
          inventoryUnavailable: false,
        },
      ];
    });

    return addedSuccessfully;
  };

  // ==========================================
  // BUY NOW
  // ==========================================

  const buyNow = (product, quantity = 1) => {
    const requestedQuantity = Math.max(
      1,
      Number(quantity || 1)
    );

    const availableStock = Math.max(
      0,
      Number(product.stock || 0)
    );

    if (availableStock <= 0) {
      alert(
        `"${product.name}" is currently out of stock.`
      );

      return false;
    }

    if (requestedQuantity > availableStock) {
      alert(
        `Only ${availableStock} ${
          availableStock === 1
            ? "item is"
            : "items are"
        } available for "${product.name}".`
      );

      return false;
    }

    setBuyNowItem({
      ...product,
      quantity: requestedQuantity,
      stock: availableStock,
      inventoryUnavailable: false,
    });

    return true;
  };

  // Clear Buy Now product.
  const clearBuyNow = () => {
    setBuyNowItem(null);
  };

  // ==========================================
  // REMOVE FROM CART
  // ==========================================

  const removeFromCart = (productId) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => item._id !== productId
      )
    );
  };

  // ==========================================
  // INCREASE QUANTITY
  // ==========================================

  const increaseQuantity = (productId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id !== productId) {
          return item;
        }

        const currentQuantity = Number(
          item.quantity || 1
        );

        const availableStock = Math.max(
          0,
          Number(item.stock || 0)
        );

        if (availableStock <= 0) {
          alert(
            `"${item.name}" is currently out of stock.`
          );

          return {
            ...item,
            inventoryUnavailable: true,
          };
        }

        if (currentQuantity >= availableStock) {
          alert(
            `Only ${availableStock} ${
              availableStock === 1
                ? "item is"
                : "items are"
            } available for "${item.name}".`
          );

          return item;
        }

        return {
          ...item,
          quantity: currentQuantity + 1,
        };
      })
    );
  };

  // ==========================================
  // DECREASE QUANTITY
  // ==========================================

  const decreaseQuantity = (productId) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === productId
          ? {
              ...item,
              quantity:
                Number(item.quantity || 1) > 1
                  ? Number(item.quantity) - 1
                  : 1,
            }
          : item
      )
    );
  };

  // ==========================================
  // CLEAR CART
  // ==========================================

  const clearCart = () => {
    setCartItems([]);
  };

  // ==========================================
  // CALCULATE TOTAL ITEMS
  // ==========================================

  const totalItems = cartItems.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  // ==========================================
  // CALCULATE TOTAL PRICE
  // ==========================================

  const totalPrice = cartItems.reduce(
    (total, item) => {
      const price = getProductPrice(item);

      return (
        total +
        price * Number(item.quantity || 0)
      );
    },
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,

        // Buy Now.
        buyNowItem,
        buyNow,
        clearBuyNow,

        // Inventory.
        inventoryLoading,
        syncCartInventory,

        // Currency.
        currencyCode,
        currencySymbol,
        currencyLoading,
        formatPrice,
        refreshCurrencySettings: fetchCurrencySettings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};