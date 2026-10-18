import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

const userApi = {
  // Get all users (admin only)
  getAllUsers: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.role && filters.role !== "all") params.append("role", filters.role);
      if (filters.status && filters.status !== "all") params.append("status", filters.status);
      if (filters.search && filters.search.trim()) params.append("search", filters.search.trim());
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

      const response = await axios.get(`${API_BASE_URL}/api/users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Handle the backend response format: { success: true, data: { users: [], pagination: {} } }
      return {
        success: true,
        data: response.data.data?.users || [],
        pagination: response.data.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalUsers: (response.data.data?.users || []).length,
          hasNext: false,
          hasPrev: false,
        },
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

  // Get user activity (admin only)
  getUserActivity: async (userId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/${userId}/activity`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user activity:", error);
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

  // Get user and platform statistics (admin only)
  getUserStatistics: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.dateRange && filters.dateRange !== "all") {
        params.append("dateRange", filters.dateRange);
      }
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await axios.get(
        `${API_BASE_URL}/api/users/statistics${queryString}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user statistics:", error);
      throw error;
    }
  },

  // Alias for backward compatibility
  getUserStats: async (filters = {}) => {
    return userApi.getUserStatistics(filters);
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
