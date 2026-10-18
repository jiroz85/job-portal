import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaClock,
  FaDollarSign,
  FaArrowLeft,
  FaBuilding,
  FaCheck,
  FaCheckCircle,
  FaFileUpload,
  FaPaperPlane,
  FaGraduationCap,
  FaShareAlt,
  FaTimes,
  FaShieldAlt,
  FaCalendarAlt,
  FaSpinner,
} from "react-icons/fa";
import { useJobs } from "../context/JobContext";
import useAuth from "../hooks/useAuth";
import { jobService } from "../services/jobService";
import { applicationService } from "../services/applicationService";

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

const formatFullDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

const parseListItems = (text) => {
  if (!text || typeof text !== "string") return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  let items = [];
  if (trimmed.includes("\n")) {
    items = trimmed.split("\n");
  } else if (trimmed.includes(";")) {
    items = trimmed.split(";");
  } else if (trimmed.includes(",")) {
    items = trimmed.split(",");
  } else {
    items = [trimmed];
  }

  return items
    .map((item) => item.replace(/^[-•*]\s*/, "").trim())
    .filter((item) => item.length > 0);
};

const JobDetailPage = () => {
  const { id } = useParams();
  const { getPublishedJobs } = useJobs();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Application modal state
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [applicationData, setApplicationData] = useState({
    phone: "",
    experience: "",
    education: "",
    skills: "",
    coverLetter: "",
    resume: null,
  });
  const [errors, setErrors] = useState({});

  // Load job data reliably
  useEffect(() => {
    let isMounted = true;
    const loadJob = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check in-memory context first
        const published = getPublishedJobs();
        const found = published.find((j) => j.id === parseInt(id));
        if (found) {
          if (isMounted) {
            setJob(found);
            setLoading(false);
          }
          return;
        }

        // Fetch fresh from backend API
        const response = await jobService.getJobById(id);
        const jobData = response.data || response;
        if (isMounted) {
          setJob(jobData);
        }
      } catch (err) {
        console.error("Error loading job details:", err);
        if (isMounted) {
          setError(err.message || "Job not found");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadJob();
    }

    return () => {
      isMounted = false;
    };
  }, [id, getPublishedJobs]);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/jobs/${id}`);
      return;
    }
    setSubmissionSuccess(false);
    setShowApplicationModal(true);
  };

  const handleShareClick = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.warn("Could not copy link:", e);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          resume: "File size exceeds 5 MB limit. Please select a smaller PDF or DOCX file.",
        }));
        e.target.value = "";
        return;
      }
      setErrors((prev) => ({ ...prev, resume: "" }));
      setApplicationData((prev) => ({
        ...prev,
        resume: file,
      }));
    }
  };

  const validateApplication = () => {
    const newErrors = {};
    if (!applicationData.phone.trim())
      newErrors.phone = "Phone number is required";
    if (!applicationData.experience.trim())
      newErrors.experience = "Experience details are required";
    if (!applicationData.education.trim())
      newErrors.education = "Education is required";
    if (!applicationData.skills.trim())
      newErrors.skills = "Key skills are required";
    if (!applicationData.coverLetter.trim())
      newErrors.coverLetter = "Cover letter is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!validateApplication()) return;

    setIsSubmitting(true);
    try {
      const applicationPayload = {
        jobId: parseInt(id),
        applicantPhone: applicationData.phone,
        experience: applicationData.experience,
        education: applicationData.education,
        skills: applicationData.skills,
        coverLetter: applicationData.coverLetter,
        availability: "Immediate",
        resume: applicationData.resume,
      };

      const response = await applicationService.submitApplication(applicationPayload);

      if (response.success || response.id || response.data) {
        setSubmissionSuccess(true);
        setApplicationData({
          phone: "",
          experience: "",
          education: "",
          skills: "",
          coverLetter: "",
          resume: null,
        });

        // Trigger global and storage events for real-time dashboard sync
        const eventData = { jobId: parseInt(id), timestamp: Date.now() };
        window.dispatchEvent(
          new CustomEvent("applicationSubmitted", { detail: eventData })
        );
        localStorage.setItem("applicationSubmitted", JSON.stringify(eventData));
        localStorage.setItem(
          "applicationSubmittedTimestamp",
          Date.now().toString()
        );

        setTimeout(() => {
          setShowApplicationModal(false);
          setSubmissionSuccess(false);
        }, 2200);
      } else {
        throw new Error(response.error || "Failed to submit application");
      }
    } catch (err) {
      console.error("Error submitting application:", err);
      const errorMessage =
        err.response?.data?.error || err.message || "Unknown error occurred";
      setErrors((prev) => ({
        ...prev,
        form: errorMessage,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading skeleton state
  if (loading) {
    return (
      <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm animate-pulse mb-8">
            <div className="flex gap-4 items-start mb-6">
              <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-3">
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found fallback state
  if (!job) {
    return (
      <div className="py-16 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold">
            ?
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Job Posting Not Found
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
            {error || "The position you are looking for may have expired or been removed."}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/#browse-jobs"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <FaArrowLeft className="mr-2" /> Browse All Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const responsibilitiesList = parseListItems(job.responsibilities);
  const requirementsList = parseListItems(job.requirements);
  const benefitsList = parseListItems(job.benefits);
  const skillsList = parseListItems(job.skills);
  const postedRelative = formatTimeAgo(job.createdAt || job.posted);
  const postedCalendar = formatFullDate(job.createdAt || job.posted);
  const deadlineCalendar = formatFullDate(job.applicationDeadline);

  return (
    <div className="py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/#browse-jobs"
            className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to Jobs
          </Link>
          <button
            onClick={handleShareClick}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm"
            title="Copy job link to clipboard"
          >
            <FaShareAlt className="text-gray-400" />
            <span>{copied ? "Link Copied!" : "Share Job"}</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-700/80">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 text-2xl sm:text-3xl shadow-sm">
                <FaBuilding />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {job.type && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getTypeBadgeClass(
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
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                    <FaShieldAlt className="text-[10px]" /> Verified
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {job.title}
                </h1>
                <p className="text-base sm:text-lg font-medium text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                  <span>{job.company}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3">
              <button
                onClick={handleApplyClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <FaPaperPlane className="text-sm" />
                <span>Apply Now</span>
              </button>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Posted {postedRelative}
              </p>
            </div>
          </div>

          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            {/* Location Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                <FaMapMarkerAlt />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-0.5">
                  Location
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white truncate block">
                  {job.location || "Not specified"}
                </span>
              </div>
            </div>

            {/* Salary Range Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-gray-800/80 border border-emerald-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                <FaDollarSign />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-0.5">
                  Salary Range
                </span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 truncate block">
                  {job.salary || "Competitive"}
                </span>
              </div>
            </div>

            {/* Date Posted Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50/50 dark:bg-gray-800/80 border border-amber-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                <FaClock />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-0.5">
                  Date Posted
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white truncate block">
                  {postedCalendar || postedRelative}
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium block">
                  {postedRelative}
                </span>
              </div>
            </div>

            {/* Work Type Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50/50 dark:bg-gray-800/80 border border-purple-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                <FaBriefcase />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 block mb-0.5">
                  Work Type
                </span>
                <span className="text-base font-bold text-gray-900 dark:text-white truncate block">
                  {job.type || "Full-time"}
                </span>
                {job.experience && (
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium block">
                    {job.experience}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>About the Role</span>
              </h2>
              <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {job.description}
              </div>
            </div>

            {/* Responsibilities Section (only shown if present) */}
            {responsibilitiesList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>Key Responsibilities</span>
                </h3>
                <ul className="space-y-3">
                  {responsibilitiesList.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-sm sm:text-base text-gray-700 dark:text-gray-300"
                    >
                      <span className="mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                        <FaCheck />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements Section (only shown if present) */}
            {requirementsList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>Candidate Requirements</span>
                </h3>
                <ul className="space-y-3">
                  {requirementsList.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-sm sm:text-base text-gray-700 dark:text-gray-300"
                    >
                      <span className="mt-1 mr-3 flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
                        <FaCheck />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills & Technologies */}
            {skillsList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>Skills & Technologies</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-xs sm:text-sm font-medium shadow-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits & Perks (only shown if present) */}
            {benefitsList.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>Benefits & Perks</span>
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {benefitsList.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 flex items-center text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="mr-2.5 flex-shrink-0 w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs">
                        <FaCheck />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sticky Sidebar Right Column (1/3) */}
          <div className="space-y-6">
            {/* Quick Action Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm sticky top-6">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                Job Overview
              </h3>

              <div className="space-y-3.5 text-sm text-gray-600 dark:text-gray-300 mb-6">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Company</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {job.company}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Location</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {job.location}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Employment</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {job.type}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Experience</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {job.experience}
                  </span>
                </div>

                {job.salary && (
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Salary Range</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {job.salary}
                    </span>
                  </div>
                )}

                {deadlineCalendar && (
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Deadline</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {deadlineCalendar}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleApplyClick}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <FaPaperPlane className="text-sm" />
                <span>Apply for this Position</span>
              </button>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                  <FaShieldAlt className="text-emerald-500" />
                  <span>Verified employer posting</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/40">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Apply for {job.title}
                </h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                  {job.company} • {job.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApplicationModal(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[calc(85vh-140px)] overflow-y-auto">
              {submissionSuccess ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 text-3xl">
                    <FaCheckCircle />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    Application Submitted!
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 max-w-md mx-auto">
                    Your application for <strong>{job.title}</strong> has been sent to {job.company}. You can track status in your dashboard.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-5">
                  {errors.form && (
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                      {errors.form}
                    </div>
                  )}

                  {/* Applicant Profile Information Preview */}
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider block mb-2">
                      Applicant Information
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Name</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {user?.name || "Job Seeker"}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Email</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {user?.email || "applicant@example.com"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Phone & Education Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={applicationData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          errors.phone
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="+1 (555) 123-4567"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Education *
                      </label>
                      <input
                        type="text"
                        name="education"
                        value={applicationData.education}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          errors.education
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="e.g. B.S. in Computer Science"
                      />
                      {errors.education && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.education}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Experience & Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Experience Level *
                      </label>
                      <input
                        type="text"
                        name="experience"
                        value={applicationData.experience}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          errors.experience
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="e.g. 4 years of frontend engineering"
                      />
                      {errors.experience && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.experience}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Key Skills *
                      </label>
                      <input
                        type="text"
                        name="skills"
                        value={applicationData.skills}
                        onChange={handleInputChange}
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          errors.skills
                            ? "border-red-500 focus:ring-red-400"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        placeholder="e.g. React, TypeScript, Node.js"
                      />
                      {errors.skills && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.skills}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Cover Letter / Note *
                    </label>
                    <textarea
                      name="coverLetter"
                      value={applicationData.coverLetter}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                        errors.coverLetter
                          ? "border-red-500 focus:ring-red-400"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      placeholder="Share a concise introduction and why your background fits this role..."
                    />
                    {errors.coverLetter && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errors.coverLetter}
                      </p>
                    )}
                  </div>

                  {/* Resume Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Resume (PDF or DOCX, max 5 MB)
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer bg-gray-50/50 dark:bg-gray-700/30 transition-colors">
                      <FaFileUpload className="text-gray-400 dark:text-gray-500 text-2xl mb-1.5" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {applicationData.resume
                          ? applicationData.resume.name
                          : "Click or drag to attach your resume"}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-0.5">
                        Supports .pdf, .doc, .docx
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {errors.resume && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errors.resume}
                      </p>
                    )}
                  </div>

                  {/* Footer Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowApplicationModal(false)}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition-colors disabled:opacity-50"
                    >
                      {isSubmitting && <FaSpinner className="animate-spin text-xs" />}
                      <span>
                        {isSubmitting ? "Submitting..." : "Submit Application"}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
