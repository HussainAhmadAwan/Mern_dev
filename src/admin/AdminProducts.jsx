import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useCart } from "../context/CartContext";

const AdminProducts = () => {
  const { formatPrice, currencySymbol } = useCart();

  // Store all products.
  const [products, setProducts] = useState([]);

  // Store the expanded product ID.
  const [expandedProductId, setExpandedProductId] = useState(null);

  // Store loading state.
  const [loading, setLoading] = useState(true);

  // Store error message.
  const [error, setError] = useState("");

  // Control product form visibility.
  const [showForm, setShowForm] = useState(false);

  // Store the product currently being edited.
  const [editingProduct, setEditingProduct] = useState(null);

  // Store locally selected images.
  const [selectedImages, setSelectedImages] = useState([]);

  // Store previews for local images.
  const [imagePreviews, setImagePreviews] = useState([]);

  // Store additional image URLs.
  const [imageUrls, setImageUrls] = useState([]);

  // Store image URL input.
  const [imageUrlInput, setImageUrlInput] = useState("");

  // Store selected main image.
  const [mainImage, setMainImage] = useState(null);

  // Store main image type.
  const [mainImageType, setMainImageType] = useState("");

  // Store main image URL.
  const [mainImageUrl, setMainImageUrl] = useState("");

  // Store removed images.
  const [removedImages, setRemovedImages] = useState([]);

  // Store product form data.
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    originalPrice: "",
    discountedPrice: "",
    isOnSale: false,
    image: "",
    description: "",
    category: "",
    stock: "",
    rating: "",
    isVisible: true,
  });

  // Store submitting state.
  const [submitting, setSubmitting] = useState(false);

  // Store success message.
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch every product including hidden products.
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/products/admin/all");

      if (response.data.success) {
        setProducts(response.data.products || []);
      } else {
        setError("Failed to load products.");
      }
    } catch (error) {
      console.error("Failed to load products:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load products when page opens.
  useEffect(() => {
    fetchProducts();
  }, []);

  // Convert an image path into a browser-ready URL.
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "";
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://")
    ) {
      return imagePath;
    }

    if (imagePath.startsWith("/uploads/")) {
      return `http://localhost:5050${imagePath}`;
    }

    return imagePath;
  };

  // Handle normal form input changes.
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Reset the entire product form.
  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      originalPrice: "",
      discountedPrice: "",
      isOnSale: false,
      image: "",
      description: "",
      category: "",
      stock: "",
      rating: "",
      isVisible: true,
      freeShipping: false,
      returns30Days: false,
      secureCheckout: false,
      warranty1Year: false,
    });

    setSelectedImages([]);
    setImagePreviews([]);
    setImageUrls([]);
    setImageUrlInput("");
    setMainImage(null);
    setMainImageType("");
    setMainImageUrl("");
    setRemovedImages([]);
  };

  // Open the add product form.
  const handleAddProduct = () => {
    setEditingProduct(null);
    resetForm();
    setError("");
    setSuccessMessage("");
    setShowForm(true);
  };

  // Open the edit product form.
  const handleEditProduct = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || "",
      price: product.price ?? "",
      originalPrice: product.originalPrice ?? "",
      discountedPrice: product.discountedPrice ?? "",
      isOnSale: Boolean(product.isOnSale),
      image: product.image || "",
      description: product.description || "",
      category: product.category || "",
      stock: product.stock ?? "",
      rating: product.rating ?? "",
      isVisible: product.isVisible !== false,
      freeShipping:
        product.freeShipping === undefined
          ? true
          : Boolean(product.freeShipping),
      returns30Days:
        product.returns30Days === undefined
          ? true
          : Boolean(product.returns30Days),
      secureCheckout:
        product.secureCheckout === undefined
          ? true
          : Boolean(product.secureCheckout),
      warranty1Year:
        product.warranty1Year === undefined
          ? true
          : Boolean(product.warranty1Year),
    });

    setSelectedImages([]);
    setImagePreviews([]);
    setRemovedImages([]);

    const existingImages = [
      ...(product.image ? [product.image] : []),
      ...(Array.isArray(product.images) ? product.images : []),
    ];

    const uniqueExistingImages = [...new Set(existingImages)];

    const existingAdditionalUrls =
      uniqueExistingImages.filter(
        (image) =>
          typeof image === "string" &&
          (image.startsWith("http://") ||
            image.startsWith("https://"))
      );

    const filteredAdditionalUrls =
      existingAdditionalUrls.filter(
        (url) => url !== product.image
      );

    setImageUrls(filteredAdditionalUrls);

    if (product.image) {
      const mainIndex =
        uniqueExistingImages.indexOf(product.image);

      setMainImage(`existing-${mainIndex}`);

      if (
        product.image.startsWith("http://") ||
        product.image.startsWith("https://")
      ) {
        setMainImageType("url");
        setMainImageUrl(product.image);
      } else {
        setMainImageType("existing-file");
        setMainImageUrl("");
      }
    } else {
      setMainImage(null);
      setMainImageType("");
      setMainImageUrl("");
    }

    setImageUrlInput("");
    setShowForm(true);
    setError("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Close the product form.
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    resetForm();
    setError("");
  };

  // Create or update a product.
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      if (
        formData.isOnSale &&
        formData.discountedPrice !== "" &&
        Number(formData.discountedPrice) >=
          Number(formData.originalPrice || formData.price)
      ) {
        setError(
          "Discounted price must be lower than the original price."
        );
        setSubmitting(false);
        return;
      }

      const data = new FormData();

      data.append("name", formData.name);
      data.append("price", Number(formData.price));
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("stock", Number(formData.stock || 0));
      data.append("rating", Number(formData.rating || 0));

      data.append(
        "isOnSale",
        String(Boolean(formData.isOnSale))
      );

      data.append(
        "originalPrice",
        formData.isOnSale
          ? Number(
              formData.originalPrice || formData.price
            )
          : ""
      );

      data.append(
        "discountedPrice",
        formData.isOnSale &&
          formData.discountedPrice !== ""
          ? Number(formData.discountedPrice)
          : ""
      );

      data.append(
        "isVisible",
        String(Boolean(formData.isVisible))
      );

      // Save each product feature independently.
      data.append(
        "freeShipping",
        String(Boolean(formData.freeShipping))
      );
      data.append(
        "returns30Days",
        String(Boolean(formData.returns30Days))
      );
      data.append(
        "secureCheckout",
        String(Boolean(formData.secureCheckout))
      );
      data.append(
        "warranty1Year",
        String(Boolean(formData.warranty1Year))
      );

      selectedImages.forEach((file) => {
        data.append("images", file);
      });

      data.append(
        "additionalImageUrls",
        JSON.stringify(imageUrls)
      );

      data.append("mainImageType", mainImageType);

      if (mainImageType === "url") {
        data.append("mainImageUrl", mainImageUrl);
      }

      if (mainImageType === "existing-file") {
        const selectedImage = getAllImages().find(
          (image) => image.id === mainImage
        );

        if (!selectedImage) {
          throw new Error(
            "The selected existing image could not be found."
          );
        }

        data.append(
          "mainImagePath",
          selectedImage.originalPath
        );
      }

      if (mainImageType === "file") {
        const mainImageIndex =
          imagePreviews.findIndex(
            (item, index) =>
              `file-${index}` === mainImage
          );

        if (mainImageIndex === -1) {
          throw new Error(
            "The selected device image could not be found."
          );
        }

        data.append(
          "mainImageIndex",
          String(mainImageIndex)
        );
      }

      data.append(
        "removedImages",
        JSON.stringify(removedImages)
      );

      let response;

      if (editingProduct) {
        response = await api.put(
          `/api/products/${editingProduct._id}`,
          data
        );
      } else {
        response = await api.post(
          "/api/products",
          data
        );
      }

      if (response.data.success) {
        setSuccessMessage(
          editingProduct
            ? "Product updated successfully!"
            : "Product added successfully!"
        );

        await fetchProducts();

        resetForm();
        setEditingProduct(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error(
        "Create/Update Product Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save product."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a product.
  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");

      const response = await api.delete(
        `/api/products/${product._id}`
      );

      if (response.data.success) {
        setSuccessMessage(
          "Product deleted successfully!"
        );

        await fetchProducts();
      }
    } catch (error) {
      console.error(
        "Delete Product Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete product."
      );
    }
  };

  // Toggle product visibility.
  const handleToggleVisibility = async (product) => {
    try {
      setError("");
      setSuccessMessage("");

      const data = new FormData();

      data.append("name", product.name);
      data.append("price", Number(product.price || 0));

      data.append(
        "originalPrice",
        product.originalPrice ?? ""
      );

      data.append(
        "discountedPrice",
        product.discountedPrice ?? ""
      );

      data.append(
        "isOnSale",
        String(Boolean(product.isOnSale))
      );

      data.append(
        "description",
        product.description || ""
      );

      data.append(
        "category",
        product.category || "General"
      );

      data.append(
        "stock",
        Number(product.stock || 0)
      );

      data.append(
        "rating",
        Number(product.rating || 0)
      );

      data.append(
        "isVisible",
        String(product.isVisible === false)
      );

      // Preserve the product feature settings during visibility updates.
      data.append(
        "freeShipping",
        String(
          product.freeShipping === undefined
            ? true
            : Boolean(product.freeShipping)
        )
      );
      data.append(
        "returns30Days",
        String(
          product.returns30Days === undefined
            ? true
            : Boolean(product.returns30Days)
        )
      );
      data.append(
        "secureCheckout",
        String(
          product.secureCheckout === undefined
            ? true
            : Boolean(product.secureCheckout)
        )
      );
      data.append(
        "warranty1Year",
        String(
          product.warranty1Year === undefined
            ? true
            : Boolean(product.warranty1Year)
        )
      );

      data.append(
        "mainImageType",
        product.image?.startsWith("http")
          ? "url"
          : "existing-file"
      );

      if (product.image?.startsWith("http")) {
        data.append(
          "mainImageUrl",
          product.image
        );
      } else if (product.image) {
        data.append(
          "mainImagePath",
          product.image
        );
      }

      const existingAdditionalImages =
        Array.isArray(product.images)
          ? product.images.filter(
              (image) => image !== product.image
            )
          : [];

      data.append(
        "additionalImageUrls",
        JSON.stringify(
          existingAdditionalImages.filter(
            (image) =>
              image.startsWith("http://") ||
              image.startsWith("https://")
          )
        )
      );

      data.append(
        "removedImages",
        JSON.stringify([])
      );

      const response = await api.put(
        `/api/products/${product._id}`,
        data
      );

      if (response.data.success) {
        setSuccessMessage(
          product.isVisible === false
            ? "Product is now visible to customers."
            : "Product has been hidden from customers."
        );

        await fetchProducts();
      }
    } catch (error) {
      console.error(
        "Toggle Product Visibility Error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update product visibility."
      );
    }
  };

  // Handle multiple image selection.
  const handleImageChange = (event) => {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) {
      return;
    }

    const validFiles = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert(
          `${file.name} is not a valid image file.`
        );
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(
          `${file.name} is larger than 5MB.`
        );
        continue;
      }

      validFiles.push(file);
    }

    setSelectedImages((previousImages) => {
      const combinedImages = [
        ...previousImages,
        ...validFiles,
      ];

      if (combinedImages.length > 10) {
        alert(
          "You can select a maximum of 10 local images."
        );

        return combinedImages.slice(0, 10);
      }

      return combinedImages;
    });

    const newPreviews = validFiles.map(
      (file) => ({
        file,
        preview: URL.createObjectURL(file),
      })
    );

    setImagePreviews((previousPreviews) => {
      const combinedPreviews = [
        ...previousPreviews,
        ...newPreviews,
      ];

      return combinedPreviews.slice(0, 10);
    });

    event.target.value = "";
  };

  // Add an image URL.
  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();

    if (!url) {
      alert("Please enter an image URL.");
      return;
    }

    try {
      new URL(url);
    } catch {
      alert("Please enter a valid image URL.");
      return;
    }

    if (imageUrls.includes(url)) {
      alert(
        "This image URL has already been added."
      );
      return;
    }

    if (imageUrls.length >= 10) {
      alert(
        "You can add a maximum of 10 image URLs."
      );
      return;
    }

    setImageUrls((previousUrls) => [
      ...previousUrls,
      url,
    ]);

    setImageUrlInput("");
  };

  // Build the complete image list.
  const getAllImages = () => {
    let existingImages = [];

    if (editingProduct) {
      existingImages = [
        ...(editingProduct.image
          ? [editingProduct.image]
          : []),
        ...(Array.isArray(editingProduct.images)
          ? editingProduct.images
          : []),
      ];
    }

    existingImages = [
      ...new Set(existingImages),
    ];

    existingImages = existingImages.filter(
      (image) =>
        !removedImages.includes(image)
    );

    const existingImageItems =
      existingImages.map((image) => {
        const originalImages = [
          ...(editingProduct?.image
            ? [editingProduct.image]
            : []),
          ...(Array.isArray(
            editingProduct?.images
          )
            ? editingProduct.images
            : []),
        ];

        const originalIndex =
          originalImages.indexOf(image);

        const isRemoteUrl =
          image.startsWith("http://") ||
          image.startsWith("https://");

        return {
          id: `existing-${originalIndex}`,
          type: isRemoteUrl
            ? "existing-url"
            : "existing-file",
          src: getImageUrl(image),
          originalPath: image,
          url: isRemoteUrl ? image : null,
        };
      });

    const localImages =
      imagePreviews.map((item, index) => ({
        id: `file-${index}`,
        type: "file",
        src: item.preview,
        file: item.file,
      }));

    const urlImages = imageUrls
      .filter(
        (url) =>
          !existingImages.includes(url)
      )
      .map((url, index) => ({
        id: `url-${index}`,
        type: "url",
        src: url,
        url,
      }));

    return [
      ...existingImageItems,
      ...localImages,
      ...urlImages,
    ];
  };

  // Select an image as the main image.
  const handleSelectMainImage = (image) => {
    setMainImage(image.id);

    if (image.type === "url") {
      setMainImageType("url");
      setMainImageUrl(image.url);
      return;
    }

    if (image.type === "existing-url") {
      setMainImageType("url");
      setMainImageUrl(image.originalPath);
      return;
    }

    if (image.type === "file") {
      setMainImageType("file");
      setMainImageUrl("");
      return;
    }

    if (image.type === "existing-file") {
      setMainImageType("existing-file");
      setMainImageUrl("");
    }
  };

  // Remove an image from the product.
  const handleRemoveImage = (event, image) => {
    event.stopPropagation();

    if (
      image.type === "existing-url" ||
      image.type === "existing-file"
    ) {
      setRemovedImages(
        (previousImages) => [
          ...previousImages,
          image.originalPath,
        ]
      );

      if (mainImage === image.id) {
        setMainImage(null);
        setMainImageType("");
        setMainImageUrl("");
      }

      return;
    }

    if (image.type === "url") {
      setImageUrls(
        (previousUrls) =>
          previousUrls.filter(
            (url) => url !== image.url
          )
      );

      if (mainImage === image.id) {
        setMainImage(null);
        setMainImageType("");
        setMainImageUrl("");
      }

      return;
    }

    if (image.type === "file") {
      const fileIndex =
        imagePreviews.findIndex(
          (item) =>
            item.preview === image.src
        );

      if (fileIndex !== -1) {
        setSelectedImages(
          (previousImages) =>
            previousImages.filter(
              (_, index) =>
                index !== fileIndex
            )
        );

        setImagePreviews(
          (previousPreviews) =>
            previousPreviews.filter(
              (_, index) =>
                index !== fileIndex
            )
        );
      }

      if (mainImage === image.id) {
        setMainImage(null);
        setMainImageType("");
        setMainImageUrl("");
      }
    }
  };

  // Display a shortened product ID.
  const ProductIdDisplay = ({ productId }) => {
    const [showFullId, setShowFullId] =
      useState(false);

    return (
      <div className="relative min-w-0">
        <button
          type="button"
          onClick={() =>
            setShowFullId(
              (previous) => !previous
            )
          }
          title="Click to view full Product ID"
          className="max-w-full truncate font-mono text-xs text-gray-600 transition hover:text-orange-600 dark:text-gray-300 dark:hover:text-orange-400"
        >
          {String(productId).slice(0, 6)}...
        </button>

        {showFullId && (
          <div className="absolute left-0 top-full z-50 mt-2 w-max max-w-[min(280px,calc(100vw-32px))] rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-600 dark:bg-slate-700">
            <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              Full Product ID
            </p>

            <p className="break-all font-mono text-xs text-gray-800 dark:text-white">
              {productId}
            </p>

            <button
              type="button"
              onClick={() =>
                setShowFullId(false)
              }
              className="mt-2 text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              Close
            </button>
          </div>
        )}
      </div>
    );
  };

  // Display product price using selected currency.
  const ProductPrice = ({ product }) => {
    const sale =
      product.isOnSale &&
      Number.isFinite(
        Number(product.discountedPrice)
      ) &&
      Number(product.discountedPrice) <
        Number(
          product.originalPrice ??
            product.price ??
            0
        );

    if (sale) {
      return (
        <div className="min-w-0">
          <div className="break-words text-xs text-gray-400 line-through dark:text-gray-500">
            {formatPrice(
              Number(
                product.originalPrice ??
                  product.price ??
                  0
              )
            )}
          </div>

          <div className="break-words font-bold text-red-600 dark:text-red-400">
            {formatPrice(
              Number(product.discountedPrice)
            )}
          </div>
        </div>
      );
    }

    return (
      <span className="break-words font-semibold text-orange-600">
        {formatPrice(Number(product.price || 0))}
      </span>
    );
  };

  // Display loading state.
  if (loading) {
    return (
      <div className="min-w-0 p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
          Products
        </h1>

        <p className="mt-4 text-orange-600">
          Loading products...
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
            Products
          </h1>

          <p className="mt-2 break-words text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Manage products, pricing, visibility and images.
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={handleAddProduct}
            className="w-full shrink-0 rounded-lg bg-orange-600 px-5 py-3 font-medium text-white transition hover:bg-orange-700 sm:w-auto"
          >
            + Add Product
          </button>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-6 rounded-lg bg-green-100 p-4 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Add/edit form */}
      {showForm && (
        <div className="mb-8 min-w-0 rounded-xl bg-white p-4 shadow dark:bg-slate-800 sm:p-5">
          <div className="mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="break-words text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
              {editingProduct
                ? "Edit Product"
                : "Add New Product"}
            </h2>

            <button
              type="button"
              onClick={handleCancelForm}
              className="w-full shrink-0 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600 sm:w-auto"
            >
              Cancel
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2"
          >
            {/* Product name */}
            <div className="min-w-0">
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Product Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Regular price */}
            <div className="min-w-0">
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Regular Price ({currencySymbol})
              </label>

              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="199.99"
                min="0"
                step="0.01"
                required
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              />

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Normal product price.
              </p>
            </div>

            {/* Sale settings */}
            <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700/50 md:col-span-2">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Sale Pricing
                  </h3>

                  <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                    Enable this product's discounted price.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFormData(
                      (previousData) => ({
                        ...previousData,
                        isOnSale:
                          !previousData.isOnSale,
                      })
                    );

                    setSuccessMessage("");
                  }}
                  className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition ${
                    formData.isOnSale
                      ? "bg-orange-600"
                      : "bg-gray-300 dark:bg-slate-600"
                  }`}
                  aria-label="Toggle sale"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      formData.isOnSale
                        ? "translate-x-8"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {formData.isOnSale && (
                <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Original / Actual Price ({currencySymbol})
                    </label>

                    <input
                      type="number"
                      name="originalPrice"
                      value={
                        formData.originalPrice
                      }
                      onChange={handleChange}
                      placeholder={
                        formData.price || "199.99"
                      }
                      min="0"
                      step="0.01"
                      className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Discounted Price ({currencySymbol})
                    </label>

                    <input
                      type="number"
                      name="discountedPrice"
                      value={
                        formData.discountedPrice
                      }
                      onChange={handleChange}
                      placeholder="149.99"
                      min="0"
                      step="0.01"
                      required={formData.isOnSale}
                      className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700/50 md:col-span-2">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    Customer Visibility
                  </h3>

                  <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                    Hidden products remain in the admin panel
                    but are not shown to customers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFormData(
                      (previousData) => ({
                        ...previousData,
                        isVisible:
                          !previousData.isVisible,
                      })
                    );

                    setSuccessMessage("");
                  }}
                  className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition ${
                    formData.isVisible
                      ? "bg-green-600"
                      : "bg-gray-400 dark:bg-slate-600"
                  }`}
                  aria-label="Toggle product visibility"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                      formData.isVisible
                        ? "translate-x-8"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-3 text-sm font-medium">
                {formData.isVisible ? (
                  <span className="text-green-600 dark:text-green-400">
                    ● Visible to customers
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    ● Hidden from customers
                  </span>
                )}
              </div>
            </div>

            {/* Product features */}
            <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700/50 md:col-span-2">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  Product Features
                </h3>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Select which features should appear on the product page.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition hover:border-orange-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-orange-500">
                  <input
                    type="checkbox"
                    name="freeShipping"
                    checked={Boolean(formData.freeShipping)}
                    onChange={handleChange}
                    className="h-4 w-4 accent-orange-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Free Shipping
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition hover:border-orange-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-orange-500">
                  <input
                    type="checkbox"
                    name="returns30Days"
                    checked={Boolean(formData.returns30Days)}
                    onChange={handleChange}
                    className="h-4 w-4 accent-orange-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    30-Day Returns
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition hover:border-orange-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-orange-500">
                  <input
                    type="checkbox"
                    name="secureCheckout"
                    checked={Boolean(formData.secureCheckout)}
                    onChange={handleChange}
                    className="h-4 w-4 accent-orange-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Secure Checkout
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition hover:border-orange-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-orange-500">
                  <input
                    type="checkbox"
                    name="warranty1Year"
                    checked={Boolean(formData.warranty1Year)}
                    onChange={handleChange}
                    className="h-4 w-4 accent-orange-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    1-Year Warranty
                  </span>
                </label>
              </div>
            </div>

            {/* Product images */}
            <div className="min-w-0 md:col-span-2">
              <label className="mb-3 block font-medium text-gray-700 dark:text-gray-300">
                Product Images
              </label>

              {/* Image URL */}
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add Image Using URL
                </label>

                <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(event) =>
                      setImageUrlInput(
                        event.target.value
                      )
                    }
                    placeholder="https://example.com/product-image.jpg"
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="shrink-0 rounded-lg bg-orange-600 px-5 py-3 font-medium text-white transition hover:bg-orange-700"
                  >
                    + Add URL
                  </button>
                </div>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You can add multiple image URLs.
                </p>
              </div>

              {/* Image separator */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600" />

                <span className="shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600" />
              </div>

              {/* Device images */}
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Images From Device
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="block w-full min-w-0 cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600 dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300"
                />

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  JPG, JPEG, PNG, WEBP — Maximum 5MB per image.
                </p>
              </div>

              {/* Image previews */}
              {getAllImages().length > 0 && (
                <div className="mt-6 min-w-0">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Product Images
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Click an image to make it the main
                      product image.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {getAllImages().map((image) => (
                      <div
                        key={image.id}
                        className={`relative min-w-0 cursor-pointer rounded-xl border-2 p-1 transition ${
                          mainImage === image.id
                            ? "border-sky-400 bg-sky-50 dark:border-sky-400 dark:bg-sky-900/20"
                            : "border-gray-200 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-400"
                        }`}
                        onClick={() =>
                          handleSelectMainImage(
                            image
                          )
                        }
                      >
                        <img
                          src={image.src}
                          alt="Product"
                          className="h-32 w-full rounded-lg object-cover"
                        />

                        {mainImage === image.id && (
                          <span className="absolute left-2 top-2 rounded-full bg-sky-400 px-2 py-1 text-xs font-semibold text-white shadow">
                            MAIN
                          </span>
                        )}

                        <span className="mt-2 block truncate text-center text-xs text-gray-500 dark:text-gray-400">
                          {image.type === "url" ||
                          image.type === "existing-url"
                            ? "URL Image"
                            : "Device Image"}
                        </span>

                        <button
                          type="button"
                          onClick={(event) =>
                            handleRemoveImage(
                              event,
                              image
                            )
                          }
                          title="Remove image"
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow transition hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="min-w-0 md:col-span-2">
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows="4"
                required
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Category */}
            <div className="min-w-0">
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>

              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Electronics"
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Stock */}
            <div className="min-w-0">
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Stock
              </label>

              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="20"
                min="0"
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Rating */}
            <div className="min-w-0">
              <label className="mb-2 block font-medium text-gray-700 dark:text-gray-300">
                Rating
              </label>

              <input
                type="number"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                placeholder="4.5"
                min="0"
                max="5"
                step="0.1"
                className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 outline-none focus:border-orange-500 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Save button */}
            <div className="flex min-w-0 items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-orange-600 px-5 py-3 font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : editingProduct
                  ? "Save Changes"
                  : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product count */}
      <div className="mb-4">
        <span className="inline-block rounded-lg bg-orange-100 px-4 py-2 text-sm text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          Total Products:{" "}
          <span className="font-bold">
            {products.length}
          </span>
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden min-w-0 overflow-hidden rounded-xl bg-white shadow md:block dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="w-[80px] px-3 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Image
                </th>

                <th className="w-[150px] px-3 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Product
                </th>

                <th className="w-[90px] px-3 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  ID
                </th>

                <th className="w-[100px] px-3 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Category
                </th>

                <th className="w-[110px] px-3 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Price
                </th>

                <th className="w-[80px] px-3 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Stock
                </th>

                <th className="w-[80px] px-3 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Status
                </th>

                <th className="w-[130px] px-3 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    {/* Image */}
                    <td className="px-3 py-2">
                      <img
                        src={getImageUrl(
                          product.image
                        )}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    </td>

                    {/* Name */}
                    <td className="min-w-0 px-3 py-2">
                      <p className="max-w-[150px] truncate font-semibold text-gray-800 dark:text-white">
                        {product.name}
                      </p>

                      {product.isOnSale && (
                        <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          SALE
                        </span>
                      )}
                    </td>

                    {/* Product ID */}
                    <td className="px-3 py-2">
                      <ProductIdDisplay
                        productId={product._id}
                      />
                    </td>

                    {/* Category */}
                    <td className="max-w-[100px] truncate px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      {product.category ||
                        "General"}
                    </td>

                    {/* Price */}
                    <td className="px-3 py-2">
                      <ProductPrice
                        product={product}
                      />
                    </td>

                    {/* Stock */}
                    <td className="px-3 py-2">
                      <span
                        className={
                          product.stock > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* Visibility status */}
                    <td className="px-3 py-2">
                      {product.isVisible === false ? (
                        <span className="inline-flex rounded-full bg-gray-200 px-2 py-1 text-[10px] font-bold text-gray-600 dark:bg-slate-600 dark:text-gray-300">
                          HIDDEN
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-600 dark:bg-green-900/30 dark:text-green-400">
                          VISIBLE
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleVisibility(
                              product
                            )
                          }
                          title={
                            product.isVisible ===
                            false
                              ? "Show product"
                              : "Hide product"
                          }
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                            product.isVisible ===
                            false
                              ? "text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
                          }`}
                        >
                          {product.isVisible ===
                          false
                            ? "👁️"
                            : "🙈"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleEditProduct(
                              product
                            )
                          }
                          title="Edit product"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteProduct(
                              product
                            )
                          }
                          title="Delete product"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile products */}
      <div className="space-y-4 md:hidden">
        {products.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow dark:bg-slate-800 dark:text-gray-400">
            No products found.
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product._id}
              className="min-w-0 rounded-xl bg-white p-4 shadow dark:bg-slate-800"
            >
              {/* Product header */}
              <div className="flex min-w-0 items-start gap-3">
                <img
                  src={getImageUrl(
                    product.image
                  )}
                  alt={product.name}
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-gray-800 dark:text-white">
                    {product.name}
                  </h3>

                  <div className="mt-1">
                    <ProductIdDisplay
                      productId={product._id}
                    />
                  </div>

                  {product.isOnSale && (
                    <span className="mt-2 inline-block rounded-full bg-red-100 px-2 py-1 text-[10px] font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      ON SALE
                    </span>
                  )}
                </div>
              </div>

              {/* Product information */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Price */}
                <div className="min-w-0 rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Price
                  </p>

                  <div className="mt-1 min-w-0">
                    <ProductPrice
                      product={product}
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="min-w-0 rounded-lg bg-gray-50 p-3 dark:bg-slate-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Stock
                  </p>

                  <p
                    className={`mt-1 font-semibold ${
                      product.stock > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {product.stock}
                  </p>
                </div>

                {/* Category */}
                <div className="min-w-0 rounded-lg bg-gray-50 p-3 dark:bg-slate-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Category
                  </p>

                  <p className="mt-1 truncate font-medium text-gray-700 dark:text-gray-200">
                    {product.category ||
                      "General"}
                  </p>
                </div>

                {/* Visibility */}
                <div className="min-w-0 rounded-lg bg-gray-50 p-3 dark:bg-slate-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Visibility
                  </p>

                  <p
                    className={`mt-1 font-semibold ${
                      product.isVisible ===
                      false
                        ? "text-gray-500"
                        : "text-green-600"
                    }`}
                  >
                    {product.isVisible ===
                    false
                      ? "Hidden"
                      : "Visible"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() =>
                    handleToggleVisibility(
                      product
                    )
                  }
                  className="flex min-w-0 items-center justify-center gap-1 rounded-lg bg-gray-100 px-2 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                >
                  {product.isVisible ===
                  false
                    ? "👁️"
                    : "🙈"}

                  <span className="truncate">
                    {product.isVisible ===
                    false
                      ? "Show"
                      : "Hide"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleEditProduct(
                      product
                    )
                  }
                  className="flex min-w-0 items-center justify-center gap-1 rounded-lg bg-blue-50 px-2 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                >
                  ✏️
                  <span className="truncate">
                    Edit
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteProduct(
                      product
                    )
                  }
                  className="flex min-w-0 items-center justify-center gap-1 rounded-lg bg-red-50 px-2 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                >
                  🗑️
                  <span className="truncate">
                    Delete
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminProducts;