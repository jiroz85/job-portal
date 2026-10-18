import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const notificationService = {
  // Fetch current user's notifications with pagination and filters
  getNotifications: async (params = {}) => {
    try {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append("page", params.page);
      if (params.limit) searchParams.append("limit", params.limit);
      if (params.filter && params.filter !== "all") searchParams.append("filter", params.filter);
      if (params.search && params.search.trim()) searchParams.append("search", params.search.trim());
      if (params.type && params.type !== "all") searchParams.append("type", params.type);
      if (params.priority && params.priority !== "all") searchParams.append("priority", params.priority);

      const query = searchParams.toString();
      const url = query ? `${API_BASE_URL}/api/notifications?${query}` : `${API_BASE_URL}/api/notifications`;

      const response = await axios.get(url, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // Get unread notification count for current user
  getUnreadCount: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      throw error;
    }
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as read:`, error);
      throw error;
    }
  },

  // Mark single notification as unread
  markAsUnread: async (notificationId) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/notifications/${notificationId}/unread`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error marking notification ${notificationId} as unread:`, error);
      throw error;
    }
  },

  // Mark all user notifications as read
  markAllAsRead: async () => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/notifications/mark-all-read`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  },

  // Delete a single notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/notifications/${notificationId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting notification ${notificationId}:`, error);
      throw error;
    }
  },

  // Clear all notifications for user
  clearAllNotifications: async () => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/notifications/clear-all`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      throw error;
    }
  },

  // Create a new notification (admin or system dispatch)
  createNotification: async (notificationData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/notifications`,
        notificationData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },
};

export default notificationService;
