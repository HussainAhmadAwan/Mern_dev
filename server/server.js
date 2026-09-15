require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

app.use("/uploads", express.static("uploads"));

app.use(cors());
app.use(express.json());

// Register public website settings routes.
app.use("/settings", settingsRoutes);

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecomm";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

// Import Routes
const authRoutes = require("./routes/authentication");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");


// Use/Register Routes
app.use("/", authRoutes);
app.use("/api/products", productRoutes);
// app.use("/", orderRoutes);
app.use("/orders", orderRoutes);
app.use("/admin", adminRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Server is Running...");
});

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
