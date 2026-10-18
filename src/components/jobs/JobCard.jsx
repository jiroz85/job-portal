import { Link } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaArrowRight,
  FaShieldAlt,
} from "react-icons/fa";

const formatTimeAgo = (dateString) => {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recently";

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

const getCompanyInitials = (name) => {
  if (!name) return "CO";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarGradient = (name = "") => {
  const charCode = name.charCodeAt(0) || 0;
  const gradients = [
    "from-blue-600 to-indigo-600",
    "from-indigo-600 to-purple-600",
    "from-violet-600 to-fuchsia-600",
    "from-teal-600 to-emerald-600",
  ];
  return gradients[charCode % gradients.length];
};

const JobCard = ({ job }) => {
  if (!job) return null;

  const initials = getCompanyInitials(job.company);
  const avatarGradient = getAvatarGradient(job.company);
  const postedText = formatTimeAgo(job.createdAt || job.posted);

  const skillsList = job.skills
    ? job.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group relative flex flex-col justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Top hover indicator line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Top Header Row: Company Monogram + Type/Experience Badges */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGradient} text-white flex items-center justify-center font-extrabold text-sm shadow-sm group-hover:scale-105 transition-transform flex-shrink-0`}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white text-sm">
                <span>{job.company}</span>
                <FaShieldAlt
                  className="text-blue-500 text-[11px]"
                  title="Verified Organization"
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <FaMapMarkerAlt className="text-gray-400 text-[10px]" />
                <span className="truncate">{job.location || "Remote"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
            {job.type && (
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getTypeBadgeClass(
                  job.type
                )}`}
              >
                {job.type}
              </span>
            )}
            {job.experience && (
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">
                {job.experience}
              </span>
            )}
          </div>
        </div>

        {/* Job Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-2">
          {job.title}
        </h3>

        {/* Job Description Snippet */}
        {job.description && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed mb-4">
            {job.description}
          </p>
        )}

        {/* Key Highlight Pills (Salary & Posted Date) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {job.salary && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <FaDollarSign className="text-emerald-600 dark:text-emerald-400 text-[11px]" />
              <span>{job.salary}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
            <FaClock className="text-[10px]" />
            <span>{postedText}</span>
          </span>
        </div>

        {/* Skills Tags */}
        {skillsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            {skillsList.slice(0, 3).map((skill, index) => (
              <span
                key={index}
                className="text-[11px] px-2.5 py-0.5 rounded-md font-medium bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-700/50 dark:text-gray-300 dark:border-gray-600"
              >
                {skill}
              </span>
            ))}
            {skillsList.length > 3 && (
              <span className="text-[11px] px-2 py-0.5 rounded-md font-medium text-gray-400 dark:text-gray-500">
                +{skillsList.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: View Details Action */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Actively hiring</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
          <span>View Details</span>
          <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
};

export default JobCard;
