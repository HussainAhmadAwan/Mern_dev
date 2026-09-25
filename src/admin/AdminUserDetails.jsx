import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { getImageUrl } from "../api/config";

const AdminUserDetails = () => {
  const { id } = useParams();

  // ==========================================
  // USER DATA
  // ==========================================

  const [user, setUser] = useState(null);

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // EDIT MODE
  // ==========================================

  const [editing, setEditing] = useState(false);

  // ==========================================
  // SAVING STATE
  // ==========================================

  const [saving, setSaving] = useState(false);

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  // ==========================================
  // PROFILE PICTURE
  // ==========================================

  const [profilePictureFile, setProfilePictureFile] =
    useState(null);

  const [profilePicturePreview, setProfilePicturePreview] =
    useState("");

  // ==========================================
  // FETCH USER
  // ==========================================

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/admin/users/${id}`
        );

        console.log(
          "User Details:",
          response.data
        );

        if (response.data.success) {
          const fetchedUser =
            response.data.user;

          setUser(fetchedUser);

          setFormData({
            name: fetchedUser.name || "",
            email: fetchedUser.email || "",
            password: "",
            role:
              fetchedUser.role ||
              "customer",
          });

          setProfilePictureFile(null);

          setProfilePicturePreview(
            fetchedUser.profilePicture
              ? getImageUrl(
                  fetchedUser.profilePicture
                )
              : ""
          );
        } else {
          setError(
            response.data.message ||
              "Failed to load user details."
          );
        }
      } catch (error) {
        console.error(
          "Failed to load user:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load user details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };

  // ==========================================
  // HANDLE PROFILE PICTURE CHANGE
  // ==========================================

  const handleProfilePictureChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile picture must be smaller than 5MB."
      );

      event.target.value = "";
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

  // ==========================================
  // SAVE USER
  // ==========================================

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

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

      formDataToSend.append(
        "role",
        formData.role
      );

      if (profilePictureFile) {
        formDataToSend.append(
          "profilePicture",
          profilePictureFile
        );
      }

      const response = await api.put(
        `/admin/users/${id}`,
        formDataToSend
      );

      console.log(
        "Updated User:",
        response.data
      );

      if (response.data.success) {
        const updatedUser =
          response.data.user;

        setUser(updatedUser);

        setFormData({
          name:
            updatedUser.name || "",
          email:
            updatedUser.email || "",
          password: "",
          role:
            updatedUser.role ||
            "customer",
        });

        setProfilePictureFile(null);

        setProfilePicturePreview(
          updatedUser.profilePicture
            ? getImageUrl(
                updatedUser.profilePicture
              )
            : ""
        );

        setEditing(false);
      } else {
        setError(
          response.data.message ||
            "Failed to update user."
        );
      }
    } catch (error) {
      console.error(
        "Failed to update user:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role:
        user.role ||
        "customer",
    });

    setProfilePictureFile(null);

    setProfilePicturePreview(
      user.profilePicture
        ? getImageUrl(
            user.profilePicture
          )
        : ""
    );

    setEditing(false);
    setError("");
  };

  // ==========================================
  // CLEANUP OBJECT URL
  // ==========================================

  useEffect(() => {
    return () => {
      if (
        profilePicturePreview &&
        profilePicturePreview.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          profilePicturePreview
        );
      }
    };
  }, [profilePicturePreview]);

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white p-6 shadow dark:bg-slate-800 sm:p-8">
        <p className="text-orange-600">
          Loading user details...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error && !user) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <div className="mb-6 break-words rounded-xl border border-red-300 bg-red-100 p-5 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>

        <Link
          to="/admin/users"
          className="inline-flex items-center rounded-lg bg-gray-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          ← Back to Users
        </Link>
      </div>
    );
  }

  // ==========================================
  // USER NOT FOUND
  // ==========================================

  if (!user) {
    return (
      <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white p-6 shadow dark:bg-slate-800 sm:p-8">
        <p className="text-gray-500 dark:text-gray-400">
          User not found.
        </p>

        <Link
          to="/admin/users"
          className="mt-5 inline-flex items-center rounded-lg bg-gray-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden lg:space-y-8">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
            User Details
          </h1>

          <p className="mt-2 break-all text-sm text-gray-500 dark:text-gray-400">
            User ID: {user._id}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
          {/* Edit Button */}

          {!editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(true);

                setProfilePictureFile(
                  null
                );

                setProfilePicturePreview(
                  user.profilePicture
                    ? getImageUrl(
                        user.profilePicture
                      )
                    : ""
                );

                setError("");
              }}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              ✏️ Edit User
            </button>
          )}

          {/* Back */}

          <Link
            to="/admin/users"
            className="rounded-lg bg-gray-800 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-700"
          >
            ← Back to Users
          </Link>
        </div>
      </div>

      {/* ==========================================
          ERROR MESSAGE
      ========================================== */}

      {error && (
        <div className="break-words rounded-xl border border-red-300 bg-red-100 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* ==========================================
          EDIT MODE
      ========================================== */}

      {editing ? (
        <form
          onSubmit={handleSave}
          className="w-full min-w-0 overflow-hidden rounded-xl bg-white p-5 shadow dark:bg-slate-800 sm:p-6 lg:p-8"
        >
          <h2 className="mb-6 break-words text-xl font-bold text-gray-800 dark:text-white">
            Edit User
          </h2>

          {/* ==========================================
              PROFILE PICTURE
          ========================================== */}

          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Profile Picture
            </label>

            <div className="flex min-w-0 flex-col items-start gap-5 sm:flex-row sm:items-center">
              {profilePicturePreview ? (
                <img
                  src={
                    profilePicturePreview
                  }
                  alt="Profile Preview"
                  className="h-24 w-24 shrink-0 rounded-full border-2 border-gray-300 object-cover dark:border-gray-600"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {user.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "U"}
                </div>
              )}

              <div className="min-w-0 w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleProfilePictureChange
                  }
                  className="block w-full max-w-full cursor-pointer text-sm text-gray-700 dark:text-gray-300
                             file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600
                             file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white
                             hover:file:bg-blue-700 dark:file:bg-blue-500 dark:hover:file:bg-blue-600"
                />

                <p className="mt-2 break-words text-xs text-gray-500 dark:text-gray-400">
                  Select a new image to change
                  the profile picture. Maximum
                  5MB.
                </p>
              </div>
            </div>
          </div>

          {/* ==========================================
              FORM FIELDS
          ========================================== */}

          <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">

            {/* User ID */}

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                User ID
              </label>

              <input
                type="text"
                value={user._id}
                disabled
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500 outline-none cursor-not-allowed dark:border-gray-600 dark:bg-slate-700 dark:text-gray-400"
              />

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                User ID cannot be changed.
              </p>
            </div>

            {/* Name */}

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Email */}

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Password */}

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                New Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              />

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave blank if you do not want to
                change the password.
              </p>
            </div>

            {/* Role */}

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Role
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              >
                <option
                  value="customer"
                  className="bg-white text-gray-800 dark:bg-slate-700 dark:text-white"
                >
                  Customer
                </option>

                <option
                  value="admin"
                  className="bg-white text-gray-800 dark:bg-slate-700 dark:text-white"
                >
                  Admin
                </option>
              </select>
            </div>
          </div>

          {/* ==========================================
              BUTTONS
          ========================================== */}

          <div className="mt-8 flex min-w-0 flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "💾 Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ❌ Cancel
            </button>
          </div>
        </form>
      ) : (

        /* ==========================================
           VIEW MODE
        ========================================== */

        <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white p-5 shadow dark:bg-slate-800 sm:p-6 lg:p-8">

          {/* ==========================================
              PROFILE PICTURE
          ========================================== */}

          <div className="mb-8 flex min-w-0 flex-col items-start gap-5 sm:flex-row sm:items-center">
            {user.profilePicture ? (
              <img
                src={getImageUrl(
                  user.profilePicture
                )}
                alt={
                  user.name ||
                  "User Profile"
                }
                className="h-24 w-24 shrink-0 rounded-full border-2 border-gray-300 object-cover dark:border-gray-600"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {user.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "U"}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Profile Picture
              </p>

              <p className="mt-1 break-words text-lg font-semibold text-gray-800 dark:text-white">
                {user.name}
              </p>
            </div>
          </div>

          {/* ==========================================
              ACCOUNT INFORMATION
          ========================================== */}

          <h2 className="mb-6 break-words text-xl font-bold text-gray-800 dark:text-white">
            Account Information
          </h2>

          <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">

            {/* User ID */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                User ID
              </p>

              <p className="mt-1 break-all font-mono font-medium text-gray-800 dark:text-white">
                {user._id}
              </p>
            </div>

            {/* Name */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Name
              </p>

              <p className="mt-1 break-words font-medium text-gray-800 dark:text-white">
                {user.name || "N/A"}
              </p>
            </div>

            {/* Email */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Email
              </p>

              <p className="mt-1 break-all font-medium text-gray-800 dark:text-white">
                {user.email || "N/A"}
              </p>
            </div>

            {/* Role */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Role
              </p>

              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {user.role ||
                  "customer"}
              </span>
            </div>

            {/* Created */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Registered
              </p>

              <p className="mt-1 break-words font-medium text-gray-800 dark:text-white">
                {user.createdAt
                  ? new Date(
                      user.createdAt
                    ).toLocaleString()
                  : "N/A"}
              </p>
            </div>

            {/* Updated */}

            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last Updated
              </p>

              <p className="mt-1 break-words font-medium text-gray-800 dark:text-white">
                {user.updatedAt
                  ? new Date(
                      user.updatedAt
                    ).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetails;