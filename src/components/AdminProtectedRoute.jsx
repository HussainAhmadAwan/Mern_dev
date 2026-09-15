import { Navigate, Outlet } from "react-router-dom";

// Protect admin routes
const AdminProtectedRoute = () => {

  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");


  // Redirect to login if authentication data is missing
  if (!token || !userData) {

    return <Navigate to="/Login" replace />;

  }


  try {

    const user = JSON.parse(userData);


    // Redirect customers to home
    if (user.role !== "admin") {

      return <Navigate to="/" replace />;

    }


    // Allow admin access
    return <Outlet />;

  } catch (error) {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/Login" replace />;

  }

};


export default AdminProtectedRoute;