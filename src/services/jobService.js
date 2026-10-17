import axios from "axios";
import { API_URL as API_BASE_URL } from "../utils/apiConfig";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const jobService = {
  // Get all jobs (public)
  getAllJobs: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs`, { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }
  },

  // Get jobs created by the authenticated employer
  getMyJobs: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/my-jobs`, {
        headers: getAuthHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching my jobs:", error);
      throw error;
    }
  },

  // Get single job
  getJobById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching job:", error);
      throw error;
    }
  },

  // Create new job
  createJob: async (jobData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/jobs`, jobData, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  },

  // Update job
  updateJob: async (id, jobData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/jobs/${id}`, jobData, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating job:", error);
      throw error;
    }
  },

  // Delete job
  deleteJob: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/jobs/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting job:", error);
      throw error;
    }
  },
};
