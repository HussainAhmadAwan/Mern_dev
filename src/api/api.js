import axios from "axios";
import { API_BASE_URL } from "./config";

// ======================================================
// MAIN API INSTANCE
// ======================================================

const API = axios.create({
  baseURL: API_BASE_URL,
});

// ======================================================
// ADD JWT TOKEN TO EVERY REQUEST
// ======================================================

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