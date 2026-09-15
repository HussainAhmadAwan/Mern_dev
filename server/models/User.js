const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER NAME
    // ==========================================

    name: {
      type: String,
      required: true,
      trim: true,
    },


    // ==========================================
    // USER EMAIL
    // ==========================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },


    // ==========================================
    // PASSWORD
    // ==========================================

    password: {
      type: String,
      required: true,
    },


    // ==========================================
    // USER ROLE
    // ==========================================

    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },


    // ==========================================
    // PROFILE PICTURE
    // ==========================================
    
    profilePicture: {
      type: String,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    
    deletedAt: {
      type: Date,
      default: null,
    },

  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);