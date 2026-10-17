import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiBookmark,
  FiExternalLink,
  FiTrash2,
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

const SavedJobCard = ({ job, onRemove, isAvailable = true }) => {
  if (!job) return null;

  const jobId = job.id;
  const title = job.title || "Job Position";
  const company = job.company || "Company";
  const location = job.location || "Location not specified";
  const salary = job.salary;
  const type = job.type;
  const experience = job.experience;
  const posted = job.createdAt || job.posted;
  const savedAt = job.savedAt;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top meta row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-2 items-center">
            {type && (
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getTypeBadge(
                  type
                )}`}
              >
                {type}
              </span>
            )}
            {experience && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                {experience}
              </span>
            )}
            {!isAvailable && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                Listing Closed
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onRemove(jobId)}
            title="Remove from saved jobs"
            aria-label="Remove saved job"
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiTrash2 className="text-base" />
          </button>
        </div>

        {/* Title and Company */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">
          {isAvailable ? (
            <Link
              to={`/jobs/${jobId}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {title}
            </Link>
          ) : (
            <span>{title}</span>
          )}
        </h3>

        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mb-3">
          <FiBriefcase className="text-gray-400 text-xs flex-shrink-0" />
          <span>{company}</span>
        </p>

        {/* Details snippet */}
        <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <FiMapPin className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          {salary && (
            <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
              <FiDollarSign className="text-emerald-500 flex-shrink-0" />
              <span>{salary}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <FiClock className="text-gray-400 flex-shrink-0" />
            <span>Posted {formatRelativeTime(posted)}</span>
          </div>
        </div>

        {/* Skills */}
        {job.skills && (
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
          {savedAt
            ? `Saved ${new Date(savedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}`
            : "Saved"}
        </span>

        {isAvailable ? (
          <Link
            to={`/jobs/${jobId}`}
            className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <span>View Job</span>
            <FiExternalLink className="text-xs" />
          </Link>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic">Unavailable</span>
        )}
      </div>
    </div>
  );
};

export default SavedJobCard;
