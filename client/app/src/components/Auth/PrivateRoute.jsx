import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../../services/auth";
import LoadingIndicator from "../LoadingIndicator/LoadingIndicator";

const PrivateRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("ACCESS_TOKEN");

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser();
        setUser(userData);

        // Handle password change requirements and access control
        const currentPath = window.location.pathname;

        if (userData?.must_change_password) {
          // User must change password - only allow access to change-password page
          if (currentPath !== "/change-password") {
            window.location.href = "/change-password";
            return;
          }
        } else {
          // User has already changed password - prevent access to change-password page
          if (currentPath === "/change-password") {
            window.location.href = "/dashboard";
            return;
          }
        }
      } catch (error) {
        // Token is invalid, clear storage
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <LoadingIndicator />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
