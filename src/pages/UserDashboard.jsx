import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiBookmark,
  FiEye,
  FiStar,
  FiMenu,
  FiAlertCircle,
  FiTrash2,
  FiX,
  FiInfo,
} from "react-icons/fi";
import useAuth from "../hooks/useAuth";
import { useJobs } from "../context/JobContext";
import { useSavedJobs } from "../context/SavedJobsContext";
import { applicationService } from "../services/applicationService";
import { resumeService } from "../services/resumeService";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardTabs from "../components/dashboard/DashboardTabs";
import ApplicationList from "../components/dashboard/ApplicationList";
import SavedJobCard from "../components/dashboard/SavedJobCard";
import RecommendedJobCard from "../components/dashboard/RecommendedJobCard";
import ResumeManager from "../components/dashboard/ResumeManager";
import ProfileIntegrityCard from "../components/dashboard/ProfileIntegrityCard";
import JobSeekerSidebar from "../components/dashboard/JobSeekerSidebar";
import ThemeToggle from "../components/common/ThemeToggle";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getPublishedJobs, loading: jobsLoading } = useJobs();
  const { savedJobs, saveJob, unsaveJob, isJobSaved, getSavedJobsCount } = useSavedJobs();

  const publishedJobs = getPublishedJobs();
  const [activeTab, setActiveTab] = useState("overview");
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("all");

  const handleTabChange = useCallback((tabId, statusFilter = "all") => {
    setActiveTab(tabId);
    if (statusFilter) {
      setApplicationStatusFilter(statusFilter);
    }
    setSidebarOpen(false);
  }, []);
  const [realApplications, setRealApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [resumesError, setResumesError] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // In-app feedback and modal state (replacing native alert() and confirm())
  const [feedback, setFeedback] = useState(null);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState(null);

  const showFeedback = useCallback((type, message, duration = 4500) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, duration);
  }, []);

  const fetchResumes = useCallback(async () => {
    try {
      setResumesLoading(true);
      setResumesError(null);
      const response = await resumeService.getMyResumes();
      if (response.success) {
        setResumes(response.data || []);
      } else {
        setResumesError(response.error || "Failed to load resumes");
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
      setResumesError(error.message || "Failed to load resumes");
    } finally {
      setResumesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  // Fetch real applications from backend
  const fetchUserApplications = useCallback(async () => {
    if (user?.email) {
      try {
        setApplicationsLoading(true);
        setApplicationsError(null);
        const response = await applicationService.getApplicationsByEmail(
          user.email
        );
        if (response.success) {
          setRealApplications(response.data || []);
        } else {
          setApplicationsError(response.error || "Failed to fetch applications");
        }
      } catch (error) {
        console.error("Error fetching user applications:", error);
        setApplicationsError(error.message || "Failed to fetch applications");
      } finally {
        setApplicationsLoading(false);
      }
    }
  }, [user?.email]);

  useEffect(() => {
    fetchUserApplications();
  }, [fetchUserApplications]);

  // Listen for real-time status updates
  useEffect(() => {
    const handleStatusUpdate = (event) => {
      // Update the specific application in real-time
      if (event.detail && event.detail.applicantEmail === user?.email) {
        setRealApplications((prevApplications) =>
          prevApplications.map((app) =>
            app.id === event.detail.applicationId
              ? { ...app, status: event.detail.newStatus }
              : app
          )
        );

        // Map status to user-friendly candidate message
        const statusMessages = {
          under_review: "Your application is being reviewed by the hiring team.",
          shortlisted: "Congratulations! You have been shortlisted for the position.",
          interview_scheduled: "An interview has been scheduled for your application.",
          interviewed: "Interview completed - awaiting decision from employer.",
          offered: "Congratulations! You have received a job offer.",
          accepted: "Welcome aboard! Your application was accepted.",
          rejected: "Your application was not selected for this position.",
          withdrawn: "Your application has been marked as withdrawn.",
        };

        const message =
          statusMessages[event.detail.newStatus] ||
          `Application status updated to: ${event.detail.newStatus}`;

        // Show browser notification if permitted
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Application Status Update", {
            body: message,
            icon: "/favicon.ico",
          });
        }

        // Show in-app accessible notification
        showFeedback("info", `Application update: ${message}`, 6000);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === "applicationStatusUpdate") {
        try {
          const statusUpdate = JSON.parse(event.newValue);
          if (statusUpdate && statusUpdate.applicantEmail === user?.email) {
            handleStatusUpdate({ detail: statusUpdate });
          }
        } catch (e) {
          console.error("Error parsing storage update:", e);
        }
      }
    };

    // Request notification permission if not yet decided
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    window.addEventListener("applicationStatusUpdated", handleStatusUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "applicationStatusUpdated",
        handleStatusUpdate
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [user?.email, showFeedback]);

  // Parse candidate profile skills if available
  const candidateSkills = useMemo(() => {
    if (!user?.skills) return [];
    if (Array.isArray(user.skills)) return user.skills.map((s) => s.toLowerCase().trim());
    try {
      const parsed = JSON.parse(user.skills);
      if (Array.isArray(parsed)) return parsed.map((s) => String(s).toLowerCase().trim());
      if (typeof parsed === "string") {
        return parsed.split(",").map((s) => s.toLowerCase().trim()).filter(Boolean);
      }
    } catch {
      if (typeof user.skills === "string") {
        return user.skills.split(",").map((s) => s.toLowerCase().trim()).filter(Boolean);
      }
    }
    return [];
  }, [user?.skills]);

  // Resolve saved jobs against live published jobs
  const resolvedSavedJobs = useMemo(() => {
    if (!savedJobs || !Array.isArray(savedJobs)) return [];
    return savedJobs.map((saved) => {
      const live = publishedJobs.find((j) => j.id === saved.id);
      return {
        ...(live || saved),
        savedAt: saved.savedAt,
        isAvailable: Boolean(live),
      };
    });
  }, [savedJobs, publishedJobs]);

  // Compute recommended jobs based on candidate profile skills or recent published listings
  const recommendedJobs = useMemo(() => {
    if (!publishedJobs || publishedJobs.length === 0) return [];

    return publishedJobs
      .map((job) => {
        let matchedSkills = [];
        let score = 0;

        if (candidateSkills.length > 0) {
          const jobSkillsText = (job.skills || "").toLowerCase();
          const jobTitleText = (job.title || "").toLowerCase();
          const jobDescText = (job.description || "").toLowerCase();

          matchedSkills = candidateSkills.filter((skill) => {
            if (!skill) return false;
            return (
              jobSkillsText.includes(skill) ||
              jobTitleText.includes(skill) ||
              jobDescText.includes(skill)
            );
          });

          score = matchedSkills.length;
        }

        return {
          ...job,
          matchedSkills,
          score,
        };
      })
      .sort((a, b) => {
        // Prioritize jobs with more matching skills
        if (b.score !== a.score) return b.score - a.score;
        // Then prioritize by newest creation/posting date
        const dateA = new Date(a.createdAt || a.posted || 0).getTime();
        const dateB = new Date(b.createdAt || b.posted || 0).getTime();
        return dateB - dateA;
      });
  }, [publishedJobs, candidateSkills]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "under_review":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border-blue-200 dark:border-blue-800";
      case "shortlisted":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800";
      case "interview_scheduled":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-200 dark:border-amber-800";
      case "interviewed":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 border-orange-200 dark:border-orange-800";
      case "offered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800";
      case "accepted":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border-red-200 dark:border-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock className="h-4 w-4" />;
      case "under_review":
        return <FiEye className="h-4 w-4" />;
      case "shortlisted":
        return <FiStar className="h-4 w-4" />;
      case "interview_scheduled":
        return <FiCalendar className="h-4 w-4" />;
      case "interviewed":
        return <FiUser className="h-4 w-4" />;
      case "offered":
        return <FiCheckCircle className="h-4 w-4" />;
      case "accepted":
        return <FiCheckCircle className="h-4 w-4" />;
      case "rejected":
        return <FiXCircle className="h-4 w-4" />;
      case "withdrawn":
        return <FiXCircle className="h-4 w-4" />;
      default:
        return <FiClock className="h-4 w-4" />;
    }
  };

  const stats = realApplications.reduce(
    (acc, app) => {
      acc.total++;
      acc.applied++;
      if (app.status === "under_review" || app.status === "viewed")
        acc.viewed++;
      else if (app.status === "shortlisted") acc.shortlisted++;
      else if (app.status === "offered" || app.status === "accepted")
        acc.offers++;
      else if (
        app.status === "interview_scheduled" ||
        app.status === "interviewed"
      )
        acc.interviews++;
      else if (app.status === "rejected") acc.rejected++;
      return acc;
    },
    {
      total: 0,
      applied: 0,
      viewed: 0,
      shortlisted: 0,
      interviews: 0,
      offers: 0,
      rejected: 0,
      saved: getSavedJobsCount(),
    }
  );

  const handleSaveJob = (jobOrId) => {
    if (!jobOrId) return;
    const jobId = typeof jobOrId === "object" ? jobOrId.id : jobOrId;
    const job = typeof jobOrId === "object" ? jobOrId : publishedJobs.find((j) => j.id === jobId);

    if (isJobSaved(jobId)) {
      unsaveJob(jobId);
      showFeedback("info", "Removed from saved jobs.");
    } else if (job) {
      saveJob(job);
      showFeedback("success", `"${job.title}" saved to bookmarks.`);
    }
  };

  const handleUploadResume = async (file) => {
    if (!file) return;

    // Validate file size (5 MB limit)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      showFeedback("error", "File size exceeds 5 MB limit. Please select a smaller PDF or DOCX file.");
      return;
    }

    // Validate file extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["pdf", "doc", "docx"];
    if (!extension || !validExtensions.includes(extension)) {
      showFeedback("error", "Invalid file format. Please upload a PDF, DOC, or DOCX document.");
      return;
    }

    try {
      setResumeUploading(true);
      const response = await resumeService.uploadResume(file);
      if (response.success) {
        await fetchResumes();
        showFeedback("success", `"${file.name}" uploaded successfully.`);
      } else {
        showFeedback("error", response.error || "Failed to upload resume.");
      }
    } catch (err) {
      showFeedback("error", `Error uploading resume: ${err.message}`);
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSetDefaultResume = async (id) => {
    try {
      setActionLoadingId(id);
      const response = await resumeService.setDefaultResume(id);
      if (response.success) {
        await fetchResumes();
        showFeedback("success", "Default resume updated successfully.");
      } else {
        showFeedback("error", response.error || "Failed to set default resume.");
      }
    } catch (err) {
      showFeedback("error", `Error setting default resume: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadResume = async (id, name) => {
    try {
      await resumeService.downloadResume(id, name);
      showFeedback("success", `"${name}" downloaded successfully.`);
    } catch (err) {
      showFeedback("error", `Error downloading resume: ${err.message}`);
    }
  };

  const handleDeleteResume = (id, name = "this resume") => {
    setResumeToDelete({ id, name });
  };

  const confirmDeleteResume = async () => {
    if (!resumeToDelete) return;
    try {
      setActionLoadingId(resumeToDelete.id);
      const response = await resumeService.deleteResume(resumeToDelete.id);
      if (response.success) {
        await fetchResumes();
        showFeedback("success", `"${resumeToDelete.name}" deleted successfully.`);
      } else {
        showFeedback("error", response.error || "Failed to delete resume.");
      }
    } catch (err) {
      showFeedback("error", `Error deleting resume: ${err.message}`);
    } finally {
      setActionLoadingId(null);
      setResumeToDelete(null);
    }
  };

  const handleWithdrawApplication = (application) => {
    setApplicationToWithdraw(application);
  };

  const confirmWithdrawApplication = async () => {
    if (!applicationToWithdraw) return;
    try {
      setActionLoadingId(applicationToWithdraw.id);
      const response = await applicationService.withdrawApplication(applicationToWithdraw.id);
      if (response.success) {
        await fetchUserApplications();
        showFeedback("success", "Application successfully withdrawn.");
      } else {
        showFeedback("error", response.error || "Failed to withdraw application.");
      }
    } catch (err) {
      showFeedback("error", err.message || "Failed to withdraw application.");
    } finally {
      setActionLoadingId(null);
      setApplicationToWithdraw(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getSectionTitle = () => {
    switch (activeTab) {
      case "applications":
        return "My Applications";
      case "saved":
        return "Saved Jobs";
      case "recommended":
        return "Recommended For You";
      case "resumes":
        return "My Resumes";
      default:
        return "Candidate Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Mobile sidebar backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600/50 dark:bg-gray-900/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Professional Candidate Hub Sidebar */}
      <JobSeekerSidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSidebarOpen(false);
        }}
        counts={{
          applications: realApplications.length,
          saved: getSavedJobsCount(),
          resumes: resumes.length,
          recommended: recommendedJobs.length,
        }}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-label="Open sidebar"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {getSectionTitle()}
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
                Welcome back, {user?.name || "Job Seeker"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            {/* Non-blocking feedback notification banner */}
            {feedback && (
              <div
                role="alert"
                className={`mb-6 flex items-center justify-between p-4 rounded-xl border shadow-sm transition-all duration-200 text-xs sm:text-sm font-medium ${
                  feedback.type === "success"
                    ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800"
                    : feedback.type === "info"
                    ? "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                    : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {feedback.type === "success" ? (
                    <FiCheckCircle className="text-base text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : feedback.type === "info" ? (
                    <FiInfo className="text-base text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  ) : (
                    <FiAlertCircle className="text-base text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-black/5 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <FiX className="text-sm" />
                </button>
              </div>
            )}

            {/* Dashboard Header with KPI summary cards */}
            <DashboardHeader
              user={user}
              stats={stats}
              onTabChange={handleTabChange}
            />

            {/* Responsive Dashboard Tabs */}
            <DashboardTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              counts={{
                applications: realApplications.length,
                saved: getSavedJobsCount(),
                resumes: resumes.length,
                recommended: recommendedJobs.length,
              }}
            />

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                {/* Recent Applications */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        Recent Applications
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Your latest submissions and active progress
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("applications")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View All ({realApplications.length})
                    </button>
                  </div>

                  {applicationsLoading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="animate-pulse flex items-center justify-between py-3"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                          </div>
                          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
                        </div>
                      ))}
                    </div>
                  ) : realApplications.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {realApplications.slice(0, 3).map((application) => {
                        const title = application.job?.title || "Position Applied";
                        const company = application.job?.company || "Company";
                        const location = application.job?.location;
                        const date = application.applicationDate
                          ? new Date(application.applicationDate).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric", year: "numeric" }
                            )
                          : "Recently";

                        return (
                          <div
                            key={application.id || application._id}
                            className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {title}
                                  </h3>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    • {company}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                  {location && <span>{location}</span>}
                                  {location && <span>•</span>}
                                  <span>Applied {date}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                    application.status
                                  )}`}
                                >
                                  {getStatusIcon(application.status)}
                                  <span className="capitalize">
                                    {application.status?.replace("_", " ") || "Pending"}
                                  </span>
                                </span>
                                {application.jobId && (
                                  <Link
                                    to={`/jobs/${application.jobId}`}
                                    className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                  >
                                    View Job
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center">
                      <FiBriefcase className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                      <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No applications submitted yet
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Explore available listings and apply directly.
                      </p>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => setActiveTab("recommended")}
                          className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                        >
                          Explore Recommended Jobs
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explore Opportunities */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 mb-8 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        Explore Opportunities
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Newly listed vacancies open for applications
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("recommended")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View All ({publishedJobs.length})
                    </button>
                  </div>

                  {jobsLoading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="animate-pulse flex items-center justify-between py-3"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                          </div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : publishedJobs.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {publishedJobs.slice(0, 3).map((job) => (
                        <Link
                          key={job.id}
                          to={`/jobs/${job.id}`}
                          className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {job.title}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  • {job.company}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                {job.location && (
                                  <span className="flex items-center gap-1">
                                    <FiMapPin className="text-[11px]" />
                                    {job.location}
                                  </span>
                                )}
                                {job.type && (
                                  <span className="flex items-center gap-1">
                                    <FiBriefcase className="text-[11px]" />
                                    {job.type}
                                  </span>
                                )}
                                {job.salary && (
                                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <FiDollarSign className="text-[11px]" />
                                    {job.salary}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              View details &rarr;
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center">
                      <FiBriefcase className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                      <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No active listings available
                      </p>
                    </div>
                  )}
                </div>

                {/* Recommended Jobs */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        Recommended For You
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {candidateSkills.length > 0
                          ? "Ranked according to your profile skills"
                          : "Fresh active positions on the platform"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("recommended")}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View All ({recommendedJobs.length})
                    </button>
                  </div>

                  {jobsLoading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="animate-pulse flex items-center justify-between py-3"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                          </div>
                          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : recommendedJobs.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {recommendedJobs.slice(0, 3).map((job) => {
                        const isSaved = isJobSaved(job.id);
                        return (
                          <div
                            key={job.id}
                            className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {job.title}
                                  </h3>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    • {job.company}
                                  </span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                                  {job.location && (
                                    <span className="flex items-center gap-1">
                                      <FiMapPin className="text-[11px]" />
                                      {job.location}
                                    </span>
                                  )}
                                  {job.salary && (
                                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                      <FiDollarSign className="text-[11px]" />
                                      {job.salary}
                                    </span>
                                  )}
                                  {job.matchedSkills && job.matchedSkills.length > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                      {job.matchedSkills.length} skill match
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleSaveJob(job)}
                                  title={isSaved ? "Saved" : "Save job"}
                                  className={`p-2 rounded-lg border text-xs transition-colors ${
                                    isSaved
                                      ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-400"
                                      : "border-gray-200 dark:border-gray-700 text-gray-400 hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-400"
                                  }`}
                                >
                                  <FiBookmark className={isSaved ? "fill-current" : ""} />
                                </button>

                                <Link
                                  to={`/jobs/${job.id}`}
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                                >
                                  View Job
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center">
                      <FiBriefcase className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                      <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No open positions available
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Check back soon for newly published roles.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === "applications" && (
              <ApplicationList
                applications={realApplications}
                loading={applicationsLoading}
                error={applicationsError}
                initialStatus={applicationStatusFilter}
                onRetry={fetchUserApplications}
                onExplore={() => handleTabChange("recommended")}
                onWithdraw={handleWithdrawApplication}
                onFeedback={showFeedback}
                actionLoadingId={actionLoadingId}
              />
            )}

            {/* Saved Jobs Tab */}
            {activeTab === "saved" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Saved Positions ({resolvedSavedJobs.length})
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Bookmarked listings saved for application and follow-up
                      </p>
                    </div>
                    {resolvedSavedJobs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("recommended")}
                        className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Explore Recommended Jobs &rarr;
                      </button>
                    )}
                  </div>
                </div>

                {resolvedSavedJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resolvedSavedJobs.map((job) => (
                      <SavedJobCard
                        key={job.id}
                        job={job}
                        onRemove={handleSaveJob}
                        isAvailable={job.isAvailable}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm max-w-lg mx-auto">
                    <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiBookmark className="text-2xl" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                      No saved jobs yet
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                      Bookmark interesting job postings while exploring to review or apply to them later.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("recommended")}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                    >
                      Explore Recommended Jobs
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Recommended Jobs Tab */}
            {activeTab === "recommended" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Recommended Opportunities ({recommendedJobs.length})
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {candidateSkills.length > 0
                          ? `Relevance-ranked using your profile skills (${candidateSkills.slice(0, 4).join(", ")}${candidateSkills.length > 4 ? "..." : ""})`
                          : "Latest published roles from verified organizations"}
                      </p>
                    </div>
                  </div>
                </div>

                {jobsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm animate-pulse space-y-4"
                      >
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : recommendedJobs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedJobs.map((job) => (
                      <RecommendedJobCard
                        key={job.id}
                        job={job}
                        isSaved={isJobSaved(job.id)}
                        onToggleSave={handleSaveJob}
                        matchedSkills={job.matchedSkills || []}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm max-w-lg mx-auto">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FiStar className="text-2xl" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                      No recommendations right now
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                      New job openings will appear here as employers publish new positions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Resumes Tab */}
            {activeTab === "resumes" && (
              <div className="space-y-8">
                <ResumeManager
                  resumes={resumes}
                  loading={resumesLoading}
                  error={resumesError}
                  uploading={resumeUploading}
                  actionLoadingId={actionLoadingId}
                  onUpload={handleUploadResume}
                  onSetDefault={handleSetDefaultResume}
                  onDownload={handleDownloadResume}
                  onDelete={handleDeleteResume}
                  onRetry={fetchResumes}
                />

                <ProfileIntegrityCard user={user} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Accessible In-App Modal: Confirm Delete Resume */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center flex-shrink-0">
                <FiTrash2 className="text-lg" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Delete Resume
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to permanently delete{" "}
              <strong className="text-gray-900 dark:text-white font-semibold">
                "{resumeToDelete.name}"
              </strong>
              ? This file will be removed from your profile.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setResumeToDelete(null)}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteResume}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition flex items-center gap-2 shadow-sm"
              >
                {actionLoadingId === resumeToDelete.id && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Delete Resume</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessible In-App Modal: Confirm Withdraw Application */}
      {applicationToWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center flex-shrink-0">
                <FiAlertCircle className="text-lg" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Withdraw Application
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to withdraw your application for{" "}
              <strong className="text-gray-900 dark:text-white font-semibold">
                "{applicationToWithdraw.job?.title || "this position"}"
              </strong>{" "}
              at{" "}
              <strong className="text-gray-900 dark:text-white font-semibold">
                {applicationToWithdraw.job?.company || "the company"}
              </strong>
              ? The employer will be notified that you are no longer in consideration.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setApplicationToWithdraw(null)}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition"
              >
                Keep Application
              </button>
              <button
                type="button"
                onClick={confirmWithdrawApplication}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl transition flex items-center gap-2 shadow-sm"
              >
                {actionLoadingId === applicationToWithdraw.id && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Withdraw Application</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
