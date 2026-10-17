import React from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiArrowLeft } from "react-icons/fi";
import JobEditorForm from "../../components/employer/JobEditorForm";

const PostJob = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <FiBriefcase className="w-3.5 h-3.5" />
            <span>New Requisition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Create Job Posting
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Publish an open vacancy to attract, screen, and interview qualified talent.
          </p>
        </div>

        <Link
          to="/employer/jobs"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-colors shadow-xs self-start sm:self-auto"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>View All Jobs</span>
        </Link>
      </div>

      {/* Editor Form */}
      <JobEditorForm isEdit={false} />
    </div>
  );
};

export default PostJob;
