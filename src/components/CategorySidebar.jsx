import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

const CategorySidebar = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await API.get("/api/products");

        const products = response.data.products || [];

        const uniqueCategories = [
          ...new Set(
            products
              .map((product) => product.category?.trim())
              .filter(Boolean)
          ),
        ];

        setCategories(uniqueCategories);
      } catch (error) {
        console.log("Failed to load categories:", error);
      }
    };

    fetchCategories();
  }, []);

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:w-56 xl:w-64">
      {/* Category heading */}
      <div className="shrink-0 border-b border-gray-200 px-4 py-3 dark:border-slate-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Categories
        </h2>
      </div>

      {/* Category list */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {categories.length > 0 ? (
          categories.map((category) => (
            <Link
              key={category}
              to={`/Product_page?category=${encodeURIComponent(category)}`}
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-orange-50 hover:text-orange-600 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-orange-400"
            >
              <span className="mr-2">›</span>
              {category}
            </Link>
          ))
        ) : (
          <p className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
            No categories available.
          </p>
        )}
      </div>
    </aside>
  );
};

export default CategorySidebar;