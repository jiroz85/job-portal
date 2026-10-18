import React, { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiShield,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiChevronDown,
  FiBriefcase,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiGlobe,
} from "react-icons/fi";
import userApi from "../../services/userApi";

const UsersManagementEnhanced = () => {
  // Server-side query state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data & loading state
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selected item state
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Notification banners
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  const showFeedback = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Fetch users from server
  const loadUsers = useCallback(
    async (targetPage = page, search = searchTerm, role = roleFilter, status = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const result = await userApi.getAllUsers({
          page: targetPage,
          limit,
          search,
          role,
          status,
          sortBy: "createdAt",
          sortOrder: "DESC",
        });

        setUsers(result.data || []);
        setPagination(
          result.pagination || {
            currentPage: targetPage,
            totalPages: 1,
            totalUsers: (result.data || []).length,
            hasNext: false,
            hasPrev: false,
          }
        );
      } catch (err) {
        console.error("Error loading users:", err);
        setError(err.response?.data?.error || err.message || "Failed to load users from database");
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, roleFilter, statusFilter]
  );

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(page, searchTerm, roleFilter, statusFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadUsers, page, searchTerm, roleFilter, statusFilter]);

  // Handlers for filter controls (always reset to page 1)
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const getRoleBadgeClasses = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
      case "employer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
      case "jobseeker":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Safe parse for JSON helper
  const safeParseJSON = (data) => {
    if (!data) return null;
    if (typeof data === "object") return data;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  // View user details
  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const [detailsRes, activityRes] = await Promise.allSettled([
        userApi.getUserById(user.id),
        userApi.getUserActivity(user.id),
      ]);

      if (detailsRes.status === "fulfilled" && detailsRes.value?.data) {
        setUserDetails(detailsRes.value.data);
      } else {
        setUserDetails(user);
      }

      if (activityRes.status === "fulfilled" && activityRes.value?.data) {
        setUserActivity(activityRes.value.data);
      } else {
        setUserActivity(null);
      }
    } catch (err) {
      console.error("Error fetching user details modal:", err);
      setUserDetails(user);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open role modal
  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  // Submit role update
  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    setActionLoading(true);
    try {
      await userApi.updateUserRole(selectedUser.id, newRole);
      showFeedback("success", `Role for ${selectedUser.name} updated to ${newRole}`);
      setShowRoleModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error("Error updating user role:", err);
      showFeedback("error", err.response?.data?.error || "Failed to update user role");
    } finally {
      setActionLoading(false);
    }
  };

  // Open status modal
  const openStatusModal = (user) => {
    setSelectedUser(user);
    setNewStatus(user.status);
    setShowStatusModal(true);
  };

  // Submit status update
  const handleUpdateStatus = async () => {
    if (!selectedUser || !newStatus) return;
    setActionLoading(true);
    try {
      await userApi.updateUserStatus(selectedUser.id, newStatus);
      showFeedback("success", `Status for ${selectedUser.name} updated to ${newStatus}`);
      setShowStatusModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error("Error updating user status:", err);
      showFeedback("error", err.response?.data?.error || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  // Open delete modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Submit delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await userApi.deleteUser(selectedUser.id);
      showFeedback("success", `User account ${selectedUser.name} (${selectedUser.email}) was deleted`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      showFeedback("error", err.response?.data?.error || "Failed to delete user account");
    } finally {
      setActionLoading(false);
    }
  };

  const employerDetailsParsed = userDetails
    ? safeParseJSON(userDetails.employerDetails) || {}
    : {};

  const skillsList = userDetails
    ? Array.isArray(userDetails.skills)
      ? userDetails.skills
      : safeParseJSON(userDetails.skills) || []
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Manage user accounts, roles, and platform permissions with database-backed pagination.
          </p>
        </div>
        <button
          onClick={() => loadUsers()}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors"
        >
          <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          role="alert"
          className={`flex items-center justify-between p-4 rounded-lg shadow-sm text-sm border ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Dismiss alert"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or location..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Clear search"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="w-full md:w-48 relative">
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="jobseeker">Job Seeker</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48 relative">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="w-full appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading users from database...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">Unable to load users</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">{error}</p>
            <button
              onClick={() => loadUsers()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-900 dark:text-white">No users found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                ? "No accounts match your filter criteria."
                : "No registered users found in the system."}
            </p>
            {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <FiMail className="w-3.5 h-3.5" />
                              <span>{user.email}</span>
                            </div>
                            {user.location && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                <FiMapPin className="w-3 h-3" />
                                <span>{user.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getRoleBadgeClasses(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadgeClasses(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString()
                              : "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <FiClock className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : "Never"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            title="View Full Details"
                            aria-label={`View details for ${user.name}`}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openRoleModal(user)}
                            className="p-1.5 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 rounded hover:bg-purple-50 dark:hover:bg-purple-900/30"
                            title="Change Role"
                            aria-label={`Change role for ${user.name}`}
                          >
                            <FiShield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openStatusModal(user)}
                            className="p-1.5 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                            title="Change Account Status"
                            aria-label={`Change status for ${user.name}`}
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                            title="Delete User"
                            aria-label={`Delete user ${user.name}`}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {(pagination.currentPage - 1) * limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.min(pagination.currentPage * limit, pagination.totalUsers)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {pagination.totalUsers}
                </span>{" "}
                users
              </div>

              <div className="inline-flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || pagination.currentPage <= 1 || loading}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300 px-2">
                  Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext || pagination.currentPage >= pagination.totalPages || loading}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    User ID #{selectedUser.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setUserDetails(null);
                  setUserActivity(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Close dialog"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile & activity...</p>
              </div>
            ) : (
              <div className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                {/* Account overview grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Email Address</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <FiMail className="w-3.5 h-3.5 text-gray-400" />
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Phone Number</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                      {userDetails?.phone || selectedUser.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Location</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                      {userDetails?.location || selectedUser.location || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Member Since</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Account Role</span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getRoleBadgeClasses(
                          selectedUser.role
                        )}`}
                      >
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Account Status</span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusBadgeClasses(
                          selectedUser.status
                        )}`}
                      >
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio section if available */}
                {(userDetails?.bio || selectedUser.bio) && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Bio
                    </h4>
                    <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                      {userDetails?.bio || selectedUser.bio}
                    </p>
                  </div>
                )}

                {/* Employer metadata section */}
                {selectedUser.role === "employer" && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Company Profile
                    </h4>
                    <div className="grid grid-cols-2 gap-3 bg-blue-50/50 dark:bg-blue-900/20 p-3.5 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Company Name</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                          {employerDetailsParsed.company || selectedUser.company || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Industry</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                          {employerDetailsParsed.industry || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Company Size</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                          {employerDetailsParsed.companySize || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Website</span>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                          {employerDetailsParsed.website || selectedUser.website ? (
                            <a
                              href={employerDetailsParsed.website || selectedUser.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <FiGlobe className="w-3.5 h-3.5" />
                              {employerDetailsParsed.website || selectedUser.website}
                            </a>
                          ) : (
                            "Not specified"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Seeker Skills */}
                {selectedUser.role === "jobseeker" && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Skills
                    </h4>
                    {skillsList && skillsList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {skillsList.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                          >
                            {typeof skill === "string" ? skill : skill.name || JSON.stringify(skill)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No skills listed on this profile.
                      </p>
                    )}
                  </div>
                )}

                {/* Application Activity History */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Application History
                  </h4>
                  {userActivity?.activity?.applications && userActivity.activity.applications.length > 0 ? (
                    <div className="space-y-2">
                      {userActivity.activity.applications.map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <FiBriefcase className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {app.job?.title || `Job #${app.jobId}`}
                              </p>
                              {app.job?.company && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {app.job.company}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                                app.status === "accepted"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                  : app.status === "rejected"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              }`}
                            >
                              {app.status}
                            </span>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No applications recorded for this user.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setUserDetails(null);
                  setUserActivity(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Update User Role
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Select a new role for{" "}
              <strong className="text-gray-900 dark:text-white">{selectedUser.name}</strong> (
              {selectedUser.email}).
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Assigned Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="jobseeker">Job Seeker</option>
                <option value="employer">Employer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {newRole === "admin" && (
              <div className="p-3 mb-4 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-300 flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Administrators have unrestricted access to all data, jobs, and user management.</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={actionLoading || newRole === selectedUser.role}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm Role Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Update Account Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Select an account status for{" "}
              <strong className="text-gray-900 dark:text-white">{selectedUser.name}</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Account Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="active">Active (Normal access)</option>
                <option value="inactive">Inactive (Limited access)</option>
                <option value="blocked">Blocked (Suspended account)</option>
              </select>
            </div>

            {newStatus === "blocked" && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Blocked users cannot log in or submit applications/jobs.</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={actionLoading || newStatus === selectedUser.status}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete User Account
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to permanently delete{" "}
              <strong className="text-gray-900 dark:text-white">{selectedUser.name}</strong> (
              {selectedUser.email})? This action cannot be undone and deletes all related platform
              records.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagementEnhanced;
