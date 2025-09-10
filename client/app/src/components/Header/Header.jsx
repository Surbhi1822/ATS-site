import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { getCurrentUser, logoutUser } from "../../services/auth";

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch user if token exists to prevent unauthorized API calls
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (token) {
      fetchUser();
    } else {
      setUser(null);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data);
    } catch (error) {
      // If getCurrentUser fails, clear user state
      setUser(null);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    navigate("/login");
  };

  return (
    <header className="header heading-responsive">
      <div className="logo">ATS Site</div>
      {user && (
        <div className="nav-right text-responsive">
          <span>Welcome, {user.username}</span>
          <Link to="/change-password">Change Password</Link>
          <button className="logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
