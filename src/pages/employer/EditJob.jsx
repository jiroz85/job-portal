import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiEdit2,
  FiArrowLeft,
  FiAlertCircle,
  FiRefreshCw,
  FiBriefcase,
} from "react-icons/fi";
import { jobService } from "../../services/jobService";
import JobEditorForm from "../../components/employer/JobEditorForm";

const EditJob = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJob = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobService.getJobById(id);
      if (response && response.success && response.data) {
        setJob(response.data);
      } else {
        throw new Error(response?.error || "Job posting could not be found.");
      }
    } catch (err) {
      console.error("Error fetching job for edit:", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Unable to load job details. You may not have permission to edit this job."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <FiEdit2 className="w-3.5 h-3.5" />
            <span>Job Maintenance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {loading ? "Loading Job Details..." : `Edit: ${job?.title || "Job Posting"}`}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Update role descriptions, requirements, compensation, or publication status.
          </p>
        </div>

        <Link
          to="/employer/jobs"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-colors shadow-xs self-start sm:self-auto"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse space-y-4">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Failed to Load Job Posting
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {error}
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              type="button"
              onClick={fetchJob}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <Link
              to="/employer/jobs"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-colors"
            >
              <span>Back to Manage Jobs</span>
            </Link>
          </div>
        </div>
      )}

      {/* Editor Form */}
      {!loading && !error && job && (
        <JobEditorForm initialData={job} isEdit={true} jobId={id} />
      )}
    </div>
  );
};

export default EditJob;
