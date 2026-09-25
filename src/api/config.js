// ==========================================
// API CONFIGURATION
// ==========================================

// Uses the local backend during development
// and the Vercel backend in production.
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5050"
).replace(/\/+$/, "");


// ==========================================
// IMAGE URL HELPER
// ==========================================

const getImageUrl = (imagePath) => {
  // No image.
  if (!imagePath) {
    return "";
  }

  // External images and data URLs are already complete.
  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://") ||
    imagePath.startsWith("data:")
  ) {
    return imagePath;
  }

  // Backend uploaded image:
  // /uploads/product.jpg
  if (imagePath.startsWith("/uploads/")) {
    return `${API_BASE_URL}${imagePath}`;
  }

  // Backend uploaded image:
  // uploads/product.jpg
  if (imagePath.startsWith("uploads/")) {
    return `${API_BASE_URL}/${imagePath}`;
  }

  // Return other paths unchanged.
  return imagePath;
};


export {
  API_BASE_URL,
  getImageUrl,
};