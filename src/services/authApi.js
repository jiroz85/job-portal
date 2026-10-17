import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

const authApi = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        userData
      );
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  },
};

export default authApi;
