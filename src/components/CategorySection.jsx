import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

const CategorySection = () => {
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

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 px-4 py-10 transition-colors duration-300 dark:bg-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-7xl">

        {/* Section heading */}
        <div className="mb-7 flex items-end justify-between gap-4 sm:mb-9">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Shop by Category
            </h2>

            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              Explore products from your favorite categories.
            </p>
          </div>

          <Link
            to="/Product_page"
            className="shrink-0 text-sm font-semibold text-orange-600 transition hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 sm:text-base"
          >
            All Products →
          </Link>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/Product_page?category=${encodeURIComponent(category)}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-orange-500/50"
            >
              {/* Category icon */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-2xl transition-transform duration-300 group-hover:scale-110 dark:bg-orange-900/30">
                🛍️
              </div>

              {/* Category name */}
              <h3 className="mt-4 line-clamp-2 text-sm font-semibold text-gray-800 transition-colors group-hover:text-orange-600 dark:text-gray-200 dark:group-hover:text-orange-400 sm:text-base">
                {category}
              </h3>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Shop now →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;