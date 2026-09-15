const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { authenticateUser } = require("../middleware/authMiddleware");
const profileUpload = require("../middleware/profileUpload");


// Register
router.post("/register", async (req, res) => {
  try {

    const {
      name,
      email,
      password,
    } = req.body;

    // Check required fields
    if (!name || !email || !password) {

      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });

    }

    // Check existing user
    const userExists = await User.findOne({
      email,
    });

    if (userExists) {

      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });

    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "customer",
    });

    // Save user
    await user.save();

    res.status(201).json({
      success: true,
      message: "User Registered Successfully.",
    });

  } catch (err) {

    console.error(
      "Registration Error:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
});

// Login
router.post("/login", async (req, res) => {
  try {

    const {
      email,
      password,
    } = req.body;

    // Find user
    const user = await User.findOne({
      email,
    });

    if (!user) {

      return res.status(400).json({
        success: false,
        message: "User not found.",
      });

    }

    // Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {

      return res.status(400).json({
        success: false,
        message: "Invalid password.",
      });

    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Remove password from response
    const userResponse = user.toObject();

    delete userResponse.password;

    // Login success
    res.json({
      success: true,
      message: "Login Successful",
      token,
      user: userResponse,
    });

  } catch (err) {

    console.error(
      "Login Error:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {

    const users = await User.find();

    res.json(users);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });

  }
});

// Update logged-in user's profile
router.put("/profile",authenticateUser, profileUpload.single("profilePicture"), async (req, res) => {

    try {

      const {
        name,
        email,
        password,
      } = req.body;

      // Find logged-in user
      const user = await User.findById(
        req.user.id
      );

      if (!user) {

        return res.status(404).json({
          success: false,
          message: "User not found.",
        });

      }

      // Update name
      if (
        name !== undefined &&
        name.trim() !== ""
      ) {

        user.name = name.trim();

      }

      // Update email
      if (
        email !== undefined &&
        email.trim() !== ""
      ) {

        user.email =
          email.trim().toLowerCase();

      }

      // Update password only if provided
      if (
        password &&
        password.trim() !== ""
      ) {

        user.password =
          await bcrypt.hash(
            password.trim(),
            10
          );

      }

      // Update profile picture
       if (req.file) {
         user.profilePicture = `/uploads/profiles/${req.file.filename}`;
       }

      // Save changes
      const updatedUser =
        await user.save();

      // Remove password from response
      const userResponse =
        updatedUser.toObject();

      delete userResponse.password;

      res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        user: userResponse,
      });

    } catch (error) {

      console.error(
        "Profile Update Error:",
        error
      );

      // Handle duplicate email
      if (error.code === 11000) {

        return res.status(400).json({
          success: false,
          message: "Email is already in use.",
        });

      }

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }

  }
);

module.exports = router;