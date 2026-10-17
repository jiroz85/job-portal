import { Link } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaClock,
  FaDollarSign,
  FaBuilding,
  FaArrowRight,
} from "react-icons/fa";

const formatTimeAgo = (dateString) => {
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

const getTypeBadgeClass = (type) => {
  const normalized = (type || "").toLowerCase();
  if (normalized.includes("remote")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
  }
  if (normalized.includes("part-time")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  }
  if (normalized.includes("contract")) {
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
  }
  if (normalized.includes("internship")) {
    return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800";
  }
  return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
};

const JobCard = ({ job }) => {
  if (!job) return null;

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group flex flex-col justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-200"
    >
      <div>
        {/* Top meta row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
            <FaBuilding className="text-xl" />
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {job.type && (
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getTypeBadgeClass(
                  job.type
                )}`}
              >
                {job.type}
              </span>
            )}
            {job.experience && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                {job.experience}
              </span>
            )}
          </div>
        </div>

        {/* Title & Company */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
          {job.title}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mb-4">
          <FaBuilding className="text-gray-400 text-xs" />
          <span>{job.company}</span>
        </p>

        {/* Details snippet */}
        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{job.location || "Location not specified"}</span>
          </div>

          {job.salary && (
            <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
              <FaDollarSign className="text-emerald-500 flex-shrink-0" />
              <span>{job.salary}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <FaClock className="text-gray-400 flex-shrink-0" />
            <span>{formatTimeAgo(job.createdAt || job.posted)}</span>
          </div>
        </div>

        {/* Optional Skills / Tags */}
        {job.skills && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-700/60">
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

      {/* Card Action footer */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm font-semibold text-blue-600 dark:text-blue-400">
        <span>View Details</span>
        <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

export default JobCard;
