import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

const Register = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [statusMsg, setStatusMsg] = useState({
    type: "",
    text: "",
  });

  // =========================================================
  // HANDLE INPUT CHANGE
  // =========================================================

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });

    if (statusMsg.text) {
      setStatusMsg({
        type: "",
        text: "",
      });
    }
  };

  // =========================================================
  // HANDLE REGISTRATION
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatusMsg({
      type: "",
      text: "",
    });

    // Check password match
    if (user.password !== user.confirmPassword) {
      setStatusMsg({
        type: "error",
        text: "Passwords do not match!",
      });

      return;
    }

    // Check password length
    if (user.password.length < 4) {
      setStatusMsg({
        type: "error",
        text: "Password must be at least 4 characters long.",
      });

      return;
    }

    setLoading(true);

    try {
      // =====================================================
      // REGISTER USER
      // =====================================================
      //
      // API uses the centralized base URL configured in:
      //
      // src/api/config.js
      //
      // The endpoint is:
      // /register
      // =====================================================

      const response = await API.post("/register", {
        name: user.name,
        email: user.email,
        password: user.password,
      });

      console.log("Server response:", response.data);

      setStatusMsg({
        type: "success",
        text:
          response.data.message ||
          "User Registered Successfully in MongoDB Atlas!",
      });

      // Reset form
      setUser({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Registration error details:", err);

      let msg =
        "Registration failed. Please try again.";

      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = `Network Error: ${err.message}`;
      }

      setStatusMsg({
        type: "error",
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* PAGE TITLE */}

        <h1 className="text-center text-3xl font-bold text-gray-800">
          Create Account
        </h1>

        <p className="mb-6 mt-2 text-center text-gray-500">
          Register to connect with MongoDB Atlas
        </p>

        {/* STATUS MESSAGE */}

        {statusMsg.text && (
          <div
            className={`mb-6 rounded-lg border p-4 text-sm font-medium transition-all ${
              statusMsg.type === "success"
                ? "border-green-400 bg-green-100 text-green-800"
                : "border-red-400 bg-red-100 text-red-800"
            }`}
          >
            {statusMsg.type === "success"
              ? "✅ "
              : "⚠️ "}

            {statusMsg.text}
          </div>
        )}

        {/* REGISTRATION FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* FULL NAME */}

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={user.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* EMAIL */}

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              value={user.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Password
            </label>

            <div className="relative">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Enter password"
                value={user.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 select-none px-2 py-1 text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                {showPassword
                  ? "🙈 Hide"
                  : "👁️ Show"}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}

          <div>
            <label className="mb-2 block font-medium text-gray-700">
              Confirm Password
            </label>

            <div className="relative">
              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                name="confirmPassword"
                placeholder="Confirm password"
                value={user.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 select-none px-2 py-1 text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword
                  ? "🙈 Hide"
                  : "👁️ Show"}
              </button>
            </div>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className={`flex w-full items-center justify-center rounded-lg bg-blue-600 py-3 font-semibold text-white transition duration-300 hover:bg-blue-700 ${
              loading
                ? "cursor-not-allowed opacity-70"
                : ""
            }`}
          >
            {loading ? (
              <span>
                Submitting to MongoDB Atlas...
              </span>
            ) : (
              <span>
                Register Account
              </span>
            )}
          </button>
        </form>

        {/* LOGIN LINK */}

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{" "}

          <Link
            to="/Login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

