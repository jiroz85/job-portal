import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiDollarSign,
  FiCalendar,
  FiFilter,
  FiBookmark,
  FiSettings,
  FiDownload,
  FiEye,
  FiSearch,
  FiUpload,
  FiStar,
  FiTrendingUp,
  FiFileText,
  FiEdit,
} from "react-icons/fi";
import useAuth from "../hooks/useAuth";
import { useApplications } from "../context/ApplicationContext";
import { useJobs } from "../context/JobContext";
import { useSavedJobs } from "../context/SavedJobsContext";
import { applicationService } from "../services/applicationService";
import { resumeService } from "../services/resumeService";

const UserDashboard = () => {
  const { user } = useAuth();
  const { getUserApplications } = useApplications();
  const { getPublishedJobs } = useJobs();
  const { saveJob, unsaveJob, isJobSaved, getSavedJobsCount } = useSavedJobs();

  const userApplications = getUserApplications(user?.email);
  const publishedJobs = getPublishedJobs();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [profileCompletion] = useState(75);
  const [realApplications, setRealApplications] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(false);

  const fetchResumes = async () => {
    try {
      setResumesLoading(true);
      const response = await resumeService.getMyResumes();
      if (response.success) {
        setResumes(response.data);
      }
    } catch (error) {
      console.error("Error fetching resumes:", error);
    } finally {
      setResumesLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  // Fetch real applications from backend
  useEffect(() => {
    const fetchUserApplications = async () => {
      if (user?.email) {
        try {
          const response = await applicationService.getApplicationsByEmail(
            user.email
          );
          if (response.success) {
            setRealApplications(response.data);
          }
        } catch (error) {
          console.error("Error fetching user applications:", error);
        }
      }
    };

    fetchUserApplications();
  }, [user?.email]);

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

  const mockSavedJobs = [
    {
      id: 1,
      title: "Senior React Developer",
      company: "Tech Corp",
      location: "San Francisco, CA",
      salary: "$120,000 - $180,000",
      posted: "2 days ago",
      type: "Full-time",
      description: "Looking for experienced React developer...",
    },
    {
      id: 2,
      title: "Product Designer",
      company: "Design Co",
      location: "Remote",
      salary: "$80,000 - $110,000",
      posted: "1 week ago",
      type: "Full-time",
      description: "Creative product designer needed...",
    },
  ];

  const mockRecommendedJobs = [
    {
      id: 5,
      title: "Frontend Engineer",
      company: "StartupXYZ",
      location: "New York, NY",
      salary: "$90,000 - $130,000",
      posted: "1 day ago",
      type: "Full-time",
      match: "95%",
      description: "Exciting opportunity for frontend engineer...",
    },
    {
      id: 6,
      title: "React Native Developer",
      company: "MobileFirst",
      location: "Remote",
      salary: "$100,000 - $140,000",
      posted: "3 days ago",
      type: "Full-time",
      match: "88%",
      description: "Build amazing mobile apps with React Native...",
    },
  ];

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

  const filteredApplications = realApplications.filter((app) => {
    const matchesSearch =
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSaveJob = (jobId) => {
    const job = publishedJobs.find((j) => j.id === jobId);
    if (job) {
      if (isJobSaved(jobId)) {
        unsaveJob(jobId);
      } else {
        saveJob(job);
      }
    }
  };

  const handleUploadResume = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5 MB limit. Please select a smaller PDF or DOCX file.");
        event.target.value = "";
        return;
      }
      try {
        const response = await resumeService.uploadResume(file);
        if (response.success) {
          alert("Resume uploaded successfully!");
          fetchResumes();
        }
      } catch (err) {
        alert(`Error uploading resume: ${err.message}`);
      } finally {
        event.target.value = "";
      }
    }
  };

  const handleSetDefaultResume = async (id) => {
    try {
      const response = await resumeService.setDefaultResume(id);
      if (response.success) {
        fetchResumes();
      }
    } catch (err) {
      alert(`Error setting default resume: ${err.message}`);
    }
  };

  const handleDownloadResume = async (id, name) => {
    try {
      await resumeService.downloadResume(id, name);
    } catch (err) {
      alert(`Error downloading resume: ${err.message}`);
    }
  };

  const handleDeleteResume = async (id) => {
    if (window.confirm("Are you sure you want to delete this resume?")) {
      try {
        const response = await resumeService.deleteResume(id);
        if (response.success) {
          fetchResumes();
        }
      } catch (err) {
        alert(`Error deleting resume: ${err.message}`);
      }
    }
  };

  const handleAcceptOffer = async (applicationId) => {
    try {
      const response = await applicationService.updateApplicationStatus(
        applicationId,
        "accepted"
      );
      if (response.success) {
        // Update local state
        setRealApplications((prevApplications) =>
          prevApplications.map((app) =>
            app.id === applicationId ? { ...app, status: "accepted" } : app
          )
        );

        // Show success message
        alert("🎉 Congratulations! You have accepted the job offer!");

        // Notify employer (in real app, this would send a notification)
        console.log("Offer accepted for application:", applicationId);
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      alert("Failed to accept offer. Please try again.");
    }
  };

  const handleRejectOffer = async (applicationId) => {
    try {
      const response = await applicationService.updateApplicationStatus(
        applicationId,
        "rejected"
      );
      if (response.success) {
        // Update local state
        setRealApplications((prevApplications) =>
          prevApplications.map((app) =>
            app.id === applicationId ? { ...app, status: "rejected" } : app
          )
        );

        // Show success message
        alert("You have rejected the job offer.");

        // Notify employer (in real app, this would send a notification)
        console.log("Offer rejected for application:", applicationId);
      }
    } catch (error) {
      console.error("Error rejecting offer:", error);
      alert("Failed to reject offer. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || "User"}!
          </h1>
          <p className="mt-2 text-gray-600">
            Here's an overview of your job applications and activities.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              "overview",
              "applications",
              "saved",
              "recommended",
              "resumes",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FiBriefcase className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Applications
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.applied}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <FiUser className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Interviews
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.interviews}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FiCheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Offers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.offers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <FiXCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Rejected
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.rejected}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-8">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Applications
                </h2>
                <Link
                  to="#"
                  onClick={() => setActiveTab("applications")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {userApplications.slice(0, 3).map((application) => (
                  <div key={application.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">
                            {application.jobTitle}
                          </h3>
                          <span className="ml-3 text-sm text-gray-500">
                            at {application.company}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Applied on{" "}
                          {new Date(
                            application.appliedDate
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {getStatusIcon(application.status)}
                          <span className="ml-1 capitalize">
                            {application.status}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Browse Jobs */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Browse Jobs
                </h2>
                <Link
                  to="/jobs"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {publishedJobs.slice(0, 3).map((job) => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="block">
                    <div className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              {job.title}
                            </h3>
                            <span className="ml-3 text-sm text-gray-500">
                              at {job.company}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <FiMapPin className="h-3 w-3 mr-1" />
                            {job.location}
                            <span className="mx-2">•</span>
                            <FiBriefcase className="h-3 w-3 mr-1" />
                            {job.type}
                            <span className="mx-2">•</span>
                            <FiDollarSign className="h-3 w-3 mr-1" />
                            {job.salary}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          <FiClock className="inline h-3 w-3 mr-1" />
                          {job.posted}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recommended Jobs */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recommended Jobs
                </h2>
                <Link
                  to="#"
                  onClick={() => setActiveTab("recommended")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {mockRecommendedJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">
                            {job.title}
                          </h3>
                          <span className="ml-3 text-sm text-gray-500">
                            at {job.company}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiMapPin className="h-3 w-3 mr-1" />
                          {job.location}
                          <span className="mx-2">•</span>
                          <FiDollarSign className="h-3 w-3 mr-1" />
                          {job.salary}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiStar className="h-3 w-3 mr-1" />
                          {job.match} match
                        </span>
                        <button
                          onClick={() => handleSaveJob(job.id)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <FiBookmark className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div>
            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview_scheduled">
                    Interview Scheduled
                  </option>
                  <option value="interviewed">Interviewed</option>
                  <option value="offered">Offered</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Applications ({filteredApplications.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((application) => (
                    <div key={application.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-sm font-medium text-gray-900">
                              {application.job?.title || "Unknown Position"}
                            </h3>
                            <span className="ml-3 text-sm text-gray-500">
                              at {application.job?.company || "Unknown Company"}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <FiMapPin className="h-3 w-3 mr-1" />
                            {application.job?.location ||
                              "Location not specified"}
                            <span className="mx-2">•</span>
                            <FiCalendar className="h-3 w-3 mr-1" />
                            Applied:{" "}
                            {new Date(
                              application.applicationDate
                            ).toLocaleDateString()}
                          </div>
                          {application.interviewDate && (
                            <p className="mt-1 text-sm text-yellow-600">
                              <FiUser className="inline h-3 w-3 mr-1" />
                              Interview:{" "}
                              {new Date(
                                application.interviewDate
                              ).toLocaleDateString()}
                            </p>
                          )}
                          {application.offerDeadline && (
                            <p className="mt-1 text-sm text-green-600">
                              <FiCheckCircle className="inline h-3 w-3 mr-1" />
                              Offer deadline:{" "}
                              {new Date(
                                application.offerDeadline
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              application.status
                            )}`}
                          >
                            {getStatusIcon(application.status)}
                            <span className="ml-1 capitalize">
                              {application.status}
                            </span>
                          </span>

                          {/* Accept/Reject buttons for offered applications */}
                          {application.status === "offered" && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handleAcceptOffer(application.id)
                                }
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <FiCheckCircle className="h-3 w-3 mr-1" />
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleRejectOffer(application.id)
                                }
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <FiXCircle className="h-3 w-3 mr-1" />
                                Reject
                              </button>
                            </div>
                          )}

                          <Link
                            to={`/jobs/${application.jobId}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No applications found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start browsing and applying for jobs to see them here.
                    </p>
                    <div className="mt-6">
                      <Link
                        to="/jobs"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Browse Jobs
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Saved Jobs Tab */}
        {activeTab === "saved" && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Saved Jobs ({mockSavedJobs.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {mockSavedJobs.length > 0 ? (
                mockSavedJobs.map((job) => (
                  <div key={job.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium text-gray-900">
                            {job.title}
                          </h3>
                          <span className="ml-3 text-sm text-gray-500">
                            at {job.company}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <FiMapPin className="h-3 w-3 mr-1" />
                          {job.location}
                          <span className="mx-2">•</span>
                          <FiDollarSign className="h-3 w-3 mr-1" />
                          {job.salary}
                          <span className="mx-2">•</span>
                          <FiClock className="h-3 w-3 mr-1" />
                          {job.posted}
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {job.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleSaveJob(job.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiBookmark className="h-4 w-4 fill-current" />
                        </button>
                        <Link
                          to={`/jobs/${job.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Job
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <FiBookmark className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No saved jobs yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Save jobs you're interested in to see them here.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/jobs"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommended Jobs Tab */}
        {activeTab === "recommended" && (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recommended Jobs ({mockRecommendedJobs.length})
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Based on your profile and search history
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {mockRecommendedJobs.map((job) => (
                <div key={job.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          {job.title}
                        </h3>
                        <span className="ml-3 text-sm text-gray-500">
                          at {job.company}
                        </span>
                      </div>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <FiMapPin className="h-3 w-3 mr-1" />
                        {job.location}
                        <span className="mx-2">•</span>
                        <FiDollarSign className="h-3 w-3 mr-1" />
                        {job.salary}
                        <span className="mx-2">•</span>
                        <FiClock className="h-3 w-3 mr-1" />
                        {job.posted}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FiStar className="h-3 w-3 mr-1" />
                        {job.match} match
                      </span>
                      <button
                        onClick={() => handleSaveJob(job.id)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <FiBookmark className="h-4 w-4" />
                      </button>
                      <Link
                        to={`/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Job
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumes Tab */}
        {activeTab === "resumes" && (
          <div>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  My Resumes
                </h2>
                <label className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                  <FiUpload className="mr-2" />
                  Upload Resume
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleUploadResume}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="divide-y divide-gray-200">
                {resumesLoading ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Loading your resumes...
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <FiFileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="font-medium">No resumes uploaded yet</p>
                    <p className="text-sm mt-1">Upload a PDF or DOCX file to use when applying for jobs.</p>
                  </div>
                ) : (
                  resumes.map((resume) => (
                    <div key={resume.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiFileText className="h-8 w-8 text-blue-500 mr-3" />
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {resume.name}
                            </h3>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <FiCalendar className="h-3 w-3 mr-1" />
                              {new Date(resume.uploadedDate).toLocaleDateString()}
                              <span className="mx-2">•</span>
                              {resume.size}
                              {resume.isDefault && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Default
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {!resume.isDefault && (
                            <button
                              onClick={() => handleSetDefaultResume(resume.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadResume(resume.id, resume.name)}
                            title="Download resume"
                            className="text-gray-600 hover:text-blue-600 p-1"
                          >
                            <FiDownload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResume(resume.id)}
                            title="Delete resume"
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <FiXCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {user?.email || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Account Type:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {user?.role || "User"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
