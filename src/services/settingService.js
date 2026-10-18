import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const settingService = {
  // Get all system settings (admin only)
  getSettings: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/settings`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching system settings:", error);
      throw error;
    }
  },

  // Update system settings (admin only)
  updateSettings: async (settingsData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/settings`, settingsData, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error updating system settings:", error);
      throw error;
    }
  },

  // Reset category or all settings to defaults (admin only)
  resetSettings: async (category = "all") => {
    try {
      const url = category && category !== "all"
        ? `${API_BASE_URL}/api/settings/reset/${category}`
        : `${API_BASE_URL}/api/settings/reset`;

      const response = await axios.post(url, {}, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error resetting ${category} settings:`, error);
      throw error;
    }
  },
};

export default settingService;
