import axios from "axios";
import { API_BASE_URL } from "./config";

// ======================================================
// ADMIN API INSTANCE
// ======================================================

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ======================================================
// ADD JWT TOKEN TO EVERY REQUEST
// ======================================================

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