import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5050",
});

export default API;