import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  // =========================================================
  // HANDLE USER LOGIN
  // =========================================================

  const loginUser = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/login", {
        email,
        password,
      });

      // Check successful login
      if (res.data.success) {
        // Save user and token
        login(
          res.data.user,
          res.data.token
        );

        console.log(
          "Logged in user:",
          res.data.user
        );

        // Redirect after successful login
        const from = location.state?.from;

        if (res.data.user.role === "admin") {
          navigate("/admin", {
            replace: true,
          });
        } else if (from) {
          navigate(from, {
            replace: true,
          });
        } else {
          navigate("/", {
            replace: true,
          });
        }
      }
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Something went wrong"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">
          Welcome Back
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Login to your account
        </p>

        <form
          onSubmit={loginUser}
          className="space-y-5"
        >
          {/* Email */}

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              required
            />
          </div>

          {/* Password */}

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-3"
              required
            />
          </div>

          {/* Login Button */}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
          >
            Login
          </button>
        </form>

        {/* Register Link */}

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{" "}

          <Link
            to="/Register"
            className="text-blue-600 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;