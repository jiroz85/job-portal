import React from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiBookmark,
  FiCheck,
  FiExternalLink,
  FiTag,
} from "react-icons/fi";

const formatRelativeTime = (dateString) => {
  if (!dateString) return "Recently posted";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently posted";

  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const getTypeBadge = (type) => {
  const norm = (type || "").toLowerCase();
  if (norm.includes("remote")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (norm.includes("part-time")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  }
  if (norm.includes("contract")) {
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
  }
  if (norm.includes("internship")) {
    return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800";
  }
  return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
};

const RecommendedJobCard = ({
  job,
  isSaved = false,
  onToggleSave,
  matchedSkills = [],
}) => {
  if (!job) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top meta row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-2 items-center">
            {job.type && (
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getTypeBadge(
                  job.type
                )}`}
              >
                {job.type}
              </span>
            )}
            {job.experience && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                {job.experience}
              </span>
            )}
            {matchedSkills.length > 0 && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 flex items-center gap-1">
                <FiTag className="text-[10px]" />
                {matchedSkills.length} matching {matchedSkills.length === 1 ? "skill" : "skills"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggleSave(job)}
            title={isSaved ? "Saved" : "Save job"}
            aria-label={isSaved ? "Unsave job" : "Save job"}
            className={`p-2 rounded-lg border transition-colors ${
              isSaved
                ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400"
                : "border-gray-200 dark:border-gray-700 text-gray-400 hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-400"
            }`}
          >
            <FiBookmark className={`text-base ${isSaved ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Title and Company */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">
          <Link
            to={`/jobs/${job.id}`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {job.title}
          </Link>
        </h3>

        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mb-3">
          <FiBriefcase className="text-gray-400 text-xs flex-shrink-0" />
          <span>{job.company}</span>
        </p>

        {/* Details snippet */}
        <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <FiMapPin className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{job.location || "Location not specified"}</span>
          </div>

          {job.salary && (
            <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
              <FiDollarSign className="text-emerald-500 flex-shrink-0" />
              <span>{job.salary}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <FiClock className="text-gray-400 flex-shrink-0" />
            <span>Posted {formatRelativeTime(job.createdAt || job.posted)}</span>
          </div>
        </div>

        {/* Matched skills highlight */}
        {matchedSkills.length > 0 && (
          <div className="mb-4 p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs">
            <p className="text-[11px] font-semibold text-indigo-900 dark:text-indigo-300 mb-1.5 flex items-center gap-1">
              <FiCheck className="text-indigo-600 dark:text-indigo-400" /> Matches your profile skills:
            </p>
            <div className="flex flex-wrap gap-1">
              {matchedSkills.map((skill, index) => (
                <span
                  key={index}
                  className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* All skills preview if no matched skills */}
        {matchedSkills.length === 0 && job.skills && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/60 mb-4">
            {job.skills
              .split(",")
              .slice(0, 3)
              .map((skill, index) => (
                <span
                  key={index}
                  className="text-[11px] px-2 py-0.5 rounded bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-750 dark:text-gray-300 dark:border-gray-700"
                >
                  {skill.trim()}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
        <span className="text-gray-400 dark:text-gray-500">
          Active Listing
        </span>

        <Link
          to={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <span>View Job</span>
          <FiExternalLink className="text-xs" />
        </Link>
      </div>
    </div>
  );
};

export default RecommendedJobCard;
