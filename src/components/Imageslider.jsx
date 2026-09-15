import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CategorySidebar from "./CategorySidebar";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80",
    title: "Smart Watch Collection",
    description:
      "Discover the latest smart watches with amazing features.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1600&q=80",
    title: "Premium Headphones",
    description:
      "Experience crystal-clear sound with noise cancellation.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80",
    title: "Latest Sneakers",
    description:
      "Comfort and style for every step you take.",
  },
];

const Imageslider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const navigate = useNavigate();

  // Automatically move to the next slide every 3 seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  return (
    <section className="bg-gray-50 px-4 py-2 transition-colors duration-300 dark:bg-slate-900 sm:px-6 sm:py-3">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 lg:flex-row lg:items-stretch">

        {/* Category sidebar */}
        <div className="order-2 flex w-full lg:order-1 lg:w-56 xl:w-64">
          <CategorySidebar />
        </div>

        {/* Image slider */}
        <div className="relative order-1 h-[255px] w-full overflow-hidden rounded-2xl shadow-lg sm:h-[315px] lg:order-2 lg:h-[360px] lg:flex-1">

          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="h-full w-full object-cover"
              />

              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/45" />

              {/* Slide content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
                <h1 className="mb-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
                  {slide.title}
                </h1>

                <p className="mb-4 max-w-xl text-sm sm:text-base lg:text-lg">
                  {slide.description}
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/Product_page")}
                  className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 sm:px-6 sm:py-2.5 sm:text-base"
                >
                  Shop Now
                </button>
              </div>
            </div>
          ))}

          {/* Previous button */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-xl text-white transition hover:bg-white/50 sm:left-5 sm:h-11 sm:w-11 sm:text-2xl"
          >
            ❮
          </button>

          {/* Next button */}
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 text-xl text-white transition hover:bg-white/50 sm:right-5 sm:h-11 sm:w-11 sm:text-2xl"
          >
            ❯
          </button>

          {/* Slide navigation dots */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 sm:bottom-4 sm:gap-2.5">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition sm:h-3 sm:w-3 ${
                  index === currentSlide
                    ? "bg-orange-500"
                    : "bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Imageslider;