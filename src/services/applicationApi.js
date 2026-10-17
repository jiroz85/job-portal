import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const applicationApi = {
  // Get all applications (admin only)
  getAllApplications: async (params = {}) => {
    try {
      const response = await api.get("/applications", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching applications:", error);
      throw error;
    }
  },

  // Get single application
  getApplicationById: async (id) => {
    try {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching application:", error);
      throw error;
    }
  },

  // Create new application
  createApplication: async (applicationData) => {
    try {
      const response = await api.post("/applications", applicationData);
      return response.data;
    } catch (error) {
      console.error("Error creating application:", error);
      throw error;
    }
  },

  // Update application
  updateApplication: async (id, applicationData) => {
    try {
      const response = await api.put(`/applications/${id}`, applicationData);
      return response.data;
    } catch (error) {
      console.error("Error updating application:", error);
      throw error;
    }
  },

  // Update application status
  updateApplicationStatus: async (id, status) => {
    try {
      const response = await api.patch(`/applications/${id}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating application status:", error);
      throw error;
    }
  },

  // Delete application
  deleteApplication: async (id) => {
    try {
      const response = await api.delete(`/applications/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting application:", error);
      throw error;
    }
  },

  // Get applications by email
  getApplicationsByEmail: async (email) => {
    try {
      const response = await api.get(`/applications/email/${email}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching applications by email:", error);
      throw error;
    }
  },
};

export default applicationApi;
