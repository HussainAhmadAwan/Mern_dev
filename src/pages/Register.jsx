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
      // API automatically uses VITE_API_URL.
      //
      // Local:
      // http://localhost:5050/register
      //
      // Production:
      // https://YOUR-BACKEND-URL/register
      // =====================================================

      const response = await API.post("/register", {
        name: user.name,
        email: user.email,
        password: user.password,
      });

      console.log(
        "Server response:",
        response.data
      );

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
      console.error(
        "Registration error details:",
        err
      );

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-6">
          Register to connect with MongoDB Atlas
        </p>

        {/* Status Message Alert Banner */}

        {statusMsg.text && (
          <div
            className={`p-4 rounded-lg mb-6 text-sm font-medium transition-all ${
              statusMsg.type === "success"
                ? "bg-green-100 border border-green-400 text-green-800"
                : "bg-red-100 border border-red-400 text-red-800"
            }`}
          >
            {statusMsg.type === "success"
              ? "✅ "
              : "⚠️ "}

            {statusMsg.text}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Full Name */}

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={user.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              value={user.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Password */}

          <div>
            <label className="block text-gray-700 font-medium mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm font-semibold px-2 py-1 select-none"
              >
                {showPassword
                  ? "🙈 Hide"
                  : "👁️ Show"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}

          <div>
            <label className="block text-gray-700 font-medium mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm font-semibold px-2 py-1 select-none"
              >
                {showConfirmPassword
                  ? "🙈 Hide"
                  : "👁️ Show"}
              </button>
            </div>
          </div>

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-300 flex items-center justify-center ${
              loading
                ? "opacity-70 cursor-not-allowed"
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

        {/* Login Link */}

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}

          <Link
            to="/Login"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;