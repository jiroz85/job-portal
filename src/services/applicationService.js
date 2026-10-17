import axios from "axios";
import { API_URL as API_BASE_URL } from "../utils/apiConfig";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const applicationService = {
  // Get all applications (admin/employer)
  getAllApplications: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications`, {
        params,
        headers: {
          ...getAuthHeaders(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching applications:", error);
      throw error;
    }
  },

  // Get single application
  getApplicationById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching application:", error);
      throw error;
    }
  },

  // Submit application - REQUIRES AUTHENTICATED USER (Supports FormData with real resume file)
  submitApplication: async (applicationData) => {
    try {
      let requestData;
      let headers = {
        ...getAuthHeaders(),
      };

      if (applicationData.resume instanceof File) {
        const formData = new FormData();
        Object.keys(applicationData).forEach((key) => {
          if (key === "resume" && applicationData.resume) {
            formData.append("resume", applicationData.resume);
          } else if (
            applicationData[key] !== undefined &&
            applicationData[key] !== null
          ) {
            formData.append(key, applicationData[key]);
          }
        });
        requestData = formData;
        headers["Content-Type"] = "multipart/form-data";
      } else {
        requestData = applicationData;
      }

      const response = await axios.post(
        `${API_BASE_URL}/applications`,
        requestData,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting application:", error);
      const errMsg =
        error.response?.data?.error || error.message || "Failed to submit application";
      throw new Error(errMsg);
    }
  },

  // Download application resume (Employer or Applicant or Admin)
  downloadResume: async (applicationId, applicantName = "Applicant") => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/applications/${applicationId}/resume`,
        {
          headers: getAuthHeaders(),
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = `${applicantName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume.pdf`;
      link.setAttribute("download", safeName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error("Error downloading application resume:", error);
      throw error;
    }
  },

  // Update application status
  updateApplicationStatus: async (id, statusData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/applications/${id}/status`,
        statusData,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating application status:", error);
      throw error;
    }
  },

  // Get applications by email
  getApplicationsByEmail: async (email) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/applications/email/${email}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching applications by email:", error);
      throw error;
    }
  },

  // Get applications by job ID
  getApplicationsByJobId: async (jobId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/applications?jobId=${jobId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching applications by job ID:", error);
      throw error;
    }
  },

  // Delete application
  deleteApplication: async (id) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/applications/${id}`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting application:", error);
      throw error;
    }
  },
};
