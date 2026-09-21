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
// IMPORTANT:
// Vite only exposes frontend environment variables
// beginning with VITE_.
//
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5050";

// Create API instance.
const api = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ""),
});

// Add JWT to every request.
api.interceptors.request.use(
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

export default api;