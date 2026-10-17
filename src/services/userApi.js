import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

const userApi = {
  // Get all users (admin only)
  getAllUsers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await axios.get(`${API_BASE_URL}/api/users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Handle the backend response format: { success: true, data: { users: [], pagination: {} } }
      return {
        data: response.data.data?.users || [],
        pagination: response.data.data?.pagination || {},
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  },

  // Update user profile
  updateUser: async (userData) => {
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
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Update user role (admin only)
  updateUserRole: async (userId, newRole) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },

  // Update user status (admin only)
  updateUserStatus: async (userId, status) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/users/${userId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
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
      console.error("Error changing password:", error);
      throw error;
    }
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await axios.post(
        `${API_BASE_URL}/api/users/upload-picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  },

  // Search users
  searchUsers: async (query, filters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append("q", query);

      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await axios.get(
        `${API_BASE_URL}/api/users/search?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  // Export users data
  exportUsers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.role) params.append("role", filters.role);
      if (filters.status) params.append("status", filters.status);
      if (filters.format) params.append("format", filters.format);

      const response = await axios.get(
        `${API_BASE_URL}/api/users/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `users-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      return response.data;
    } catch (error) {
      console.error("Error exporting users:", error);
      throw error;
    }
  },
};

export default userApi;
