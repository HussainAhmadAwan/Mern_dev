require("dotenv").config();


const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);


const mongoose = require("mongoose");

const Product = require("../models/Product");

const products = [
  {
    name: "Premium Headphones",
    price: 199.99,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    description: "Noise-cancelling wireless headphones.",
    category: "Electronics",
    stock: 20,
    rating: 4.8,
  },

  {
    name: "Smart Watch",
    price: 249.99,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    description: "Track fitness and receive notifications.",
    category: "Electronics",
    stock: 15,
    rating: 4.7,
  },

  {
    name: "Wireless Speaker",
    price: 129.99,
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
    description: "360° immersive sound with deep bass.",
    category: "Electronics",
    stock: 25,
    rating: 4.5,
  },

  {
    name: "Gaming Mouse",
    price: 79.99,
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80",
    description: "RGB gaming mouse with programmable buttons.",
    category: "Gaming",
    stock: 35,
    rating: 4.6,
  },

  {
    name: "Mechanical Keyboard",
    price: 109.99,
    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=600&q=80",
    description: "Mechanical keyboard with RGB lighting.",
    category: "Gaming",
    stock: 18,
    rating: 4.8,
  },

  {
    name: "4K Monitor",
    price: 399.99,
    image:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    description: "27-inch Ultra HD monitor for work and gaming.",
    category: "Electronics",
    stock: 10,
    rating: 4.9,
  },
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Product.deleteMany();

    await Product.insertMany(products);

    console.log("✅ Products Imported Successfully");

    process.exit();
  } catch (error) {
    console.log(error);

    process.exit(1);
  }
};

importData();