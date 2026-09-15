import React, { createContext, useContext, useState } from "react";

// Create authentication context
const AuthContext = createContext();

// Authentication provider
export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {

    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch (error) {

      localStorage.removeItem("user");

      return null;
    }

  });


  // Save login information
  const login = (userData, token) => {

    localStorage.setItem(
      "user",
      JSON.stringify(userData)
    );

    localStorage.setItem(
      "token",
      token
    );

    setUser(userData);

  };


  // Logout user
  const logout = () => {

    localStorage.removeItem("user");

    localStorage.removeItem("token");

    setUser(null);

  };


  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isLoggedIn: !!user,
      }}
    >

      {children}

    </AuthContext.Provider>
  );

};


// Custom authentication hook
export const useAuth = () => {

  return useContext(AuthContext);

};