import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

const AdminUserDetails = () => {

  const getProfilePictureUrl = (profilePicture) => {
      if (!profilePicture) return "";
    
      if (profilePicture.startsWith("http")) {
        return profilePicture;
      }
    
      return `http://localhost:5050${profilePicture}`;
    };


  const { id } = useParams();

  // User data
  const [user, setUser] = useState(null);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Error state
  const [error, setError] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });


  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");



  // Fetch user
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
          const fetchedUser = response.data.user;

          setUser(fetchedUser);

          setFormData({
            name: fetchedUser.name || "",
            email: fetchedUser.email || "",
            password: "",
            role: fetchedUser.role || "customer",
          });
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

  // Handle input
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };


   // Handle profile picture change
     const handleProfilePictureChange = (e) => {
       const file = e.target.files?.[0];
     
       if (!file) {
         return;
       }
     
       if (!file.type.startsWith("image/")) {
         setError("Please select a valid image file.");
         return;
       }
     
       if (file.size > 5 * 1024 * 1024) {
         setError("Profile picture must be smaller than 5MB.");
         return;
       }
     
       setProfilePictureFile(file);
       setError("");
     
       const previewUrl = URL.createObjectURL(file);
       setProfilePicturePreview(previewUrl);
     };


  // Save user
     const handleSave = async (event) => {
     event.preventDefault();
   
     try {
       setSaving(true);
       setError("");
   
       const formDataToSend = new FormData();
   
       formDataToSend.append("name", formData.name);
       formDataToSend.append("email", formData.email);
       formDataToSend.append("password", formData.password);
       formDataToSend.append("role", formData.role);
   
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
         setUser(response.data.user);
   
         setFormData({
           name: response.data.user.name || "",
           email: response.data.user.email || "",
           password: "",
           role:
             response.data.user.role ||
             "customer",
         });
   
         setProfilePictureFile(null);
   
         if (response.data.user.profilePicture) {
           setProfilePicturePreview(
             getProfilePictureUrl(
               response.data.user.profilePicture
             )
           );
         } else {
           setProfilePicturePreview("");
         }
   
         setEditing(false);
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

  // Cancel edit
  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "customer",
    });

    setProfilePictureFile(null);

    setProfilePicturePreview(
      user.profilePicture
        ? getProfilePictureUrl(user.profilePicture)
        : ""
    );

    setEditing(false);
    setError("");
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8">
        <p className="text-orange-600">
          Loading user details...
        </p>
      </div>
    );
  }

  // Error state
  if (error && !user) {
    return (
      <div>
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-5 mb-6">
          {error}
        </div>

        <Link
          to="/admin/users"
          className="inline-block rounded-lg bg-gray-800 px-5 py-3 text-white hover:bg-gray-700"
        >
          ← Back to Users
        </Link>
      </div>
    );
  }

  // User not found
  if (!user) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8">
        <p className="text-gray-500">
          User not found.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            User Details
          </h1>

          <p className="text-gray-500 mt-2">
            User ID: {user._id}
          </p>
        </div>

        <div className="flex gap-3">
          {/* Edit button */}
          {!editing && (
            <button
              onClick={() => {
                        setEditing(true);
                      
                        setProfilePictureFile(null);
                      
                        setProfilePicturePreview(
                          user.profilePicture
                            ? getProfilePictureUrl(user.profilePicture)
                            : ""
                        );
                      }}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              ✏️ Edit User
            </button>
          )}

          <Link
            to="/admin/users"
            className="rounded-lg bg-gray-800 px-5 py-3 text-sm font-medium text-white hover:bg-gray-700"
          >
            ← Back to Users
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      {editing ? (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-slate-800 rounded-xl shadow p-6"
        >
          <h2 className="text-xl font-bold dark:text-white mb-6">
            Edit User
          </h2>

              {/* Profile Picture */}
               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                   Profile Picture
                 </label>
               
                 <div className="flex items-center gap-5">
                   {profilePicturePreview ? (
                     <img
                       src={profilePicturePreview}
                       alt="Profile Preview"
                       className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                     />
                   ) : (
                     <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-300">
                       {user.name?.charAt(0)?.toUpperCase() || "U"}
                     </div>
                   )}
               
                   <div>
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleProfilePictureChange}
                       className="block w-full text-sm text-gray-700 dark:text-gray-300
                                  file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                                  file:text-sm file:font-semibold file:bg-blue-600 file:text-white
                                  hover:file:bg-blue-700 dark:file:bg-blue-500 dark:hover:file:bg-blue-600
                                  cursor-pointer"
                     />
               
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                       Select a new image to change the profile picture. Maximum 5MB.
                     </p>
                   </div>
                 </div>
               </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                User ID
              </label>

              <input
                type="text"
                value={user._id}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500 cursor-not-allowed"
              />

              <p className="text-xs text-gray-500 mt-1">
                User ID cannot be changed.
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                New Password
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Role
              </label>

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
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

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
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
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              ❌ Cancel
            </button>
          </div>
        </form>
      ) : (
        /* View mode */
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">

              {/* Profile Picture */}
                  <div className="flex items-center gap-5 mb-8">
                    {user.profilePicture ? (
                      <img
                        src={getProfilePictureUrl(user.profilePicture)}
                        alt={user.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-gray-300">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Profile Picture
                      </p>
                  
                      <p className="text-lg font-semibold mt-1 dark:text-white">
                        {user.name}
                      </p>
                    </div>
                  </div>

          <h2 className="text-xl font-bold dark:text-white mb-6">
            Account Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User ID */}
            <div>
              <p className="text-sm text-gray-500">
                User ID
              </p>

              <p className="font-mono font-medium mt-1 break-all dark:text-white">
                {user._id}
              </p>
            </div>

            {/* Name */}
            <div>
              <p className="text-sm text-gray-500">
                Name
              </p>

              <p className="font-medium mt-1 dark:text-white">
                {user.name}
              </p>
            </div>

            {/* Email */}
            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="font-medium mt-1 dark:text-white">
                {user.email}
              </p>
            </div>

            {/* Role */}
            <div>
              <p className="text-sm text-gray-500">
                Role
              </p>

              <span
                className={`inline-flex mt-1 rounded-full px-3 py-1 text-sm font-medium ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                }`}
              >
                {user.role || "customer"}
              </span>
            </div>

            {/* Created */}
            <div>
              <p className="text-sm text-gray-500">
                Registered
              </p>

              <p className="font-medium mt-1 dark:text-white">
                {new Date(
                  user.createdAt
                ).toLocaleString()}
              </p>
            </div>

            {/* Updated */}
            <div>
              <p className="text-sm text-gray-500">
                Last Updated
              </p>

              <p className="font-medium mt-1 dark:text-white">
                {new Date(
                  user.updatedAt
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserDetails;