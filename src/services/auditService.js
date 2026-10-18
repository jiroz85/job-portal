import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

const auditService = {
  // Log admin actions for audit trail
  logAction: async (actionData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/audit/log`,
        actionData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error logging audit action:", error);
      throw error;
    }
  },

  // Get audit logs for admin dashboard
  getAuditLogs: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.action && filters.action !== "all") params.append("action", filters.action);
      if (filters.userId && filters.userId !== "all") params.append("userId", filters.userId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

      const response = await axios.get(
        `${API_BASE_URL}/api/audit/logs?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      throw error;
    }
  },

  // Get user activity history
  getUserActivity: async (userId, filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await axios.get(
        `${API_BASE_URL}/api/audit/user/${userId}/activity?${params}`,
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

  // Get system statistics
  getSystemStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/audit/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching system stats:", error);
      throw error;
    }
  },

  // Export audit logs
  exportLogs: async (filters = {}) => {
    try {
      const params = new URLSearchParams();

      if (filters.action && filters.action !== "all") params.append("action", filters.action);
      if (filters.userId && filters.userId !== "all") params.append("userId", filters.userId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.format) params.append("format", filters.format);

      const response = await axios.get(
        `${API_BASE_URL}/api/audit/export?${params}`,
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
        `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      return response.data;
    } catch (error) {
      console.error("Error exporting audit logs:", error);
      throw error;
    }
  },
};

export default auditService;
