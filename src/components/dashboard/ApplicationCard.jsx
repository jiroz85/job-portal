import React from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiClock,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiStar,
  FiArrowRight,
  FiFileText,
  FiDownload,
} from "react-icons/fi";
import { applicationService } from "../../services/applicationService";

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600",
    step: 1,
    icon: FiClock,
  },
  under_review: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    step: 2,
    icon: FiEye,
  },
  shortlisted: {
    label: "Shortlisted",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800",
    step: 3,
    icon: FiStar,
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200 dark:border-amber-800",
    step: 4,
    icon: FiCalendar,
  },
  interviewed: {
    label: "Interviewed",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 border-orange-200 dark:border-orange-800",
    step: 4,
    icon: FiCalendar,
  },
  offered: {
    label: "Offer Extended",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    step: 5,
    icon: FiCheckCircle,
  },
  accepted: {
    label: "Accepted & Hired",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    step: 5,
    icon: FiCheckCircle,
  },
  rejected: {
    label: "Not Selected",
    color: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-200 dark:border-red-800",
    step: 0,
    icon: FiXCircle,
  },
  withdrawn: {
    label: "Withdrawn",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    step: 0,
    icon: FiXCircle,
  },
};

const PIPELINE_STEPS = [
  { id: 1, label: "Submitted" },
  { id: 2, label: "Screening" },
  { id: 3, label: "Shortlisted" },
  { id: 4, label: "Interview" },
  { id: 5, label: "Decision" },
];

const ApplicationCard = ({ application }) => {
  if (!application) return null;

  const currentStatus = application.status || "pending";
  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;
  const jobId = application.jobId || application.job?.id;
  const isTerminalNegative = currentStatus === "rejected" || currentStatus === "withdrawn";

  const handleDownloadResume = async () => {
    try {
      await applicationService.downloadResume(
        application.id,
        application.applicantName || "Application"
      );
    } catch {
      alert("Resume file could not be downloaded.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
            {application.job?.title || application.jobTitle || "Job Position"}
          </h3>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <FiBriefcase className="text-gray-400" />
              {application.job?.company || application.company || "Company"}
            </span>

            <span className="text-gray-300 dark:text-gray-600">•</span>

            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <FiMapPin className="text-gray-400" />
              {application.job?.location || "Location not specified"}
            </span>

            <span className="text-gray-300 dark:text-gray-600">•</span>

            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <FiCalendar className="text-gray-400" />
              Applied on{" "}
              {new Date(
                application.applicationDate || application.createdAt
              ).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0 self-start">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color}`}
          >
            <StatusIcon className="text-xs" />
            <span>{statusInfo.label}</span>
          </span>
        </div>
      </div>

      {/* Status Progress Timeline */}
      <div className="my-5 pt-4 border-t border-gray-100 dark:border-gray-700/60">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Application Progress
        </p>

        {isTerminalNegative ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-xs">
            <FiXCircle className={currentStatus === "rejected" ? "text-red-500" : "text-gray-400"} />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {currentStatus === "rejected"
                ? "This application was not selected to advance further in the hiring process."
                : "This application was withdrawn from consideration."}
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* Step Track */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {PIPELINE_STEPS.map((step) => {
                const isPassed = statusInfo.step > step.id;
                const isCurrent = statusInfo.step === step.id;

                return (
                  <div key={step.id} className="text-center">
                    <div
                      className={`h-2 rounded-full mb-1.5 transition-colors ${
                        isPassed || isCurrent ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    ></div>
                    <span
                      className={`text-[10px] sm:text-xs block truncate ${
                        isCurrent
                          ? "font-bold text-blue-600 dark:text-blue-400"
                          : isPassed
                          ? "font-medium text-gray-700 dark:text-gray-300"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Additional Details (Interview Date / Notes) */}
      {(application.interviewDate || application.offerDeadline) && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
          {application.interviewDate && (
            <p className="flex items-center gap-1.5 font-medium">
              <FiCalendar className="text-blue-600" />
              <span>
                Interview scheduled for:{" "}
                {new Date(application.interviewDate).toLocaleString()}
              </span>
            </p>
          )}
          {application.offerDeadline && (
            <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
              <FiCheckCircle className="text-emerald-600" />
              <span>
                Offer response deadline:{" "}
                {new Date(application.offerDeadline).toLocaleDateString()}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {application.resumePath && (
            <button
              type="button"
              onClick={handleDownloadResume}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <FiDownload className="text-xs" />
              <span>Download Submitted Resume</span>
            </button>
          )}
        </div>

        {jobId && (
          <Link
            to={`/jobs/${jobId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group"
          >
            <span>View Job Details</span>
            <FiArrowRight className="text-xs group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ApplicationCard;
