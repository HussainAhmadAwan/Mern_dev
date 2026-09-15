
import React, { useEffect, useState } from "react";
import api from "../api/axios";

const CURRENCY_OPTIONS = [
  {
    code: "PKR",
    name: "Pakistani Rupee",
    symbol: "₨",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
  },
  {
    code: "SAR",
    name: "Saudi Riyal",
    symbol: "﷼",
  },
  {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
  },
  {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
  },
  {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
  },
];

const DEFAULT_CURRENCY_CODE = "USD";

const DEFAULT_ANNOUNCEMENT_SPEED = 20;
const MIN_ANNOUNCEMENT_SPEED = 0;
const MAX_ANNOUNCEMENT_SPEED = 120;

const getCurrencyByCode = (code) => {
  return CURRENCY_OPTIONS.find(
    (currency) => currency.code === code
  );
};

const getCurrencySymbol = (code) => {
  return (
    getCurrencyByCode(code)?.symbol || "$"
  );
};

const AdminSettings = () => {
  // Store selected product cards per row.
  const [
    productCardsPerRow,
    setProductCardsPerRow,
  ] = useState(4);

  // Store standard delivery charge.
  const [
    deliveryCharge,
    setDeliveryCharge,
  ] = useState(0);

  // Store announcement text.
  const [
    announcementText,
    setAnnouncementText,
  ] = useState("");

  // Store custom announcement ticker duration in seconds.
  const [
    announcementSpeed,
    setAnnouncementSpeed,
  ] = useState(
    DEFAULT_ANNOUNCEMENT_SPEED
  );

  // Store selected currency code.
  const [
    currencyCode,
    setCurrencyCode,
  ] = useState(
    DEFAULT_CURRENCY_CODE
  );

  // Currency symbol is always derived from currency code.
  const [
    currencySymbol,
    setCurrencySymbol,
  ] = useState(
    getCurrencySymbol(
      DEFAULT_CURRENCY_CODE
    )
  );

  // Store loading state.
  const [loading, setLoading] =
    useState(true);

  // Store saving state.
  const [saving, setSaving] =
    useState(false);

  // Store success message.
  const [success, setSuccess] =
    useState("");

  // Store error message.
  const [error, setError] =
    useState("");

  // =========================================================
  // LOAD SETTINGS FROM MONGODB
  // =========================================================

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/admin/settings"
          );

        if (response.data.success) {
          const settings =
            response.data.settings || {};

          // -------------------------------------------------
          // Product cards per row
          // -------------------------------------------------

          const savedColumns =
            Number(
              settings.productCardsPerRow ??
                4
            );

          if (
            [3, 4, 5, 6].includes(
              savedColumns
            )
          ) {
            setProductCardsPerRow(
              savedColumns
            );
          } else {
            setProductCardsPerRow(4);
          }

          // -------------------------------------------------
          // Delivery charge
          // -------------------------------------------------

          const savedDeliveryCharge =
            Number(
              settings.deliveryCharge ??
                0
            );

          if (
            Number.isFinite(
              savedDeliveryCharge
            ) &&
            savedDeliveryCharge >= 0
          ) {
            setDeliveryCharge(
              savedDeliveryCharge
            );
          } else {
            setDeliveryCharge(0);
          }

          // -------------------------------------------------
          // Announcement
          // -------------------------------------------------

          setAnnouncementText(
            settings.announcementText ||
              ""
          );

          // -------------------------------------------------
          // Announcement speed
          // -------------------------------------------------

          const savedAnnouncementSpeed =
            Number(
              settings.announcementSpeed ??
                DEFAULT_ANNOUNCEMENT_SPEED
            );

          // Zero is valid and means the ticker stays still.
          if (
            Number.isFinite(
              savedAnnouncementSpeed
            ) &&
            savedAnnouncementSpeed >=
              MIN_ANNOUNCEMENT_SPEED &&
            savedAnnouncementSpeed <=
              MAX_ANNOUNCEMENT_SPEED
          ) {
            setAnnouncementSpeed(
              savedAnnouncementSpeed
            );
          } else {
            setAnnouncementSpeed(
              DEFAULT_ANNOUNCEMENT_SPEED
            );
          }

          // -------------------------------------------------
          // Currency
          // -------------------------------------------------

          const savedCurrencyCode =
            typeof settings.currencyCode ===
            "string"
              ? settings.currencyCode.toUpperCase()
              : DEFAULT_CURRENCY_CODE;

          const selectedCurrency =
            getCurrencyByCode(
              savedCurrencyCode
            );

          if (selectedCurrency) {
            setCurrencyCode(
              selectedCurrency.code
            );

            setCurrencySymbol(
              selectedCurrency.symbol
            );
          } else {
            setCurrencyCode(
              DEFAULT_CURRENCY_CODE
            );

            setCurrencySymbol(
              getCurrencySymbol(
                DEFAULT_CURRENCY_CODE
              )
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load settings:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Failed to load settings."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // =========================================================
  // CHANGE CURRENCY
  // =========================================================

  const handleCurrencyChange = (
    event
  ) => {
    const selectedCode =
      event.target.value;

    const selectedCurrency =
      getCurrencyByCode(
        selectedCode
      );

    if (!selectedCurrency) {
      return;
    }

    setCurrencyCode(
      selectedCurrency.code
    );

    setCurrencySymbol(
      selectedCurrency.symbol
    );

    setSuccess("");
    setError("");
  };

  // =========================================================
  // SAVE ALL SETTINGS
  // =========================================================

  const handleSaveSettings =
    async () => {
      try {
        setSaving(true);
        setSuccess("");
        setError("");

        // -------------------------------------------------
        // Validate delivery charge
        // -------------------------------------------------

        const charge =
          Number(deliveryCharge);

        if (
          !Number.isFinite(charge) ||
          charge < 0
        ) {
          setError(
            "Delivery charge must be a valid number greater than or equal to 0."
          );

          setSaving(false);
          return;
        }

        // -------------------------------------------------
        // Validate custom announcement speed
        // -------------------------------------------------

        const speed =
          Number(
            announcementSpeed
          );

        if (
          !Number.isFinite(speed) ||
          speed < MIN_ANNOUNCEMENT_SPEED ||
          speed > MAX_ANNOUNCEMENT_SPEED
        ) {
          setError(
            "Announcement speed must be between 0 and 120 seconds."
          );

          setSaving(false);
          return;
        }

        // -------------------------------------------------
        // Get selected currency
        // -------------------------------------------------

        const selectedCurrency =
          getCurrencyByCode(
            currencyCode
          );

        if (!selectedCurrency) {
          setError(
            "Please select a valid currency."
          );

          setSaving(false);
          return;
        }

        const finalCurrencyCode =
          selectedCurrency.code;

        const finalCurrencySymbol =
          selectedCurrency.symbol;

        // -------------------------------------------------
        // Data sent to backend
        // -------------------------------------------------

        const settingsData = {
          productCardsPerRow:
            Number(
              productCardsPerRow
            ),

          deliveryCharge:
            Math.round(
              charge * 100
            ) / 100,

          announcementText:
            announcementText,

          // Send zero as a valid still-ticker setting.
          announcementSpeed:
            speed,

          currencyCode:
            finalCurrencyCode,

          currencySymbol:
            finalCurrencySymbol,
        };

        console.log(
          "Saving admin settings:",
          settingsData
        );

        // -------------------------------------------------
        // Save settings to MongoDB
        // -------------------------------------------------

        const response =
          await api.put(
            "/admin/settings",
            settingsData
          );

        if (
          response.data.success
        ) {
          const savedSettings =
            response.data.settings ||
            {};

          // -------------------------------------------------
          // Product cards
          // -------------------------------------------------

          const returnedColumns =
            Number(
              savedSettings.productCardsPerRow ??
                settingsData.productCardsPerRow
            );

          if (
            [3, 4, 5, 6].includes(
              returnedColumns
            )
          ) {
            setProductCardsPerRow(
              returnedColumns
            );
          } else {
            setProductCardsPerRow(
              settingsData.productCardsPerRow
            );
          }

          // -------------------------------------------------
          // Delivery charge
          // -------------------------------------------------

          const returnedDeliveryCharge =
            Number(
              savedSettings.deliveryCharge ??
                settingsData.deliveryCharge
            );

          if (
            Number.isFinite(
              returnedDeliveryCharge
            ) &&
            returnedDeliveryCharge >= 0
          ) {
            setDeliveryCharge(
              returnedDeliveryCharge
            );
          } else {
            setDeliveryCharge(
              settingsData.deliveryCharge
            );
          }

          // -------------------------------------------------
          // Announcement
          // -------------------------------------------------

          setAnnouncementText(
            savedSettings.announcementText ??
              settingsData.announcementText
          );

          // -------------------------------------------------
          // Announcement speed
          // -------------------------------------------------

          const returnedSpeed =
            Number(
              savedSettings.announcementSpeed ??
                settingsData.announcementSpeed
            );

          // Accept zero and all valid speeds returned by MongoDB.
          if (
            Number.isFinite(
              returnedSpeed
            ) &&
            returnedSpeed >=
              MIN_ANNOUNCEMENT_SPEED &&
            returnedSpeed <=
              MAX_ANNOUNCEMENT_SPEED
          ) {
            setAnnouncementSpeed(
              returnedSpeed
            );
          } else {
            setAnnouncementSpeed(
              settingsData.announcementSpeed
            );
          }

          // -------------------------------------------------
          // Currency
          // -------------------------------------------------

          const returnedCurrencyCode =
            typeof savedSettings.currencyCode ===
            "string"
              ? savedSettings.currencyCode.toUpperCase()
              : finalCurrencyCode;

          const returnedCurrency =
            getCurrencyByCode(
              returnedCurrencyCode
            );

          if (returnedCurrency) {
            setCurrencyCode(
              returnedCurrency.code
            );

            setCurrencySymbol(
              returnedCurrency.symbol
            );
          } else {
            setCurrencyCode(
              finalCurrencyCode
            );

            setCurrencySymbol(
              finalCurrencySymbol
            );
          }

          setSuccess(
            "Settings saved successfully."
          );
        } else {
          setError(
            response.data.message ||
              "Failed to save settings."
          );
        }
      } catch (error) {
        console.error(
          "Failed to save settings:",
          error
        );

        setError(
          error.response?.data
            ?.message ||
            "Failed to save settings."
        );
      } finally {
        setSaving(false);
      }
    };

  // =========================================================
  // ANNOUNCEMENT PREVIEW DATA
  // =========================================================

  // Split announcements by new line so every line becomes a separate sentence.
  const announcementSentences =
    announcementText
      .split(/\r?\n/)
      .map((sentence) =>
        sentence.trim()
      )
      .filter(Boolean);

  const previewSpeed =
    Number(announcementSpeed);

  const previewIsMoving =
    Number.isFinite(
      previewSpeed
    ) &&
    previewSpeed > 0;

  // Render one moving preview announcement group.
  const renderPreviewGroup = (
    groupNumber
  ) => (
    <div
      className="flex shrink-0 items-center"
      key={`preview-group-${groupNumber}`}
    >
      {announcementSentences.map(
        (
          sentence,
          index
        ) => (
          <span
            key={`preview-${groupNumber}-${index}`}
            className="inline-flex shrink-0 items-center px-4 text-sm font-medium text-gray-700 dark:text-gray-200 sm:px-6"
          >
            <span className="mr-3 font-bold text-orange-500">
              •
            </span>

            {sentence}
          </span>
        )
      )}
    </div>
  );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="pb-6">

      {/* Page Heading */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
          Settings
        </h1>

        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          Manage website settings from one place.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">

        {/* =====================================================
            PRODUCT DISPLAY SETTINGS
        ====================================================== */}

        <div className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Product Display
            </h2>

            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Choose how many product cards customers see in each row.
            </p>
          </div>

          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Cards per row
          </label>

          <div className="grid grid-cols-4 gap-2">
            {[3, 4, 5, 6].map(
              (number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => {
                    setProductCardsPerRow(
                      number
                    );
                    setSuccess("");
                  }}
                  className={`rounded-lg border px-3 py-2.5 text-center transition-all ${
                    productCardsPerRow ===
                    number
                      ? "border-orange-600 bg-orange-600 text-white shadow-md"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-400 hover:bg-orange-50 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                  }`}
                >
                  <div className="text-lg font-bold">
                    {number}
                  </div>

                  <div className="text-[11px]">
                    Cards
                  </div>
                </button>
              )
            )}
          </div>

          <div className="mt-3 rounded-lg bg-gray-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Customers will see{" "}
              <span className="font-bold text-orange-600">
                {productCardsPerRow}
              </span>{" "}
              product cards in each row.
            </p>
          </div>
        </div>

        {/* =====================================================
            DELIVERY SETTINGS
        ====================================================== */}

        <div className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Delivery Charges
            </h2>

            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Set the standard delivery charge automatically added to customer orders.
            </p>
          </div>

          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Standard Delivery Charge
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              {currencySymbol}
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={deliveryCharge}
              onChange={(e) => {
                setDeliveryCharge(
                  e.target.value
                );
                setSuccess("");
              }}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="mt-3 rounded-lg bg-orange-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Current standard delivery charge:
            </p>

            <p className="mt-0.5 text-xl font-bold text-orange-600">
              {currencySymbol}
              {Number(
                deliveryCharge || 0
              ).toFixed(2)}
            </p>
          </div>
        </div>

        {/* =====================================================
            CURRENCY SETTINGS
        ====================================================== */}

        <div className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Currency
            </h2>

            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Select the currency that will be displayed with product prices.
            </p>
          </div>

          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Website Currency
          </label>

          <select
            value={currencyCode}
            onChange={
              handleCurrencyChange
            }
            disabled={saving}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            {CURRENCY_OPTIONS.map(
              (currency) => (
                <option
                  key={currency.code}
                  value={currency.code}
                >
                  {currency.code} —{" "}
                  {currency.name} (
                  {currency.symbol})
                </option>
              )
            )}
          </select>

          {/* Selected Currency */}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-slate-900">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Selected Currency
              </p>

              <p className="mt-0.5 text-sm font-bold text-gray-800 dark:text-white">
                {currencyCode}
              </p>
            </div>

            <span className="text-2xl font-bold text-orange-600">
              {currencySymbol}
            </span>
          </div>

          {/* Example */}
          <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50 px-4 py-2.5 dark:border-orange-900/30 dark:bg-orange-900/10">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Example product price:
            </p>

            <p className="mt-0.5 text-lg font-bold text-orange-600">
              {currencySymbol}1,199.99
            </p>
          </div>
        </div>

        {/* =====================================================
            ANNOUNCEMENT SETTINGS
        ====================================================== */}

        <div className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Announcement / News Bar
            </h2>

            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Control the message and scrolling speed shown below the main navigation.
            </p>
          </div>

          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Announcement Text
          </label>

          <textarea
            value={announcementText}
            onChange={(e) => {
              setAnnouncementText(
                e.target.value
              );
              setSuccess("");
              setError("");
            }}
            placeholder={`Enter each announcement on a new line.\nExample:\nFree delivery on orders above ₨2000\nNew products added every week\nSummer sale is now live`}
            rows="5"
            maxLength="500"
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />

          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter each new sentence on a separate line.
            </p>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {announcementText.length}/500
            </span>
          </div>

          {/* Custom announcement speed input */}
          <label className="mb-2 mt-4 block text-sm font-semibold text-gray-700 dark:text-gray-200">
            Announcement Speed
          </label>

          <input
            type="number"
            min="0"
            max="120"
            step="1"
            value={announcementSpeed}
            onChange={(e) => {
              setAnnouncementSpeed(
                e.target.value
              );
              setSuccess("");
              setError("");
            }}
            disabled={saving}
            placeholder="Fast 2 < ---- > 45 Slow"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-gray-400"
          />

          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Lower seconds are faster. Higher seconds are slower. Enter{" "}
            <span className="font-semibold text-orange-600">
              0
            </span>{" "}
            to keep the ticker still.
          </p>

          {/* Show the currently selected speed. */}
          <div className="mt-2 rounded-lg bg-gray-50 px-4 py-2.5 dark:bg-slate-900">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Current speed:{" "}
              <span className="font-bold text-orange-600">
                {announcementSpeed ===
                ""
                  ? "Not set"
                  : Number(
                      announcementSpeed
                    ) === 0
                  ? "Still"
                  : `${announcementSpeed} seconds`}
              </span>
            </p>
          </div>

          {/* Announcement Preview */}
          {announcementSentences.length >
            0 && (
            <div
              className={`mt-4 overflow-hidden rounded-lg border ${
                previewIsMoving
                  ? "border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/10"
                  : "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              }`}
            >
              <p
                className={`border-b px-3 py-1.5 text-xs font-semibold ${
                  previewIsMoving
                    ? "border-orange-200 text-orange-700 dark:border-orange-900/50 dark:text-orange-400"
                    : "border-gray-200 text-gray-600 dark:border-slate-700 dark:text-gray-300"
                }`}
              >
                Preview
              </p>

              {/* Use the same thin white static design when speed is 0. */}
              <div
                className={`relative overflow-hidden ${
                  previewIsMoving
                    ? "py-3"
                    : "py-1.5"
                }`}
              >
                {previewIsMoving ? (
                  <div
                    className="flex w-max"
                    style={{
                      animationName:
                        "announcementTicker",
                      animationDuration: `${previewSpeed}s`,
                      animationTimingFunction:
                        "linear",
                      animationIterationCount:
                        "infinite",
                      animationPlayState:
                        "running",
                      willChange:
                        "transform",
                    }}
                  >
                    {[
                      1,
                      2,
                      3,
                      4,
                    ].map(
                      (
                        groupNumber
                      ) =>
                        renderPreviewGroup(
                          groupNumber
                        )
                    )}
                  </div>
                ) : (
                  <div className="mx-auto flex min-h-9 max-w-7xl items-center px-3 sm:px-4">
                    <div className="mr-3 flex shrink-0 items-center gap-2 text-sm font-semibold text-orange-600 dark:text-orange-400">
                      <span>📢</span>

                      <span className="hidden sm:inline">
                        Announcement
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-center whitespace-nowrap text-sm text-gray-600 dark:text-gray-200">
                        {announcementSentences.map(
                          (
                            sentence,
                            index
                          ) => (
                            <React.Fragment
                              key={`still-preview-${index}`}
                            >
                              {index >
                                0 && (
                                <span className="mx-3 font-bold text-gray-300 dark:text-slate-500">
                                  •
                                </span>
                              )}

                              <span className="shrink-0">
                                {sentence}
                              </span>
                            </React.Fragment>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          MESSAGES
      ====================================================== */}

      {success && (
        <div className="mt-4 rounded-lg bg-green-100 px-4 py-2.5 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
          {success}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 px-4 py-2.5 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* =====================================================
          SAVE BUTTON
      ====================================================== */}

      {!loading && (
        <button
          type="button"
          onClick={
            handleSaveSettings
          }
          disabled={saving}
          className="mt-4 rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <p className="mt-4 text-sm text-orange-600">
          Loading settings...
        </p>
      )}

      {/* Announcement ticker animation moves one complete group per cycle. */}
      <style>
        {`
          @keyframes announcementTicker {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(-25%);
            }
          }
        `}
      </style>
    </div>
  );
};

export default AdminSettings;

