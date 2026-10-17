import axios from "axios";
import { API_URL as API_BASE_URL } from "../utils/apiConfig";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const resumeService = {
  // Get all resumes for authenticated user
  getMyResumes: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/resumes`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching resumes:", error);
      throw error;
    }
  },

  // Upload a resume file
  uploadResume: async (file) => {
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await axios.post(
        `${API_BASE_URL}/resumes/upload`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading resume:", error);
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to upload resume";
      throw new Error(errorMessage);
    }
  },

  // Download resume file
  downloadResume: async (id, originalName = "Resume.pdf") => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/resumes/${id}/download`,
        {
          headers: getAuthHeaders(),
          responseType: "blob",
        }
      );

      // Trigger browser download
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error("Error downloading resume:", error);
      throw error;
    }
  },

  // Set resume as default
  setDefaultResume: async (id) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/resumes/${id}/default`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error setting default resume:", error);
      throw error;
    }
  },

  // Delete resume
  deleteResume: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/resumes/${id}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting resume:", error);
      throw error;
    }
  },
};

export default resumeService;
