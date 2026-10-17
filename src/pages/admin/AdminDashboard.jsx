import React, { useState, useEffect } from "react";
import DashboardStats from "../../components/admin/DashboardStats";
import { API_URL } from "../../utils/apiConfig";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    recentActivity: 0,
  });
  const [recentStatusChanges, setRecentStatusChanges] = useState([]);

  const fetchStats = async () => {
    try {
      // Get real statistics from API
      const statsResponse = await fetch(`${API_URL}/users/statistics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          totalUsers: statsData.data.totalUsers || 0,
          totalJobs: statsData.data.totalJobs || 0,
          totalApplications: statsData.data.totalApplications || 0,
          recentActivity: statsData.data.recentActivity || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to zeros if API fails
      setStats({
        totalUsers: 0,
        totalJobs: 0,
        totalApplications: 0,
        recentActivity: 0,
      });
    }
  };

  // Listen for status changes across the platform
  useEffect(() => {
    const handleStatusChange = (event) => {
      console.log("🔍 AdminDashboard: Tracking status change", event.detail);

      const statusChange = {
        id: Date.now(),
        applicationId: event.detail?.applicationId,
        applicantEmail: event.detail?.applicantEmail,
        jobId: event.detail?.jobId,
        previousStatus: event.detail?.previousStatus,
        newStatus: event.detail?.newStatus,
        timestamp: event.detail?.timestamp || new Date().toISOString(),
        trackedBy: "Admin",
      };

      // Add to recent status changes
      setRecentStatusChanges((prev) => [statusChange, ...prev.slice(0, 9)]); // Keep last 10 changes

      // Update activity count
      setStats((prev) => ({
        ...prev,
        recentActivity: prev.recentActivity + 1,
      }));
    };

    const handleStorageChange = (event) => {
      if (event.key === "applicationStatusUpdate") {
        const statusUpdate = JSON.parse(event.newValue);
        handleStatusChange({ detail: statusUpdate });
      }
    };

    window.addEventListener("applicationStatusUpdated", handleStatusChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "applicationStatusUpdated",
        handleStatusChange
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const fetchStatsAsync = async () => {
      await fetchStats();
    };
    fetchStatsAsync();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of users, jobs, and applications
        </p>
      </div>

      <DashboardStats stats={stats} />

      {/* Recent Status Changes Tracking */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Status Changes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Real-time tracking of application status updates across the
              platform
            </p>
          </div>
          <div className="p-6">
            {recentStatusChanges.length > 0 ? (
              <div className="space-y-3">
                {recentStatusChanges.map((change) => (
                  <div
                    key={change.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Application #{change.applicationId}
                        </p>
                        <p className="text-xs text-gray-500">
                          {change.applicantEmail} • Job #{change.jobId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {change.previousStatus}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {change.newStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(change.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  No status changes detected yet. Activity will appear here when
                  employers update application statuses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
