import React, { useEffect, useState } from "react";
import api from "../api/axios";

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minimumOrderAmount: "",
  maximumDiscount: "",
  expiryDate: "",
  isActive: true,
  usageLimit: "",
};

const formatDate = (date) => {
  if (!date) {
    return "No expiry";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [editingCoupon, setEditingCoupon] = useState(null);

  const [formData, setFormData] = useState({
    ...emptyForm,
  });

  // ======================================================
  // LOAD COUPONS
  // ======================================================

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/coupons");

      if (response.data.success) {
        setCoupons(response.data.coupons || []);
      } else {
        setError(
          response.data.message ||
            "Failed to load coupons."
        );
      }
    } catch (error) {
      console.error("Failed to load coupons:", error);

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to load coupons."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // ======================================================
  // RESET FORM
  // ======================================================

  const resetForm = () => {
    setFormData({
      ...emptyForm,
    });

    setEditingCoupon(null);
    setShowForm(false);
  };

  // ======================================================
  // CREATE
  // ======================================================

  const handleCreate = () => {
    setFormData({
      ...emptyForm,
    });

    setEditingCoupon(null);
    setShowForm(true);

    setError("");
    setSuccess("");
  };

  // ======================================================
  // EDIT
  // ======================================================

  const handleEdit = (coupon) => {
    let expiryValue = "";

    if (coupon.expiryDate) {
      const date = new Date(coupon.expiryDate);

      if (!Number.isNaN(date.getTime())) {
        const year = date.getFullYear();

        const month = String(
          date.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
          date.getDate()
        ).padStart(2, "0");

        expiryValue = `${year}-${month}-${day}`;
      }
    }

    setFormData({
      code: coupon.code || "",

      discountType:
        coupon.discountType || "percentage",

      discountValue:
        coupon.discountValue ?? "",

      minimumOrderAmount:
        coupon.minimumOrderAmount ?? "",

      maximumDiscount:
        coupon.maximumDiscount ?? "",

      expiryDate: expiryValue,

      isActive: coupon.isActive !== false,

      usageLimit:
        coupon.usageLimit ?? "",
    });

    setEditingCoupon(coupon);
    setShowForm(true);

    setError("");
    setSuccess("");
  };

  // ======================================================
  // FORM CHANGE
  // ======================================================

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setError("");
    setSuccess("");
  };

  // ======================================================
  // SAVE
  // ======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const code = formData.code
      .trim()
      .toUpperCase();

    if (!code) {
      setError("Coupon code is required.");
      return;
    }

    const discountValue = Number(
      formData.discountValue
    );

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      setError(
        "Discount value must be greater than 0."
      );
      return;
    }

    if (
      formData.discountType ===
        "percentage" &&
      discountValue > 100
    ) {
      setError(
        "Percentage discount cannot exceed 100%."
      );
      return;
    }

    const minimumOrderAmount =
      formData.minimumOrderAmount === ""
        ? 0
        : Number(
            formData.minimumOrderAmount
          );

    if (
      !Number.isFinite(
        minimumOrderAmount
      ) ||
      minimumOrderAmount < 0
    ) {
      setError(
        "Minimum order amount must be 0 or greater."
      );
      return;
    }

    let maximumDiscount = null;

    if (
      formData.discountType ===
      "percentage"
    ) {
      if (
        formData.maximumDiscount !==
          "" &&
        formData.maximumDiscount !==
          null
      ) {
        maximumDiscount = Number(
          formData.maximumDiscount
        );

        if (
          !Number.isFinite(
            maximumDiscount
          ) ||
          maximumDiscount <= 0
        ) {
          setError(
            "Maximum discount must be greater than 0."
          );
          return;
        }
      }
    }

    let usageLimit = null;

    if (
      formData.usageLimit !== "" &&
      formData.usageLimit !== null
    ) {
      usageLimit = Number(
        formData.usageLimit
      );

      if (
        !Number.isInteger(
          usageLimit
        ) ||
        usageLimit <= 0
      ) {
        setError(
          "Usage limit must be a whole number greater than 0."
        );
        return;
      }
    }

    const data = {
      code,

      discountType:
        formData.discountType,

      discountValue,

      minimumOrderAmount,

      maximumDiscount,

      expiryDate:
        formData.expiryDate ||
        null,

      isActive:
        formData.isActive,

      usageLimit,
    };

    try {
      setSaving(true);

      let response;

      if (editingCoupon) {
        response = await api.put(
          `/admin/coupons/${editingCoupon._id}`,
          data
        );
      } else {
        response = await api.post(
          "/admin/coupons",
          data
        );
      }

      if (response.data.success) {
        setSuccess(
          response.data.message ||
            (
              editingCoupon
                ? "Coupon updated successfully."
                : "Coupon created successfully."
            )
        );

        await fetchCoupons();

        setFormData({
          ...emptyForm,
        });

        setEditingCoupon(null);
        setShowForm(false);
      } else {
        setError(
          response.data.message ||
            "Failed to save coupon."
        );
      }
    } catch (error) {
      console.error(
        "Save coupon error:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to save coupon."
      );
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete = async (coupon) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete coupon "${coupon.code}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await api.delete(
        `/admin/coupons/${coupon._id}`
      );

      if (response.data.success) {
        setSuccess(
          "Coupon deleted successfully."
        );

        await fetchCoupons();
      } else {
        setError(
          response.data.message ||
            "Failed to delete coupon."
        );
      }
    } catch (error) {
      console.error(
        "Delete coupon error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to delete coupon."
      );
    }
  };

  // ======================================================
  // TOGGLE STATUS
  // ======================================================

  const handleToggle = async (coupon) => {
    try {
      setError("");
      setSuccess("");

      const expiryDate = coupon.expiryDate
        ? (() => {
            const date = new Date(
              coupon.expiryDate
            );

            if (
              Number.isNaN(
                date.getTime()
              )
            ) {
              return null;
            }

            const year =
              date.getFullYear();

            const month = String(
              date.getMonth() + 1
            ).padStart(2, "0");

            const day = String(
              date.getDate()
            ).padStart(2, "0");

            return `${year}-${month}-${day}`;
          })()
        : null;

      const response = await api.put(
        `/admin/coupons/${coupon._id}`,
        {
          code: coupon.code,

          discountType:
            coupon.discountType,

          discountValue:
            coupon.discountValue,

          minimumOrderAmount:
            coupon.minimumOrderAmount,

          maximumDiscount:
            coupon.maximumDiscount,

          expiryDate,

          isActive:
            !coupon.isActive,

          usageLimit:
            coupon.usageLimit,
        }
      );

      if (response.data.success) {
        setSuccess(
          coupon.isActive
            ? "Coupon disabled."
            : "Coupon enabled."
        );

        await fetchCoupons();
      } else {
        setError(
          response.data.message ||
            "Failed to update coupon."
        );
      }
    } catch (error) {
      console.error(
        "Toggle coupon error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to update coupon."
      );
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="pb-6">

      {/* HEADER */}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
            Coupons
          </h1>

          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Create and manage discount coupons for your store.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="w-full rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto"
        >
          + Create Coupon
        </button>
      </div>

      {/* SUCCESS */}

      {success && (
        <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
          {success}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* FORM */}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 rounded-xl bg-white p-4 shadow-md dark:bg-slate-800 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {editingCoupon
                  ? "Edit Coupon"
                  : "Create Coupon"}
              </h2>

              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Configure the discount and usage rules.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* CODE */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Coupon Code
              </label>

              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                maxLength={50}
                placeholder="WELCOME10"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm uppercase outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* TYPE */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Discount Type
              </label>

              <select
                name="discountType"
                value={
                  formData.discountType
                }
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="percentage">
                  Percentage (%)
                </option>

                <option value="fixed">
                  Fixed Amount
                </option>
              </select>
            </div>

            {/* DISCOUNT VALUE */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Discount Value
              </label>

              <input
                type="number"
                name="discountValue"
                value={
                  formData.discountValue
                }
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                placeholder={
                  formData.discountType ===
                  "percentage"
                    ? "10"
                    : "500"
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />

              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                {formData.discountType ===
                "percentage"
                  ? "Example: 10 means 10% off."
                  : "Example: 500 means 500 currency units off."}
              </p>
            </div>

            {/* MINIMUM */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Minimum Order Amount
              </label>

              <input
                type="number"
                name="minimumOrderAmount"
                value={
                  formData.minimumOrderAmount
                }
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* MAXIMUM */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Maximum Discount
              </label>

              <input
                type="number"
                name="maximumDiscount"
                value={
                  formData.maximumDiscount
                }
                onChange={handleChange}
                min="0.01"
                step="0.01"
                disabled={
                  formData.discountType !==
                  "percentage"
                }
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:disabled:bg-slate-900"
              />

              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Only used for percentage coupons.
              </p>
            </div>

            {/* EXPIRY */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Expiry Date
              </label>

              <input
                type="date"
                name="expiryDate"
                value={
                  formData.expiryDate
                }
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />

              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Leave empty for no expiry.
              </p>
            </div>

            {/* USAGE LIMIT */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Usage Limit
              </label>

              <input
                type="number"
                name="usageLimit"
                value={
                  formData.usageLimit
                }
                onChange={handleChange}
                min="1"
                step="1"
                placeholder="Unlimited"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />

              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Leave empty for unlimited use.
              </p>
            </div>

            {/* ACTIVE */}

            <div className="flex items-center">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-slate-900">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={
                    formData.isActive
                  }
                  onChange={handleChange}
                  className="h-4 w-4 accent-orange-600"
                />

                <span>
                  <span className="block text-sm font-semibold text-gray-800 dark:text-white">
                    Coupon Active
                  </span>

                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Customers can use this coupon.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* BUTTONS */}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingCoupon
                ? "Update Coupon"
                : "Create Coupon"}
            </button>
          </div>
        </form>
      )}

      {/* COUPON LIST */}

      <div className="rounded-xl bg-white shadow-md dark:bg-slate-800">

        <div className="border-b border-gray-100 px-4 py-3 dark:border-slate-700 sm:px-5">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            All Coupons
          </h2>

          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {coupons.length}{" "}
            {coupons.length === 1
              ? "coupon"
              : "coupons"}{" "}
            configured.
          </p>
        </div>

        {loading ? (
          <div className="p-5 text-sm text-orange-600">
            Loading coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl">
              🎟️
            </div>

            <h3 className="mt-3 text-base font-bold text-gray-800 dark:text-white">
              No Coupons Yet
            </h3>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create your first coupon to offer discounts to customers.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">

            {coupons.map((coupon) => {
              const expired =
                coupon.expiryDate &&
                new Date(coupon.expiryDate) <=
                  new Date();

              const usageLimitReached =
                coupon.usageLimit !== null &&
                coupon.usageLimit !==
                  undefined &&
                Number(
                  coupon.usedCount || 0
                ) >=
                  Number(
                    coupon.usageLimit
                  );

              return (
                <div
                  key={coupon._id}
                  className="p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-lg bg-orange-100 px-3 py-1.5 text-sm font-bold tracking-wide text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {coupon.code}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            coupon.isActive &&
                            !expired &&
                            !usageLimitReached
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300"
                          }`}
                        >
                          {expired
                            ? "Expired"
                            : usageLimitReached
                            ? "Limit Reached"
                            : coupon.isActive
                            ? "Active"
                            : "Disabled"}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-2 lg:grid-cols-3">

                        <div>
                          <span className="text-gray-400 dark:text-gray-500">
                            Discount
                          </span>

                          <p className="font-semibold text-gray-800 dark:text-white">
                            {coupon.discountType ===
                            "percentage"
                              ? `${coupon.discountValue}%`
                              : Number(
                                  coupon.discountValue
                                ).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-400 dark:text-gray-500">
                            Minimum Order
                          </span>

                          <p className="font-semibold text-gray-800 dark:text-white">
                            {Number(
                              coupon.minimumOrderAmount ||
                                0
                            ).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-400 dark:text-gray-500">
                            Maximum Discount
                          </span>

                          <p className="font-semibold text-gray-800 dark:text-white">
                            {coupon.maximumDiscount ===
                              null ||
                            coupon.maximumDiscount ===
                              undefined
                              ? "No limit"
                              : Number(
                                  coupon.maximumDiscount
                                ).toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-400 dark:text-gray-500">
                            Expiry
                          </span>

                          <p className="font-semibold text-gray-800 dark:text-white">
                            {formatDate(
                              coupon.expiryDate
                            )}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-400 dark:text-gray-500">
                            Usage
                          </span>

                          <p className="font-semibold text-gray-800 dark:text-white">
                            {coupon.usedCount ||
                              0}{" "}
                            /{" "}
                            {coupon.usageLimit ||
                              "∞"}
                          </p>
                        </div>

                        <div>
                          <span className="text-gray-400 dark:text-gray-500">
                            Created
                          </span>

                          <p className="font-semibold text-gray-800 dark:text-white">
                            {formatDate(
                              coupon.createdAt
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">

                      <button
                        type="button"
                        onClick={() =>
                          handleToggle(
                            coupon
                          )
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
                      >
                        {coupon.isActive
                          ? "Disable"
                          : "Enable"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            coupon
                          )
                        }
                        className="rounded-lg border border-orange-500 px-3 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-500 hover:text-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            coupon
                          )
                        }
                        className="rounded-lg border border-red-500 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500 hover:text-white"
                      >
                        Delete
                      </button>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;