/**
 * Centralized API configuration for production and development.
 *
 * Configured through Vite's VITE_API_URL environment variable.
 * In production (e.g. Vercel), VITE_API_URL must point to the backend (e.g. Render).
 * In development, defaults to http://localhost:3001.
 */

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/$/, "");
  }

  // Prevent accidental fallback to localhost in production builds
  if (import.meta.env.PROD) {
    console.error(
      "[Production Deployment Warning] VITE_API_URL environment variable is missing. " +
        "Set VITE_API_URL in your Vercel project environment variables to point to your backend."
    );
    return "";
  }

  return "http://localhost:3001";
};

export const API_BASE_URL = getApiBaseUrl();
export const API_URL = API_BASE_URL ? `${API_BASE_URL}/api` : "/api";

export default API_BASE_URL;
