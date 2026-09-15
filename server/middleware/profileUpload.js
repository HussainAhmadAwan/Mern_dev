const multer = require("multer");
const path = require("path");

// ========================================================
// STORAGE CONFIGURATION
// ========================================================

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, "uploads/profiles/");
  },

  filename: function (req, file, cb) {

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);

  },

});


// ========================================================
// FILE FILTER
// ========================================================

const fileFilter = (req, file, cb) => {

  if (file.mimetype.startsWith("image/")) {

    cb(null, true);

  } else {

    cb(
      new Error("Only image files are allowed."),
      false
    );

  }

};


// ========================================================
// MULTER
// ========================================================

const profileUpload = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

});


module.exports = profileUpload;