import React, { useRef } from "react";
import {
  FiFileText,
  FiUpload,
  FiDownload,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiInfo,
} from "react-icons/fi";

const ResumeManager = ({
  resumes = [],
  loading = false,
  error = null,
  uploading = false,
  actionLoadingId = null,
  onUpload,
  onSetDefault,
  onDownload,
  onDelete,
  onRetry,
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset file input so identical file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              My Resumes ({resumes.length})
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Upload PDF or DOCX documents (max 5 MB) for job applications
            </p>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
              id="resume-upload-input"
            />
            <label
              htmlFor="resume-upload-input"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all select-none ${
                uploading
                  ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer"
              }`}
            >
              <FiUpload className={`text-sm ${uploading ? "animate-bounce" : ""}`} />
              <span>{uploading ? "Uploading Resume..." : "Upload New Resume"}</span>
            </label>
          </div>
        </div>

        {/* Upload format guidelines banner */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <FiInfo className="text-sm flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          <div>
            <span>Accepted formats: <strong>PDF, DOC, DOCX</strong> up to <strong>5 MB</strong>. The resume marked as <strong>Default</strong> is automatically attached to your job applications unless you select another.</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-28"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6 max-w-md mx-auto shadow-sm">
          <FiAlertCircle className="text-3xl text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Failed to load resumes
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              Try Again
            </button>
          )}
        </div>
      ) : resumes.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm max-w-lg mx-auto">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiFileText className="text-2xl" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
            No resumes uploaded yet
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Upload your CV or resume in PDF or DOCX format so you can apply to jobs with a single click.
          </p>
          <label
            htmlFor="resume-upload-input"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm transition"
          >
            <FiUpload className="text-sm" />
            <span>Upload Your First Resume</span>
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map((resume) => {
            const isDefault = Boolean(resume.isDefault);
            const isProcessing = actionLoadingId === resume.id;
            const formattedDate = resume.uploadedDate
              ? new Date(resume.uploadedDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently";

            return (
              <div
                key={resume.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-5 sm:p-6 shadow-sm transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDefault
                    ? "border-blue-300 dark:border-blue-700/80 bg-blue-50/20 dark:bg-blue-950/10"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                {/* File info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      isDefault
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <FiFileText />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {resume.name}
                      </h3>
                      {isDefault && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                          <FiCheck className="text-[11px]" />
                          Default Resume
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>Size: {resume.size || "Unknown"}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FiClock className="text-[11px]" />
                        Uploaded {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  {!isDefault && (
                    <button
                      type="button"
                      onClick={() => onSetDefault(resume.id)}
                      disabled={isProcessing || uploading}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? "Updating..." : "Set as Default"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDownload(resume.id, resume.name)}
                    disabled={isProcessing}
                    title="Download resume"
                    aria-label="Download resume"
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                  >
                    <FiDownload className="text-sm" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(resume.id, resume.name)}
                    disabled={isProcessing}
                    title="Delete resume"
                    aria-label="Delete resume"
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResumeManager;
