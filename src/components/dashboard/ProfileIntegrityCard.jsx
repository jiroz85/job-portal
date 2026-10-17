import React from "react";
import {
  FiUser,
  FiMail,
  FiShield,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiFileText,
  FiTag,
} from "react-icons/fi";

const ProfileIntegrityCard = ({ user }) => {
  if (!user) return null;

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  // Safely parse skills if stored as JSON or string
  let skillsList = [];
  if (user.skills) {
    if (Array.isArray(user.skills)) {
      skillsList = user.skills;
    } else {
      try {
        const parsed = JSON.parse(user.skills);
        if (Array.isArray(parsed)) skillsList = parsed;
        else if (typeof parsed === "string") skillsList = parsed.split(",").map((s) => s.trim()).filter(Boolean);
      } catch {
        if (typeof user.skills === "string") {
          skillsList = user.skills.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100 dark:border-gray-700/60">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiUser className="text-blue-600 dark:text-blue-400" />
            Candidate Profile
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Verified identity and credentials managed on the platform
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
          <FiCheckCircle className="text-xs" />
          Active Account
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-5">
        {/* Full Name */}
        <div>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
            Full Name
          </span>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {user.name || "N/A"}
          </p>
        </div>

        {/* Email Address */}
        <div>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
            Email Address
          </span>
          <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
            <FiMail className="text-gray-400 text-xs" />
            <span>{user.email || "N/A"}</span>
          </p>
        </div>

        {/* Account Role */}
        <div>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
            Role
          </span>
          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize flex items-center gap-1.5">
            <FiShield className="text-gray-400 text-xs" />
            <span>{user.role || "Job Seeker"}</span>
          </p>
        </div>

        {/* Phone */}
        {user.phone && (
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
              Phone
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user.phone}
            </p>
          </div>
        )}

        {/* Member Since */}
        {joinDate && (
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
              Member Since
            </span>
            <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
              <FiCalendar className="text-gray-400 text-xs" />
              <span>{joinDate}</span>
            </p>
          </div>
        )}

        {/* Active Default Resume */}
        <div>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
            Default Resume
          </span>
          <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
            <FiFileText className="text-gray-400 text-xs flex-shrink-0" />
            <span className="truncate">{user.resumePath ? "Active on file" : "None set"}</span>
          </p>
        </div>
      </div>

      {/* Profile Skills if available */}
      {skillsList.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
            Profile Skills & Competencies
          </span>
          <div className="flex flex-wrap gap-1.5">
            {skillsList.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              >
                <FiTag className="text-[10px]" />
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Honest Profile Editing Notice */}
      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-start gap-2.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-750 p-3 rounded-lg">
        <FiInfo className="text-sm flex-shrink-0 mt-0.5 text-gray-400" />
        <p>
          Candidate account details (name and email) are synced from your authenticated credentials. Self-service profile updates are managed through your organization administrator.
        </p>
      </div>
    </div>
  );
};

export default ProfileIntegrityCard;
