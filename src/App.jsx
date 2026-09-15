import React from "react";

import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Companylogo from "./components/Companylogo";
import Products from "./components/Products";
import CTA from "./components/CTA";
import Appdownloaded from "./components/Appdownloaded";
import Footer from "./components/Footer";
import Imageslider from "./components/Imageslider";
import AnnouncementBar from "./components/AnnouncementBar";
import SaleProducts from "./components/SaleProducts";
import CategorySection from "./components/CategorySection";

import Aboutus from "./pages/Aboutus";
import Product_page from "./pages/Product_page";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import Profile from "./pages/Profile";

import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminOrderDetails from "./admin/AdminOrderDetails";
import AdminUsers from "./admin/AdminUsers";
import AdminUserDetails from "./admin/AdminUserDetails";
import AdminSettings from "./admin/AdminSettings";

import AdminProtectedRoute from "./components/AdminProtectedRoute";
import ProtectedRoute from "./components/ProtectedRoute";



import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  // ==========================================
  // HOME PAGE
  // ==========================================

  {
    path: "/",
    element: (
      <>
        <Navbar />
        <AnnouncementBar />
        <Imageslider />
        <SaleProducts />
        <CategorySection />
        <Products />
        <Hero />
        <Companylogo />
        <CTA />
        <Appdownloaded />
        <Footer />
      </>
    ),
  },

  // ==========================================
  // ABOUT US
  // ==========================================

  {
    path: "/Aboutus",
    element: <Aboutus />,
  },

  // ==========================================
  // ALL PRODUCTS
  // ==========================================

  {
    path: "/Product_page",
    element: <Product_page />,
  },

  // ==========================================
  // REGISTER
  // ==========================================

  {
    path: "/Register",
    element: <Register />,
  },

  // ==========================================
  // LOGIN
  // ==========================================

  {
    path: "/Login",
    element: <Login />,
  },

  // ==========================================
  // PROTECTED CUSTOMER ROUTES
  // ==========================================

  {
    element: <ProtectedRoute />,

    children: [
      // ==========================================
      // PROFILE
      // ==========================================

      {
        path: "/profile",

        element: (
          <>
            <Navbar />

            <Profile />

            <Footer />
          </>
        ),
      },

      // ==========================================
      // MY ORDERS
      // ==========================================

      {
        path: "/orders",

        element: (
          <>
            <Navbar />

            <Orders />

            <Footer />
          </>
        ),
      },

      // ==========================================
      // CUSTOMER ORDER DETAILS
      // ==========================================

      {
        path: "/orders/:id",

        element: (
          <>
            <Navbar />

            <OrderDetails />

            <Footer />
          </>
        ),
      },
    ],
  },

  // ==========================================
  // PRODUCTS
  // ==========================================

  {
    path: "/products",

    element: (
      <>
        <Navbar />

        <Products />
      </>
    ),
  },

  // ==========================================
  // SINGLE PRODUCT
  // ==========================================

  {
    path: "/product/:id",

    element: (
      <>
        <Navbar />

        <ProductDetails />

        <Footer />
      </>
    ),
  },

  // ==========================================
  // CART
  // ==========================================

  {
    path: "/cart",

    element: (
      <>
        <Navbar />

        <Cart />

        <Footer />
      </>
    ),
  },

  // ==========================================
  // CHECKOUT
  // ==========================================

  {
    path: "/checkout",

    element: (
      <>
        <Navbar />

        <Checkout />

        <Footer />
      </>
    ),
  },

  // ==========================================
  // ORDER SUCCESS
  // ==========================================

  {
    path: "/order-success",

    element: (
      <>
        <Navbar />

        <OrderSuccess />

        <Footer />
      </>
    ),
  },

  // ==========================================
  // PROTECTED ADMIN SECTION
  // ==========================================

  {
    element: <AdminProtectedRoute />,

    children: [
      {
        path: "/admin",

        element: <AdminLayout />,

        children: [
          // ==========================================
          // ADMIN DASHBOARD
          // ==========================================

          {
            index: true,

            element: <AdminDashboard />,
          },

          // ==========================================
          // ADMIN PRODUCTS
          // ==========================================

          {
            path: "products",

            element: <AdminProducts />,
          },

          // ==========================================
          // ADMIN ORDERS
          // ==========================================

          {
            path: "orders",

            element: <AdminOrders />,
          },

          // ==========================================
          // ADMIN ORDER DETAILS
          // ==========================================

          {
            path: "orders/:id",

            element: <AdminOrderDetails />,
          },

          // ==========================================
          // ADMIN USERS
          // ==========================================

          {
            path: "users",

            element: <AdminUsers />,
          },

          // ==========================================
          // ADMIN USER DETAILS
          // ==========================================

          {
            path: "users/:id",

            element: <AdminUserDetails />,
          },

          // ==========================================
          // ADMIN SETTINGS
          // ==========================================

          {
            path: "settings",

            element: <AdminSettings />,
          },
        ],
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;