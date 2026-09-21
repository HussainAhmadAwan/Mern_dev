import axios from "axios";

// ======================================================
// API BASE URL
// ======================================================
//
// Local development:
// VITE_API_URL=http://localhost:5050
//
// Production:
// VITE_API_URL=https://your-production-backend-url.com
//
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5050";

// Create the main API instance.
const API = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""),
});

// Add JWT token to every request when available.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;