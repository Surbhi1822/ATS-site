import api from "./api";

export const loginUser = async ({ email, password }) => {
  try {
    const response = await api.post("/login/", { email, password });

    // Clear any existing tokens first
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");

    // Set new tokens
    localStorage.setItem("ACCESS_TOKEN", response.data.access);
    localStorage.setItem("REFRESH_TOKEN", response.data.refresh);

    return response.data;
  } catch (error) {
    // Only clear tokens on actual login failure, not on must_change_password
    if (!error.response?.data?.must_change_password) {
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");
    }

    if (error.response?.data) {
      // Handle standardized error responses
      if (error.response.data.detail) {
        // Direct error message from backend (like "Invalid email or password")
        throw { detail: error.response.data.detail };
      } else if (error.response.data.details) {
        throw error.response.data.details;
      } else if (error.response.data.message) {
        throw { detail: error.response.data.message };
      } else {
        throw error.response.data;
      }
    } else if (error.request) {
      throw { detail: "Network error. Please check your connection." };
    } else {
      throw { detail: "An unexpected error occurred." };
    }
  }
};

export const logoutUser = () => {
  localStorage.removeItem("ACCESS_TOKEN");
  localStorage.removeItem("REFRESH_TOKEN");
};

export const getCurrentUser = async () => {
  try {
    // Check if token exists before making the request
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (!token) {
      return null;
    }

    const response = await api.get("/profile/");
    return response.data;
  } catch (error) {
    // Clear tokens if getCurrentUser fails
    if (error.response?.status === 401) {
      localStorage.removeItem("ACCESS_TOKEN");
      localStorage.removeItem("REFRESH_TOKEN");
    }
    return null;
  }
};

export const changePassword = async ({
  oldPassword,
  newPassword,
  confirmPassword,
}) => {
  try {
    const response = await api.post("/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });

    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");

    return response.data;
  } catch (error) {
    if (error.response?.data) {
      // Handle standardized error responses - check detail first (Django standard)
      if (error.response.data.detail) {
        throw { detail: error.response.data.detail };
      } else if (error.response.data.details) {
        throw error.response.data.details;
      } else if (error.response.data.message) {
        throw { detail: error.response.data.message };
      } else {
        // Return the raw error data for Form.jsx to parse field-specific errors
        throw error.response.data;
      }
    } else if (error.request) {
      throw { detail: "Network error. Please check your connection and try again." };
    } else {
      throw { detail: "An unexpected error occurred during password change." };
    }
  }
};