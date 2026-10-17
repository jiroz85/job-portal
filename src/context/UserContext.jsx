import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/apiConfig";

// Configure axios with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

const UserContext = createContext();

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUsers must be used within a UserProvider");
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get auth token
  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Fetch all users
  const fetchUsers = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/api/users", {
        ...getAuthConfig(),
        params,
      });

      // Handle different response formats from backend
      const usersData =
        response.data?.data?.users ||
        response.data?.users ||
        response.data ||
        [];
      setUsers(usersData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to fetch users";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/api/users/statistics", getAuthConfig());

      // Handle different response formats from backend
      const statsData = response.data?.data || response.data || {};
      setUserStats(statsData);
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to fetch user statistics";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user by ID
  const getUserById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/users/${id}`, getAuthConfig());
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to fetch user";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user activity
  const getUserActivity = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/api/users/${id}/activity`,
        getAuthConfig()
      );
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to fetch user activity";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const updateUser = async (id, userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(
        `/api/users/${id}`,
        userData,
        getAuthConfig()
      );

      // Update user in local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === id ? { ...user, ...response.data.data } : user
        )
      );

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to update user";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const updateUserRole = async (id, role) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(
        `/api/users/${id}/role`,
        { role },
        getAuthConfig()
      );

      // Update user in local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === id ? { ...user, role } : user))
      );

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to update user role";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user status
  const updateUserStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(
        `/api/users/${id}/status`,
        { status },
        getAuthConfig()
      );

      // Update user in local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === id ? { ...user, status } : user))
      );

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Failed to update user status";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/api/users/${id}`, getAuthConfig());

      // Remove user from local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to delete user";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get all users (for admin management)
  const getAllUsers = () => {
    return users;
  };

  // Get user statistics
  const getUserStatistics = () => {
    return userStats;
  };

  // Initialize by fetching real data from database
  useEffect(() => {
    // Only fetch users if we have an auth token (user is logged in) AND user is admin
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Only fetch admin data if user is actually an admin
        if (user.role === "admin") {
          fetchUsers().catch((err) => {
            console.log("Failed to fetch users:", err.message);
          });
          fetchUserStats().catch((err) => {
            console.log("Failed to fetch user stats:", err.message);
          });
        }
      } catch (err) {
        console.log("Failed to parse user data:", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    users,
    userStats,
    loading,
    error,
    fetchUsers,
    fetchUserStats,
    getUserById,
    getUserActivity,
    updateUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    getAllUsers,
    getUserStatistics,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
