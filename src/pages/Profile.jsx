import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";
import api from "../api/axios";

const Profile = () => {
  const {
    user,
    setUser,
  } = useAuth();

  // =========================================================
  // API / IMAGE URL HELPER
  // =========================================================

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5050";

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "";
    }

    // External image URL
    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://") ||
      imagePath.startsWith("data:")
    ) {
      return imagePath;
    }

    // Uploaded backend image
    if (
      imagePath.startsWith("/uploads/") ||
      imagePath.startsWith("uploads/")
    ) {
      const cleanPath = imagePath.startsWith("/")
        ? imagePath
        : `/${imagePath}`;

      return `${API_BASE_URL}${cleanPath}`;
    }

    return imagePath;
  };

  // =========================================================
  // EDIT MODE
  // =========================================================

  const [editing, setEditing] =
    useState(false);

  // =========================================================
  // SAVING
  // =========================================================

  const [saving, setSaving] =
    useState(false);

  // =========================================================
  // MESSAGES
  // =========================================================

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // =========================================================
  // ORDER HISTORY
  // =========================================================

  const [orders, setOrders] =
    useState([]);

  const [
    expandedOrderId,
    setExpandedOrderId,
  ] = useState(null);

  const [
    ordersLoading,
    setOrdersLoading,
  ] = useState(true);

  const [
    ordersError,
    setOrdersError,
  ] = useState("");

  // =========================================================
  // PROFILE PICTURE
  // =========================================================

  const [
    profilePictureFile,
    setProfilePictureFile,
  ] = useState(null);

  const [
    profilePicturePreview,
    setProfilePicturePreview,
  ] = useState(
    user?.profilePicture
      ? getImageUrl(
          user.profilePicture
        )
      : ""
  );

  // =========================================================
  // FORM DATA
  // =========================================================

  const [formData, setFormData] =
    useState({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
    });

  // =========================================================
  // FETCH MY ORDERS
  // =========================================================

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError("");

        const response =
          await api.get(
            "/orders/my-orders"
          );

        if (response.data.success) {
          setOrders(
            response.data.orders || []
          );
        }
      } catch (error) {
        console.error(
          "Fetch My Orders Error:",
          error
        );

        setOrdersError(
          error.response?.data?.message ||
            "Failed to load your order history."
        );
      } finally {
        setOrdersLoading(false);
      }
    };

    if (user) {
      fetchMyOrders();
    } else {
      setOrders([]);
      setOrdersLoading(false);
    }
  }, [user]);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };

  // =========================================================
  // HANDLE PROFILE PICTURE
  // =========================================================

  const handleProfilePictureChange =
    (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        setError(
          "Please select a valid image file."
        );

        return;
      }

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        setError(
          "Profile picture must be smaller than 5MB."
        );

        return;
      }

      setProfilePictureFile(file);
      setError("");

      const previewUrl =
        URL.createObjectURL(file);

      setProfilePicturePreview(
        previewUrl
      );
    };

  // =========================================================
  // START EDITING
  // =========================================================

  const handleEdit = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
    });

    setProfilePictureFile(null);

    setProfilePicturePreview(
      user?.profilePicture
        ? getImageUrl(
            user.profilePicture
          )
        : ""
    );

    setError("");
    setSuccess("");
    setEditing(true);
  };

  // =========================================================
  // CANCEL EDITING
  // =========================================================

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
    });

    setProfilePictureFile(null);

    setProfilePicturePreview(
      user?.profilePicture
        ? getImageUrl(
            user.profilePicture
          )
        : ""
    );

    setError("");
    setSuccess("");
    setEditing(false);
  };

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const formDataToSend =
        new FormData();

      formDataToSend.append(
        "name",
        formData.name
      );

      formDataToSend.append(
        "email",
        formData.email
      );

      formDataToSend.append(
        "password",
        formData.password
      );

      if (profilePictureFile) {
        formDataToSend.append(
          "profilePicture",
          profilePictureFile
        );
      }

      const response =
        await api.put(
          "/profile",
          formDataToSend
        );

      if (response.data.success) {
        const updatedUser =
          response.data.user;

        // Update AuthContext
        setUser(updatedUser);

        // Update localStorage
        localStorage.setItem(
          "user",
          JSON.stringify(
            updatedUser
          )
        );

        // Clear password
        setFormData({
          name:
            updatedUser.name || "",
          email:
            updatedUser.email || "",
          password: "",
        });

        // Reset profile picture
        setProfilePictureFile(
          null
        );

        setProfilePicturePreview(
          updatedUser.profilePicture
            ? getImageUrl(
                updatedUser.profilePicture
              )
            : ""
        );

        setSuccess(
          "Profile updated successfully."
        );

        setEditing(false);
      }
    } catch (error) {
      console.error(
        "Profile Update Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // USER NOT LOGGED IN
  // =========================================================

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            You are not logged in.
          </h1>

          <Link
            to="/Login"
            className="inline-block rounded-lg bg-orange-600 px-5 py-3 text-white hover:bg-orange-700"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 py-12 px-4">
      <div className="mx-auto max-w-3xl">

        {/* =================================================
            PAGE HEADER
        ================================================== */}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              My Profile
            </h1>

            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Manage your account information.
            </p>
          </div>

          {!editing && (
            <button
              onClick={handleEdit}
              className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* =================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-100 p-4 text-green-700">
            {success}
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            PROFILE CARD
        ================================================== */}

        <div className="overflow-hidden rounded-xl bg-white shadow dark:bg-slate-800">

          {/* Profile Header */}

          <div className="bg-orange-600 px-6 py-8">
            <div className="flex items-center gap-5">

              {/* Profile Picture */}

              {user.profilePicture ? (
                <img
                  src={getImageUrl(
                    user.profilePicture
                  )}
                  alt={user.name}
                  className="h-20 w-20 rounded-full object-cover border-4 border-white shadow"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow">
                  {user.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "U"}
                </div>
              )}

              {/* User Name */}

              <div>
                <h2 className="text-2xl font-bold text-white">
                  {user.name}
                </h2>

                <p className="mt-1 text-orange-100">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              EDIT MODE
          ================================================== */}

          {editing ? (
            <form
              onSubmit={handleSave}
              className="p-6"
            >
              <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white">
                Edit Profile
              </h2>

              {/* Profile Picture */}

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                  Profile Picture
                </label>

                <div className="flex items-center gap-5">
                  {profilePicturePreview ? (
                    <img
                      src={
                        profilePicturePreview
                      }
                      alt="Profile Preview"
                      className="h-24 w-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-2xl font-bold text-gray-600 dark:text-gray-300">
                      {user.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "U"}
                    </div>
                  )}

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleProfilePictureChange
                      }
                      className="block w-full text-sm text-gray-700 dark:text-gray-300
                                 file:mr-4 file:rounded-lg file:border-0
                                 file:bg-blue-600 file:px-4 file:py-2
                                 file:text-sm file:font-semibold
                                 file:text-white
                                 hover:file:bg-blue-700
                                 cursor-pointer"
                    />

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Maximum size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">

                {/* NAME */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={
                      handleChange
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                {/* PASSWORD */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                    New Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Leave blank to keep current password"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              {/* BUTTONS */}

              <div className="mt-8 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "💾 Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  disabled={saving}
                  className="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          ) : (

            /* =================================================
               VIEW MODE
            ================================================== */

            <div className="p-6">
              <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white">
                Account Information
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* NAME */}

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Full Name
                  </p>

                  <p className="mt-1 font-medium text-gray-800 dark:text-white">
                    {user.name}
                  </p>
                </div>

                {/* EMAIL */}

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email Address
                  </p>

                  <p className="mt-1 font-medium text-gray-800 dark:text-white">
                    {user.email}
                  </p>
                </div>

                {/* ROLE */}

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Account Type
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      user.role ===
                      "admin"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {user.role ||
                      "customer"}
                  </span>
                </div>

                {/* USER ID */}

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    User ID
                  </p>

                  <p className="mt-1 break-all font-mono text-sm text-gray-800 dark:text-white">
                    {user._id}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================
            ORDER HISTORY
        ================================================== */}

        <div className="mt-8">

          {/* Order History Header */}

          <div className="mb-4 px-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
              Order History
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View and manage your previous orders.
            </p>
          </div>

          {/* Loading */}

          {ordersLoading && (
            <div className="rounded-xl bg-white p-6 text-center shadow dark:bg-slate-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading your orders...
              </p>
            </div>
          )}

          {/* Error */}

          {!ordersLoading &&
            ordersError && (
              <div className="rounded-xl border border-red-300 bg-red-100 p-4 text-center text-sm text-red-700">
                {ordersError}
              </div>
            )}

          {/* No Orders */}

          {!ordersLoading &&
            !ordersError &&
            orders.length === 0 && (
              <div className="rounded-xl bg-white p-8 text-center shadow dark:bg-slate-800">

                <div className="text-4xl">
                  📦
                </div>

                <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-white">
                  No orders yet
                </h3>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your orders will appear here after you place an order.
                </p>

                <Link
                  to="/Product_page"
                  className="mt-4 inline-block rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-700"
                >
                  Start Shopping
                </Link>
              </div>
            )}

          {/* Orders */}

          {!ordersLoading &&
            !ordersError &&
            orders.length > 0 && (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isExpanded =
                    expandedOrderId ===
                    order._id;

                  return (
                    <div
                      key={order._id}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-800"
                    >

                      {/* Compact Order Header */}

                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:items-center">

                          {/* Order ID */}

                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Order ID
                            </p>

                            <p className="mt-1 truncate font-mono text-sm font-bold text-orange-600">
                              #
                              {order.orderId ||
                                "N/A"}
                            </p>
                          </div>

                          {/* Date */}

                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Order Date
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                              {new Date(
                                order.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Status */}

                          <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Status
                            </p>

                            <span
                              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                order.status ===
                                "Delivered"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                  : order.status ===
                                    "Shipped"
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                  : order.status ===
                                    "Cancelled"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  : order.status ===
                                    "Processing"
                                  ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>

                          {/* View Details */}

                          <div className="col-span-2 sm:col-span-1 sm:text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(
                                  isExpanded
                                    ? null
                                    : order._id
                                )
                              }
                              className="w-full rounded-lg border border-orange-500 px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-500 hover:text-white sm:w-auto"
                            >
                              {isExpanded
                                ? "Hide Details ↑"
                                : "View Details ↓"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Order Details */}

                      {isExpanded && (
                        <div className="border-t border-gray-200 dark:border-gray-700">

                          {/* Order Information */}

                          <div className="grid grid-cols-1 gap-4 bg-gray-50 px-4 py-4 dark:bg-slate-700/50 sm:grid-cols-2">

                            {/* Payment */}

                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Payment Method
                              </p>

                              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                                {order.paymentMethod ||
                                  "N/A"}
                              </p>
                            </div>

                            {/* Total Products */}

                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Total Products
                              </p>

                              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
                                {order.totalItems}{" "}
                                {order.totalItems ===
                                1
                                  ? "product"
                                  : "products"}
                              </p>
                            </div>

                            {/* Shipping Address */}

                            <div className="sm:col-span-2">
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Shipping Address
                              </p>

                              <p className="mt-1 text-sm text-gray-800 dark:text-white">
                                {order.customer
                                  ?.address ||
                                  "N/A"}

                                {order.customer
                                  ?.city
                                  ? `, ${order.customer.city}`
                                  : ""}

                                {order.customer
                                  ?.zipCode
                                  ? ` - ${order.customer.zipCode}`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          {/* Products */}

                          <div className="px-4 py-3">
                            <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white">
                              Products
                            </p>

                            <div className="space-y-2">
                              {order.items.map(
                                (
                                  item,
                                  index
                                ) => (
                                  <div
                                    key={`${order._id}-${index}`}
                                    className="flex items-center gap-3 rounded-lg bg-gray-50 p-2.5 dark:bg-slate-700"
                                  >

                                    {/* Product Image */}

                                    {item.image ? (
                                      <img
                                        src={getImageUrl(
                                          item.image
                                        )}
                                        alt={
                                          item.name
                                        }
                                        className="h-12 w-12 shrink-0 rounded-lg border object-cover"
                                        onError={(
                                          event
                                        ) => {
                                          event.currentTarget.style.display =
                                            "none";
                                        }}
                                      />
                                    ) : (
                                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-sm dark:bg-gray-600">
                                        📦
                                      </div>
                                    )}

                                    {/* Product Information */}

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-medium text-gray-800 dark:text-white">
                                        {
                                          item.name
                                        }
                                      </p>

                                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                        Quantity:{" "}
                                        {
                                          item.quantity
                                        }
                                      </p>
                                    </div>

                                    {/* Product Price */}

                                    <p className="shrink-0 text-sm font-semibold text-orange-600">
                                      $
                                      {(
                                        Number(
                                          item.price
                                        ) *
                                        item.quantity
                                      ).toFixed(
                                        2
                                      )}
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Order Footer */}

                          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">

                            {/* Cancel Button */}

                            {(order.status ===
                              "Pending" ||
                              order.status ===
                                "Processing") && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const confirmCancel =
                                    window.confirm(
                                      "Are you sure you want to cancel this order?"
                                    );

                                  if (
                                    !confirmCancel
                                  ) {
                                    return;
                                  }

                                  try {
                                    const response =
                                      await api.put(
                                        `/orders/${order._id}/cancel`
                                      );

                                    if (
                                      response
                                        .data
                                        .success
                                    ) {
                                      setOrders(
                                        (
                                          previousOrders
                                        ) =>
                                          previousOrders.map(
                                            (
                                              previousOrder
                                            ) =>
                                              previousOrder._id ===
                                              order._id
                                                ? response
                                                    .data
                                                    .order
                                                : previousOrder
                                          )
                                      );

                                      setSuccess(
                                        "Order cancelled successfully."
                                      );

                                      setTimeout(
                                        () => {
                                          setSuccess(
                                            ""
                                          );
                                        },
                                        3000
                                      );
                                    }
                                  } catch (
                                    error
                                  ) {
                                    console.error(
                                      "Cancel Order Error:",
                                      error
                                    );

                                    setError(
                                      error
                                        .response
                                        ?.data
                                        ?.message ||
                                        "Failed to cancel order."
                                    );

                                    setTimeout(
                                      () => {
                                        setError(
                                          ""
                                        );
                                      },
                                      3000
                                    );
                                  }
                                }}
                                className="w-full rounded-lg border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white sm:w-auto"
                              >
                                Cancel Order
                              </button>
                            )}

                            {/* Total */}

                            <p className="text-base font-bold text-orange-600 sm:text-lg sm:text-right">
                              Total: $
                              {Number(
                                order.totalPrice
                              ).toFixed(
                                2
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* =================================================
            BACK BUTTON
        ================================================== */}

        <div className="mt-6">
          <Link
            to="/"
            className="inline-block rounded-lg bg-gray-800 px-5 py-3 font-medium text-white transition hover:bg-gray-700"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Profile;