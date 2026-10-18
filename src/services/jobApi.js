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

export const jobApi = {
  // Get all jobs (admin)
  getAllJobsAdmin: async (filters = {}) => {
    try {
      const params = {};
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      if (filters.search && filters.search.trim()) params.search = filters.search.trim();
      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.approvalStatus && filters.approvalStatus !== "all") {
        params.approvalStatus = filters.approvalStatus;
      }

      const response = await api.get("/jobs/all", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching jobs (admin):", error);
      throw error;
    }
  },

  // Get all jobs
  getAllJobs: async (params = {}) => {
    try {
      const response = await api.get("/jobs", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }
  },

  // Get jobs created by the authenticated employer
  getMyJobs: async (params = {}) => {
    try {
      const response = await api.get("/jobs/my-jobs", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching my jobs:", error);
      throw error;
    }
  },

  // Get single job
  getJobById: async (id) => {
    try {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching job:", error);
      throw error;
    }
  },

  // Create new job
  createJob: async (jobData) => {
    try {
      const response = await api.post("/jobs", jobData);
      return response.data;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  },

  // Update job
  updateJob: async (id, jobData) => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      console.error("Error updating job:", error);
      throw error;
    }
  },

  // Delete job
  deleteJob: async (id) => {
    try {
      const response = await api.delete(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting job:", error);
      throw error;
    }
  },

  // Update job status (for admin approval/rejection)
  updateJobStatus: async (id, statusOrPayload) => {
    try {
      const payload =
        typeof statusOrPayload === "string"
          ? { status: statusOrPayload }
          : statusOrPayload;
      const response = await api.patch(`/jobs/${id}/status`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating job status:", error);
      throw error;
    }
  },
};

export default jobApi;
