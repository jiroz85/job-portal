import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiBriefcase,
  FiShield,
  FiKey,
  FiCheckCircle,
  FiInfo,
  FiArrowRight,
  FiCopy,
  FiCheck,
  FiLayers,
} from "react-icons/fi";
import useAuth from "../../hooks/useAuth";

const EmployerSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [copiedId, setCopiedId] = useState(false);

  const tabs = [
    { id: "profile", name: "Account Profile", icon: FiUser },
    { id: "organization", name: "Workspace & Role", icon: FiBriefcase },
    { id: "security", name: "Security & Sessions", icon: FiShield },
  ];

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(String(user.id));
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const displayName =
    user?.name ||
    user?.company ||
    (user?.email ? user.email.split("@")[0] : "Employer");
  const displayEmail = user?.email || "employer@example.com";
  const displayRole = user?.role || "employer";
  const displayCompany = user?.company || "Employer Organization";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Employer Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review authenticated credentials and organization permissions
        </p>
      </div>

      {/* Honest Backend Disclaimer */}
      <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-start space-x-3 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
        <FiInfo className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div>
          <strong className="font-semibold">Account Profile Status:</strong> Your employer
          identity is linked to your authenticated session. Direct editing of employer profile
          attributes is managed through organization administration to maintain system integrity.
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-semibold text-xs sm:text-sm flex items-center space-x-2 shrink-0 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Account Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Verified attributes associated with your user session
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Full Name / Contact
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    readOnly
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={displayEmail}
                    readOnly
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    User Identifier (ID)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={user?.id || "N/A"}
                      readOnly
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-mono cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                      title="Copy User ID"
                    >
                      {copiedId ? (
                        <FiCheck className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <FiCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Account Status
                  </label>
                  <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold">
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Active & Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === "organization" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Organization & Workspace Access
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Roles and permissions assigned to your employer portal account
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      System Role: <span className="capitalize text-blue-600 dark:text-blue-400">{displayRole}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Full authority to post, edit, close, and review jobs and applicants
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                    Granted
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Employer Organization
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {displayCompany}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    Associated
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Candidate Data Protection
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Scoped strictly to applicants who applied to your owned listings
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                    Enforced
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Security & Authentication
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Information regarding current session and authentication tokens
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <FiKey className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        JWT Token Authentication
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Protected with cryptographic signature & Bearer authentication
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <FiShield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Password Storage
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Hashed securely with bcrypt on the server
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Secured
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
          Employer Hub Shortcuts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/employer/post-job"
            className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group"
          >
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Post a New Job
            </span>
            <FiArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </Link>
          <Link
            to="/employer/jobs"
            className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group"
          >
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Manage Job Listings
            </span>
            <FiArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </Link>
          <Link
            to="/employer/applicants"
            className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group"
          >
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              Track Applicants
            </span>
            <FiArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployerSettings;
