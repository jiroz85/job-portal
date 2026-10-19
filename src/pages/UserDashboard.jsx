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
  FiFileText,
  FiMenu,
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

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { getPublishedJobs, loading: jobsLoading } = useJobs();
  const { savedJobs, saveJob, unsaveJob, isJobSaved, getSavedJobsCount } = useSavedJobs();


  const publishedJobs = getPublishedJobs();
  const [activeTab, setActiveTab] = useState("overview");
  const [realApplications, setRealApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [resumesError, setResumesError] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

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
      console.log(
        "🔄 UserDashboard: Received status update event",
        event.detail
      );

      // Update the specific application in real-time
      if (event.detail && event.detail.applicantEmail === user?.email) {
        setRealApplications((prevApplications) =>
          prevApplications.map((app) =>
            app.id === event.detail.applicationId
              ? { ...app, status: event.detail.newStatus }
              : app
          )
        );

        // Show notification to user
        const statusMessages = {
          under_review: "Your application is being reviewed!",
          shortlisted: "Congratulations! You have been shortlisted!",
          interview_scheduled: "Interview has been scheduled!",
          interviewed: "Interview completed - awaiting decision",
          offered: "Congratulations! You have received a job offer!",
          accepted: "Welcome aboard! Your application has been accepted.",
          rejected: "Your application was not selected for this position.",
        };

        const message =
          statusMessages[event.detail.newStatus] ||
          `Application status updated to: ${event.detail.newStatus}`;

        // Show browser notification if permitted
        if (Notification.permission === "granted") {
          new Notification("Application Status Update", {
            body: message,
            icon: "/favicon.ico",
          });
        }

        // Show in-app notification
        alert(`📬 ${message}`);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === "applicationStatusUpdate") {
        const statusUpdate = JSON.parse(event.newValue);
        if (statusUpdate.applicantEmail === user?.email) {
          handleStatusUpdate({ detail: statusUpdate });
        }
      }
    };

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
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
  }, [user?.email]);

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
        return "bg-gray-100 text-gray-800";
      case "under_review":
        return "bg-blue-100 text-blue-800";
      case "shortlisted":
        return "bg-indigo-100 text-indigo-800";
      case "interview_scheduled":
        return "bg-purple-100 text-purple-800";
      case "interviewed":
        return "bg-orange-100 text-orange-800";
      case "offered":
        return "bg-green-100 text-green-800";
      case "accepted":
        return "bg-emerald-100 text-emerald-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-800";
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
        return <FiClock className="h-4 w-4" />;
      default:
        return <FiClock className="h-4 w-4" />;
    }
  };

  const stats = realApplications.reduce(
    (acc, app) => {
      acc.total++;
      acc.applied++; // Count all applications as "Applications"
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
    } else if (job) {
      saveJob(job);
    }
  };

  const handleUploadResume = async (file) => {
    if (!file) return;

    // Validate file size (5 MB limit)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      alert("File size exceeds 5 MB limit. Please select a smaller PDF or DOCX file.");
      return;
    }

    // Validate file extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["pdf", "doc", "docx"];
    if (!extension || !validExtensions.includes(extension)) {
      alert("Invalid file format. Please upload a PDF, DOC, or DOCX document.");
      return;
    }

    try {
      setResumeUploading(true);
      const response = await resumeService.uploadResume(file);
      if (response.success) {
        // Refresh resumes without page reload
        await fetchResumes();
      } else {
        alert(response.error || "Failed to upload resume.");
      }
    } catch (err) {
      alert(`Error uploading resume: ${err.message}`);
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
      } else {
        alert(response.error || "Failed to set default resume.");
      }
    } catch (err) {
      alert(`Error setting default resume: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownloadResume = async (id, name) => {
    try {
      await resumeService.downloadResume(id, name);
    } catch (err) {
      alert(`Error downloading resume: ${err.message}`);
    }
  };

  const handleDeleteResume = async (id, name = "this resume") => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      try {
        setActionLoadingId(id);
        const response = await resumeService.deleteResume(id);
        if (response.success) {
          await fetchResumes();
        } else {
          alert(response.error || "Failed to delete resume.");
        }
      } catch (err) {
        alert(`Error deleting resume: ${err.message}`);
      } finally {
        setActionLoadingId(null);
      }
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

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/#browse-jobs"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
            >
              <FiBriefcase className="w-3.5 h-3.5" />
              <span>Browse Jobs</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Header with KPI summary cards */}
            <DashboardHeader
              user={user}
              stats={stats}
              onTabChange={setActiveTab}
            />

            {/* Responsive Dashboard Tabs */}
            <DashboardTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
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
                    <Link
                      to="/#browse-jobs"
                      className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Browse Jobs */}
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
                <Link
                  to="/#browse-jobs"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View All ({publishedJobs.length})
                </Link>
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
            onRetry={fetchUserApplications}
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
                  <Link
                    to="/#browse-jobs"
                    className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Browse More Opportunities &rarr;
                  </Link>
                )}
              </div>
            </div>

            {resolvedSavedJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resolvedSavedJobs.map((job) => (
                  <SavedJobCard
                    key={job.id}
                    job={job}
                    onRemove={unsaveJob}
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
                <Link
                  to="/#browse-jobs"
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                >
                  Explore Active Jobs
                </Link>
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
                <Link
                  to="/#browse-jobs"
                  className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  View All Platform Jobs &rarr;
                </Link>
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  New job openings will appear here as employers publish new positions.
                </p>
                <Link
                  to="/#browse-jobs"
                  className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                >
                  Browse Job Listings
                </Link>
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
    </div>
  );
};

export default UserDashboard;
