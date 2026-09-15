import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  // Undo deleted user
  const [deletedUser, setDeletedUser] = useState(null);
  const [undoing, setUndoing] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  //user loads after restore
  const [activeTab, setActiveTab] = useState("admins");
  



  // ========================================================
  // ADD USER
  // ========================================================
  
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });
  
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  
  const [addingUser, setAddingUser] = useState(false);
  
  const [addUserError, setAddUserError] = useState("");
  
  const [addUserSuccess, setAddUserSuccess] = useState("");

  //profile image
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return "";
  
    if (profilePicture.startsWith("http")) {
      return profilePicture;
    }
  
    return `http://localhost:5050${profilePicture}`;
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/users");

        console.log("Admin Users:", response.data);

        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (error) {
        console.error("Failed to load users:", error);

        setError(
          error.response?.data?.message ||
            "Failed to load users."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Delete user
  const deleteUser = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );
  
    if (!confirmed) {
      return;
    }
  
    try {
      setDeleting(true);
      setError("");
  
      const response = await api.delete(
        `/admin/users/${userId}`
      );
  
      console.log(
        "Delete User:",
        response.data
      );
  
      if (response.data.success) {
        const deletedUserData = users.find(
          (user) => user._id === userId
        );
  
        setDeletedUser(deletedUserData);
  
       setUsers((previousUsers) =>
         previousUsers.map((user) =>
           user._id === userId
             ? {
                 ...user,
                 isDeleted: true,
                 deletedAt: new Date().toISOString(),
               }
             : user
         )
       );
      }
    } catch (error) {
      console.error(
        "Failed to delete user:",
        error
      );
  
      setError(
        error.response?.data?.message ||
          "Failed to delete user."
      );
    } finally {
      setDeleting(false);
    }
  };
 
 
  // Undo deleted user
  const undoDelete = async () => {
    if (!deletedUser) {
      return;
    }
  
    try {
      setUndoing(true);
      setError("");
  
      const response = await api.put(
        `/admin/users/${deletedUser._id}/restore`
      );
  
      console.log(
        "Restore User:",
        response.data
      );
  
      if (response.data.success) {
        setUsers((previousUsers) => [
          response.data.user,
          ...previousUsers,
        ]);
  
        setDeletedUser(null);
      }
    } catch (error) {
      console.error(
        "Failed to restore user:",
        error
      );
  
      setError(
        error.response?.data?.message ||
          "Failed to restore user."
      );
    } finally {
      setUndoing(false);
    }
  };


  // Restore user from Deleted Users tab
      const restoreUser = async (userId) => {
        try {
          setRestoringId(userId);
          setError("");
      
          const response = await api.put(
            `/admin/users/${userId}/restore`
          );
      
          console.log(
            "Restore User:",
            response.data
          );
      
          if (response.data.success) {
            setUsers((previousUsers) =>
              previousUsers.map((user) =>
                user._id === userId
                  ? response.data.user
                  : user
              )
            );
            setDeletedUser(null);
          }
        } catch (error) {
          console.error(
            "Failed to restore user:",
            error
          );
      
          setError(
            error.response?.data?.message ||
              "Failed to restore user."
          );
        } finally {
          setRestoringId(null);
        }
      };

  

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8">
        <p className="text-orange-600">
          Loading users...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-5">
        {error}
      </div>
    );
  }

   
   // ========================================================
   // HANDLE NEW USER INPUT
   // ========================================================
   
   const handleNewUserChange = (e) => {
   
     const { name, value } = e.target;
   
     setNewUser((prev) => ({
       ...prev,
       [name]: value,
     }));
   
   };


   // ========================================================
   // HANDLE PROFILE PICTURE
   // ========================================================
   
   const handleProfilePictureChange = (e) => {
   
     const file = e.target.files?.[0];
   
     if (!file) {
       return;
     }
   
   
     // ------------------------------------------
     // Check image type
     // ------------------------------------------
   
     if (!file.type.startsWith("image/")) {
   
       setAddUserError(
         "Please select a valid image file."
       );
   
       return;
     }
   
   
     // ------------------------------------------
     // Check file size
     // ------------------------------------------
   
     if (file.size > 5 * 1024 * 1024) {
   
       setAddUserError(
         "Profile picture must be smaller than 5MB."
       );
   
       return;
     }
   
   
     // ------------------------------------------
     // Store file
     // ------------------------------------------
   
     setProfilePictureFile(file);
   
     setAddUserError("");
   
   
     // ------------------------------------------
     // Create preview
     // ------------------------------------------
   
     const previewUrl =
       URL.createObjectURL(file);
   
     setProfilePicturePreview(previewUrl);
   
   };


    // ========================================================
    // CREATE NEW USER
    // ========================================================
    
    const handleAddUser = async (e) => {
    
      e.preventDefault();
    
      setAddUserError("");
      setAddUserSuccess("");
      setAddingUser(true);
    
    
      try {
    
        // ------------------------------------------
        // Create FormData
        // ------------------------------------------
    
        const formData = new FormData();
    
        formData.append(
          "name",
          newUser.name
        );
    
        formData.append(
          "email",
          newUser.email
        );
    
        formData.append(
          "password",
          newUser.password
        );
    
        formData.append(
          "role",
          newUser.role
        );
    
    
        // ------------------------------------------
        // Add profile picture if selected
        // ------------------------------------------
    
        if (profilePictureFile) {
    
          formData.append(
            "profilePicture",
            profilePictureFile
          );
    
        }
    
    
        // ------------------------------------------
        // Send request
        // ------------------------------------------
    
        // const response = await axios.post(
        //   "http://localhost:5050/admin/users",
        //   formData
        // );

        const response = await api.post(
          "/admin/users",
          formData
        );
    
    
        // ------------------------------------------
        // Success
        // ------------------------------------------
    
        if (response.data.success) {
    
          setAddUserSuccess(
            "User created successfully."
          );
    
    
          // Add new user to current list
          setUsers((prevUsers) => [
            response.data.user,
            ...prevUsers,
          ]);
    
    
          // Reset form
          setNewUser({
            name: "",
            email: "",
            password: "",
            role: "customer",
          });
    
          setProfilePictureFile(null);
    
          setProfilePicturePreview("");
    
        }
    
      } catch (error) {
    
        console.error(
          "Create User Error:",
          error
        );
    
        setAddUserError(
          error.response?.data?.message ||
          "Failed to create user."
        );
    
      } finally {
    
        setAddingUser(false);
    
      }
    
    };

    //shows user admin/customer/deleted
    const filteredUsers = users.filter((user) => {
      if (activeTab === "deleted") {
        return user.isDeleted === true;
      }
    
      if (activeTab === "admins") {
        return user.role === "admin" && user.isDeleted !== true;
      }
    
      if (activeTab === "customers") {
        return user.role === "customer" && user.isDeleted !== true;
      }
    
      return false;
    });


  return (
    <div>
      {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
       
         <div>
           <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
             Users Management
           </h1>
       
           <p className="text-gray-500 dark:text-gray-400 mt-2">
             Manage registered users.
           </p>
         </div>
       
         <button
           type="button"
           onClick={() => {
             setShowAddUserForm(true);
             setAddUserError("");
             setAddUserSuccess("");
           }}
           className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
         >
           + Add User
         </button>
       
       </div>


       {/* Deleted User / Undo */}
       {deletedUser && (
         <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-orange-300 bg-orange-50 px-5 py-4 dark:border-orange-700 dark:bg-orange-900/20">
       
           <div>
             <p className="font-medium text-orange-800 dark:text-orange-200">
               User "{deletedUser.name}" was deleted.
             </p>
       
             <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
               You can restore this user now.
             </p>
           </div>
       
           <button
             type="button"
             onClick={undoDelete}
             disabled={undoing}
             className="shrink-0 rounded-lg bg-orange-600 px-5 py-2 font-medium text-white transition hover:bg-orange-700 disabled:opacity-50"
           >
             {undoing ? "Restoring..." : "↩️ Undo"}
           </button>
       
         </div>
       )}


      {/* User count */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 mb-6">
        <p className="text-gray-500 dark:text-gray-400">
          Total Users
        </p>

        <p className="text-3xl font-bold mt-2 dark:text-white">
          {users.length}
        </p>
      </div>


     {showAddUserForm && (
    <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
  
      {/* ========================================== */}
      {/* FORM HEADER */}
      {/* ========================================== */}
  
      <div className="flex items-center justify-between mb-6">
  
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Add New User
        </h2>
  
        <button
          type="button"
          onClick={() => setShowAddUserForm(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
        >
          ✕
        </button>
  
      </div>
  
  
      <form
        onSubmit={handleAddUser}
        className="space-y-5"
      >
  
        {/* ========================================== */}
        {/* PROFILE PICTURE */}
        {/* ========================================== */}
  
        <div>
  
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profile Picture
          </label>
  
          <div className="flex items-center gap-5">
  
            {profilePicturePreview ? (
  
              <img
                src={profilePicturePreview}
                alt="Profile Preview"
                className="w-20 h-20 rounded-full object-cover border border-gray-300 dark:border-gray-600"
              />
  
            ) : (
  
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No Image
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
                Maximum size: 5MB
              </p>
  
            </div>
  
          </div>
  
        </div>
  
  
        {/* ========================================== */}
        {/* NAME */}
        {/* ========================================== */}
  
        <div>
  
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Name
          </label>
  
          <input
            type="text"
            name="name"
            value={newUser.name}
            onChange={handleNewUserChange}
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter user name"
          />
  
        </div>
  
  
        {/* ========================================== */}
        {/* EMAIL */}
        {/* ========================================== */}
  
        <div>
  
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
  
          <input
            type="email"
            name="email"
            value={newUser.email}
            onChange={handleNewUserChange}
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter email"
          />
  
        </div>
  
  
        {/* ========================================== */}
        {/* PASSWORD */}
        {/* ========================================== */}
  
        <div>
  
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
  
          <input
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleNewUserChange}
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter password"
          />
  
        </div>
  
  
        {/* ========================================== */}
        {/* ROLE */}
        {/* ========================================== */}
  
        <div>
  
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Role
          </label>
  
          <select
            name="role"
            value={newUser.role}
            onChange={handleNewUserChange}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
  
            <option value="customer">
              Customer
            </option>
  
            <option value="admin">
              Admin
            </option>
  
          </select>
  
        </div>
  
  
        {/* ========================================== */}
        {/* ERROR */}
        {/* ========================================== */}
  
        {addUserError && (
  
          <div className="rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3">
            {addUserError}
          </div>
  
        )}
  
  
        {/* ========================================== */}
        {/* SUCCESS */}
        {/* ========================================== */}
  
        {addUserSuccess && (
  
          <div className="rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3">
            {addUserSuccess}
          </div>
  
        )}
  
  
        {/* ========================================== */}
        {/* BUTTONS */}
        {/* ========================================== */}
  
        <div className="flex gap-3 pt-2">
  
          <button
            type="submit"
            disabled={addingUser}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {addingUser
              ? "Creating..."
              : "Create User"}
          </button>
  
  
          <button
            type="button"
            onClick={() => setShowAddUserForm(false)}
            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
  
        </div>
  
      </form>
  
    </div>
    )}  
  
  
       

     {/* User Type Tabs */}
       <div className="mb-6 flex gap-3">
       
         {/* Admins */}
         <button
           type="button"
           onClick={() => setActiveTab("admins")}
           className={`rounded-lg px-5 py-2.5 font-medium transition ${
             activeTab === "admins"
               ? "bg-orange-600 text-white"
               : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
           }`}
         >
           👑 Admins
         </button>
       
         {/* Customers */}
         <button
           type="button"
           onClick={() => setActiveTab("customers")}
           className={`rounded-lg px-5 py-2.5 font-medium transition ${
             activeTab === "customers"
               ? "bg-orange-600 text-white"
               : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
           }`}
         >
           👤 Customers
         </button>
       
         {/* Deleted Users */}
         <button
           type="button"
           onClick={() => setActiveTab("deleted")}
           className={`rounded-lg px-5 py-2.5 font-medium transition ${
             activeTab === "deleted"
               ? "bg-red-600 text-white"
               : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
           }`}
         >
           🗑️ Deleted Users
         </button>
       
       </div>

  
        {/* Users table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              {/* Table header */}
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-4">
                    #
                  </th>

                  <th className="px-6 py-4">
                    Profile Picture
                    </th>
  
                  <th className="px-6 py-4">
                    Name
                  </th>
  
                  <th className="px-6 py-4">
                    Email
                  </th>
  
                  <th className="px-6 py-4">
                    Role
                  </th>
  
                  <th className="px-6 py-4">
                    Registered
                  </th>
  
                  <th className="px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
  
              {/* Table body */}
              <tbody>
                {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                        >
                          No {activeTab === "admins"
                             ? "admins"
                             : activeTab === "customers"
                             ? "customers"
                             : "deleted users"} found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => (
                    <tr
                      key={user._id}
                      className="border-t dark:border-gray-700"
                    >
                      {/* Number */}
                      <td className="px-6 py-4">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3">
                          {user.profilePicture ? (
                            <img
                              src={getProfilePictureUrl(user.profilePicture)}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}
                        </td>
  
                      {/* Name */}
                      <td className="px-6 py-4 font-medium dark:text-white">
                        {user.name}
                      </td>
  
                      {/* Email */}
                      <td className="px-6 py-4 dark:text-gray-200">
                        {user.email}
                      </td>
  
                      {/* Role */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {user.role || "customer"}
                        </span>
                      </td>
  
                      {/* Date */}
                      <td className="px-6 py-4 dark:text-gray-200">
                        {user.createdAt
                          ? new Date(
                              user.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
  
                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* View button */}
                          <Link
                            to={`/admin/users/${user._id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap"
                          >
                            👁 View
                          </Link>
  
                          {/* Delete button */}
                          {/* Delete / Restore button */}
                           {activeTab === "deleted" ? (
                             <button
                               type="button"
                               onClick={() => restoreUser(user._id)}
                               disabled={restoringId === user._id}
                               className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                             >
                               {restoringId === user._id
                                 ? "Restoring..."
                                 : "↩️ Restore"}
                             </button>
                           ) : (
                             <button
                               type="button"
                               onClick={() => deleteUser(user._id)}
                               disabled={deleting}
                               className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 whitespace-nowrap"
                             >
                               🗑️ Delete
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};

export default AdminUsers;