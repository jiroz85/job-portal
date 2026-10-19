import { useState, useMemo } from "react";
import {
  FiSearch,
  FiBriefcase,
  FiFilter,
  FiX,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import ApplicationCard from "./ApplicationCard";

const STATUS_FILTERS = [
  { id: "all", label: "All Statuses" },
  { id: "pending", label: "Pending" },
  { id: "under_review", label: "Under Review" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview", label: "Interviews" },
  { id: "offered", label: "Offered" },
  { id: "rejected", label: "Not Selected" },
];

const ApplicationSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm animate-pulse">
    <div className="flex justify-between items-start gap-4 mb-4">
      <div className="w-1/2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <div className="w-24 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
    </div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full my-6"></div>
    <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
    </div>
  </div>
);

const ApplicationList = ({
  applications = [],
  loading = false,
  error = null,
  onRetry,
  onExplore,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const title = app.job?.title || app.jobTitle || "";
      const company = app.job?.company || app.company || "";
      const location = app.job?.location || "";
      const status = app.status || "pending";

      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        company.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query);

      let matchesStatus = true;
      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "interview") {
        matchesStatus =
          status === "interview_scheduled" || status === "interviewed";
      } else if (statusFilter === "offered") {
        matchesStatus = status === "offered" || status === "accepted";
      } else {
        matchesStatus = status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 flex items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <FiSearch className="text-gray-400 mr-2.5 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by position, company, or location..."
              className="w-full bg-transparent outline-none text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-500 border-none p-0 focus:ring-0"
              aria-label="Search applications"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiX className="text-sm" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="sm:w-56">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium mr-1 flex items-center gap-1">
            <FiFilter className="text-[10px]" /> Status:
          </span>
          {STATUS_FILTERS.map((filter) => {
            const isSelected = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-650"
                }`}
              >
                {filter.label}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold ml-auto"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <ApplicationSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6 max-w-md mx-auto shadow-sm">
          <FiAlertCircle className="text-3xl text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Failed to load applications
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <FiRefreshCw className="text-xs" />
              <span>Retry</span>
            </button>
          )}
        </div>
      ) : filteredApplications.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            <span>
              Showing {filteredApplications.length} of {applications.length}{" "}
              application{applications.length === 1 ? "" : "s"}
            </span>
          </div>

          {filteredApplications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <FiBriefcase className="text-2xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No applications submitted yet
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
            Find active career opportunities and submit your profile directly to
            hiring managers.
          </p>
          {typeof onExplore === "function" && (
            <button
              type="button"
              onClick={onExplore}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <FiBriefcase className="text-xs" />
              <span>Explore Opportunities</span>
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-md mx-auto shadow-sm">
          <FiSearch className="text-3xl text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            No applications match your filter
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
            Try adjusting your search keywords or switching status filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Clear active filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicationList;
