import React, { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiChevronDown,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiGlobe,
  FiLayers,
} from "react-icons/fi";
import userApi from "../../services/userApi";
import jobApi from "../../services/jobApi";

const EmployerManagement = () => {
  // Query state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data & loading state
  const [employers, setEmployers] = useState([]);
  const [employerJobCounts, setEmployerJobCounts] = useState({});
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
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selected item state
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [employerDetails, setEmployerDetails] = useState(null);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Notification banners
  const [notification, setNotification] = useState(null);

  const showFeedback = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Safe JSON parser helper
  const safeParseJSON = (data) => {
    if (!data) return {};
    if (typeof data === "object") return data;
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  };

  // Load employers from backend
  const loadEmployers = useCallback(
    async (targetPage = page, search = searchTerm, status = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const result = await userApi.getAllUsers({
          role: "employer",
          page: targetPage,
          limit,
          search,
          status,
          sortBy: "createdAt",
          sortOrder: "DESC",
        });

        const list = result.data || [];
        setEmployers(list);
        setPagination(
          result.pagination || {
            currentPage: targetPage,
            totalPages: 1,
            totalUsers: list.length,
            hasNext: false,
            hasPrev: false,
          }
        );

        // Fetch real job counts for loaded employers
        if (list.length > 0) {
          const counts = {};
          await Promise.all(
            list.map(async (emp) => {
              try {
                const res = await jobApi.getMyJobs({ employerId: emp.id, limit: 1 });
                counts[emp.id] = res.pagination?.total ?? 0;
              } catch {
                counts[emp.id] = 0;
              }
            })
          );
          setEmployerJobCounts(counts);
        } else {
          setEmployerJobCounts({});
        }
      } catch (err) {
        console.error("Error loading employers:", err);
        setError(err.response?.data?.error || err.message || "Failed to load employers from database");
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, statusFilter]
  );

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployers(page, searchTerm, statusFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadEmployers, page, searchTerm, statusFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPage(1);
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

  const getPlanBadgeClasses = (plan) => {
    switch (plan?.toLowerCase()) {
      case "enterprise":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
      case "premium":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
      case "basic":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // View employer full details
  const handleViewEmployer = async (employer) => {
    setSelectedEmployer(employer);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const [userRes, jobsRes] = await Promise.allSettled([
        userApi.getUserById(employer.id),
        jobApi.getMyJobs({ employerId: employer.id, limit: 10 }),
      ]);

      if (userRes.status === "fulfilled" && userRes.value?.data) {
        setEmployerDetails(userRes.value.data);
      } else {
        setEmployerDetails(employer);
      }

      if (jobsRes.status === "fulfilled" && jobsRes.value?.data) {
        setEmployerJobs(jobsRes.value.data);
      } else {
        setEmployerJobs([]);
      }
    } catch (err) {
      console.error("Error loading employer details:", err);
      setEmployerDetails(employer);
      setEmployerJobs([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Status modal
  const openStatusModal = (employer) => {
    setSelectedEmployer(employer);
    setNewStatus(employer.status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedEmployer || !newStatus) return;
    setActionLoading(true);
    try {
      await userApi.updateUserStatus(selectedEmployer.id, newStatus);
      showFeedback("success", `Account status for ${selectedEmployer.name} updated to ${newStatus}`);
      setShowStatusModal(false);
      setSelectedEmployer(null);
      loadEmployers();
    } catch (err) {
      console.error("Error updating employer status:", err);
      showFeedback("error", err.response?.data?.error || "Failed to update employer status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete modal
  const openDeleteModal = (employer) => {
    setSelectedEmployer(employer);
    setShowDeleteModal(true);
  };

  const handleDeleteEmployer = async () => {
    if (!selectedEmployer) return;
    setActionLoading(true);
    try {
      await userApi.deleteUser(selectedEmployer.id);
      showFeedback("success", `Employer account ${selectedEmployer.name} was successfully deleted`);
      setShowDeleteModal(false);
      setSelectedEmployer(null);
      loadEmployers();
    } catch (err) {
      console.error("Error deleting employer:", err);
      showFeedback("error", err.response?.data?.error || "Failed to delete employer account");
    } finally {
      setActionLoading(false);
    }
  };

  const parsedModalCompany = employerDetails
    ? safeParseJSON(employerDetails.employerDetails)
    : {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Employer Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Manage registered employers, company profiles, job counts, and subscription statuses.
          </p>
        </div>
        <button
          onClick={() => loadEmployers()}
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
              placeholder="Search employers by name, company, or email..."
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

          {/* Status Filter */}
          <div className="w-full md:w-56 relative">
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

      {/* Employers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading employers from database...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <FiAlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-base font-semibold text-gray-900 dark:text-white">Unable to load employers</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">{error}</p>
            <button
              onClick={() => loadEmployers()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : employers.length === 0 ? (
          <div className="p-12 text-center">
            <FiBriefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-900 dark:text-white">No employers found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
              {searchTerm || statusFilter !== "all"
                ? "No employer accounts match your search or filter."
                : "No registered employer accounts found."}
            </p>
            {(searchTerm || statusFilter !== "all") && (
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
                      Employer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Jobs Posted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {employers.map((employer) => {
                    const parsedDetails = safeParseJSON(employer.employerDetails);
                    const companyName =
                      parsedDetails.company || employer.company || "Not specified";
                    const jobsCount = employerJobCounts[employer.id] ?? "...";
                    const plan = employer.subscriptionPlan || "free";

                    return (
                      <tr
                        key={employer.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                              {employer.name ? employer.name.charAt(0).toUpperCase() : "E"}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {employer.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <FiMail className="w-3.5 h-3.5" />
                                <span>{employer.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                          {companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusBadgeClasses(
                              employer.status
                            )}`}
                          >
                            {employer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-1.5">
                            <FiBriefcase className="w-3.5 h-3.5 text-gray-400" />
                            <span>{jobsCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getPlanBadgeClasses(
                              plan
                            )}`}
                          >
                            {plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <FiCalendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              {employer.createdAt
                                ? new Date(employer.createdAt).toLocaleDateString()
                                : "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewEmployer(employer)}
                              className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              title="View Employer Profile & Jobs"
                              aria-label={`View details for ${employer.name}`}
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(employer)}
                              className="p-1.5 text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                              title="Change Account Status"
                              aria-label={`Change status for ${employer.name}`}
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(employer)}
                              className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                              title="Delete Employer Account"
                              aria-label={`Delete employer ${employer.name}`}
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                employers
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

      {/* Employer Details Modal */}
      {showDetailsModal && selectedEmployer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                  {selectedEmployer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {parsedModalCompany.company || selectedEmployer.company || selectedEmployer.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Employer Account #{selectedEmployer.id} • {selectedEmployer.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setEmployerDetails(null);
                  setEmployerJobs([]);
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading company profile & jobs...</p>
              </div>
            ) : (
              <div className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                {/* Company & Account Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Info Box */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-3 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiBriefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Company Details
                    </h4>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Company Name</span>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {parsedModalCompany.company || selectedEmployer.company || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Industry</span>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {parsedModalCompany.industry || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Company Size</span>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {parsedModalCompany.companySize || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Website</span>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {parsedModalCompany.website || selectedEmployer.website ? (
                          <a
                            href={parsedModalCompany.website || selectedEmployer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <FiGlobe className="w-3.5 h-3.5" />
                            {parsedModalCompany.website || selectedEmployer.website}
                          </a>
                        ) : (
                          "Not specified"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Account & Subscription Box */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-3 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiLayers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Account & Subscription
                    </h4>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Contact Person</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedEmployer.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Email & Phone</span>
                      <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center gap-1">
                        <FiMail className="w-3 h-3 text-gray-400" /> {selectedEmployer.email}
                      </p>
                      {selectedEmployer.phone && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                          <FiPhone className="w-3 h-3 text-gray-400" /> {selectedEmployer.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                      <div className="mt-0.5">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getStatusBadgeClasses(
                            selectedEmployer.status
                          )}`}
                        >
                          {selectedEmployer.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Subscription Plan</span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getPlanBadgeClasses(
                            selectedEmployer.subscriptionPlan || "free"
                          )}`}
                        >
                          {selectedEmployer.subscriptionPlan || "free"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedEmployer.subscriptionExpires
                            ? `Expires: ${new Date(selectedEmployer.subscriptionExpires).toLocaleDateString()}`
                            : "No expiration"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Bio / Description */}
                {(employerDetails?.bio || selectedEmployer.bio) && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Company Bio / Description
                    </h4>
                    <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      {employerDetails?.bio || selectedEmployer.bio}
                    </p>
                  </div>
                )}

                {/* Job Postings History from real backend */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Recent Job Postings ({employerJobs.length})
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Total posted in database: {employerJobCounts[selectedEmployer.id] ?? employerJobs.length}
                    </span>
                  </div>

                  {employerJobs.length > 0 ? (
                    <div className="space-y-2">
                      {employerJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 text-sm"
                        >
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {job.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                              {job.location && (
                                <span className="flex items-center gap-1">
                                  <FiMapPin className="w-3 h-3" />
                                  {job.location}
                                </span>
                              )}
                              <span>• {job.type || "Full-time"}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                                job.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                                  : job.status === "closed"
                                  ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                              }`}
                            >
                              {job.status}
                            </span>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {job.createdAt
                                ? new Date(job.createdAt).toLocaleDateString()
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg text-center">
                      No jobs have been posted by this employer yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setEmployerDetails(null);
                  setEmployerJobs([]);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedEmployer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Update Employer Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Select an account status for employer{" "}
              <strong className="text-gray-900 dark:text-white">{selectedEmployer.name}</strong>.
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
                <option value="active">Active (Full employer access)</option>
                <option value="inactive">Inactive (Limited access)</option>
                <option value="blocked">Blocked (Suspended account)</option>
              </select>
            </div>

            {newStatus === "blocked" && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Blocked employers cannot post jobs or review applications.</span>
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
                disabled={actionLoading || newStatus === selectedEmployer.status}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employer Modal */}
      {showDeleteModal && selectedEmployer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
              <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Employer Account
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to permanently delete{" "}
              <strong className="text-gray-900 dark:text-white">{selectedEmployer.name}</strong> (
              {selectedEmployer.email})? This action will permanently remove the employer profile
              and associated job postings.
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
                onClick={handleDeleteEmployer}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Delete Employer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerManagement;
