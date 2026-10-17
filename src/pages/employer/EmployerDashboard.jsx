import React, { useState, useEffect, useCallback } from "react";
import {
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiTrendingUp,
  FiEye,
  FiCalendar,
  FiClock,
  FiPlus,
  FiActivity,
  FiRefreshCw,
  FiXCircle,
} from "react-icons/fi";
import { jobService } from "../../services/jobService";
import { applicationService } from "../../services/applicationService";
import EmployerNotifications from "../../components/employer/EmployerNotifications";
import EmployerWorkflowDemo from "../../components/employer/EmployerWorkflowDemo";

const EmployerDashboard = () => {
  const [stats, setStats] = useState([
    {
      title: "Active Jobs",
      value: "0",
      change: "+2",
      changeType: "increase",
      icon: FiBriefcase,
      color: "bg-blue-500",
    },
    {
      title: "Total Applicants",
      value: "0",
      change: "+12",
      changeType: "increase",
      icon: FiUsers,
      color: "bg-green-500",
    },
    {
      title: "Interviews Scheduled",
      value: "0",
      change: "+3",
      changeType: "increase",
      icon: FiCalendar,
      color: "bg-purple-500",
    },
    {
      title: "Pending Reviews",
      value: "0",
      change: "-1",
      changeType: "decrease",
      icon: FiFileText,
      color: "bg-orange-500",
    },
  ]);

  const [recentApplications, setRecentApplications] = useState([]);
  const [jobPerformance, setJobPerformance] = useState([]);
  const [showWorkflowDemo, setShowWorkflowDemo] = useState(false);

  // Fetch dashboard data from backend
  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch employer's own jobs and applications
      const [jobsResponse, applicationsResponse] = await Promise.all([
        jobService.getMyJobs(),
        applicationService.getAllApplications(),
      ]);

      const jobs = jobsResponse.success ? jobsResponse.data : [];
      const applications = applicationsResponse.success
        ? applicationsResponse.data
        : [];

      console.log("EmployerDashboard: Fetched data:", {
        jobsCount: jobs.length,
        applicationsCount: applications.length,
      });

      // Calculate real stats
      const activeJobsCount = jobs.filter(
        (job) => job.status === "active" || job.status === "Published"
      ).length;

      const totalApplications = applications.length;
      const interviewsScheduled = applications.filter(
        (app) =>
          app.status === "interview_scheduled" || app.status === "interviewed"
      ).length;
      const pendingReviews = applications.filter(
        (app) => app.status === "pending" || app.status === "under_review"
      ).length;

      setStats([
        {
          title: "Active Jobs",
          value: activeJobsCount.toString(),
          change: `+${Math.floor(Math.random() * 5) + 1}`,
          changeType: "increase",
          icon: FiBriefcase,
          color: "bg-blue-500",
        },
        {
          title: "Total Applicants",
          value: totalApplications.toString(),
          change: `+${Math.floor(Math.random() * 15) + 5}`,
          changeType: "increase",
          icon: FiUsers,
          color: "bg-green-500",
        },
        {
          title: "Interviews Scheduled",
          value: interviewsScheduled.toString(),
          change: `+${Math.floor(Math.random() * 5) + 1}`,
          changeType: "increase",
          icon: FiCalendar,
          color: "bg-purple-500",
        },
        {
          title: "Pending Reviews",
          value: pendingReviews.toString(),
          change: `-${Math.floor(Math.random() * 3) + 1}`,
          changeType: "decrease",
          icon: FiFileText,
          color: "bg-orange-500",
        },
      ]);

      // Set real recent applications
      const recentApps = applications.slice(0, 5).map((application) => ({
        id: application.id,
        applicantName: application.applicantName,
        jobTitle: application.job?.title || "Unknown Position",
        appliedDate: new Date(application.applicationDate).toLocaleDateString(),
        status: application.status,
        avatar: application.applicantName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
      }));
      setRecentApplications(recentApps);

      // Set job performance data with real application counts
      const performanceData = jobs.slice(0, 3).map((job) => {
        const jobApplications = applications.filter(
          (app) => app.jobId === job.id
        );
        return {
          title: job.title,
          views: Math.floor(Math.random() * 500) + 100, // Still mock since views aren't tracked
          applications: jobApplications.length,
          conversionRate:
            jobApplications.length > 0
              ? `${(
                  (jobApplications.filter(
                    (app) =>
                      app.status === "offered" || app.status === "accepted"
                  ).length /
                    jobApplications.length) *
                  100
                ).toFixed(1)}%`
              : "0%",
          status: job.status,
        };
      });
      setJobPerformance(performanceData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    // Listen for application submission events
    const handleApplicationSubmitted = (event) => {
      console.log(
        "EmployerDashboard: Received applicationSubmitted event",
        event.detail
      );
      fetchDashboardData();
    };

    // Listen for localStorage changes (cross-tab communication)
    const handleStorageChange = (event) => {
      if (
        event.key === "applicationSubmitted" ||
        event.key === "applicationSubmittedTimestamp"
      ) {
        console.log(
          "EmployerDashboard: Detected localStorage change, refreshing..."
        );
        fetchDashboardData();
      }
    };

    window.addEventListener("applicationSubmitted", handleApplicationSubmitted);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "applicationSubmitted",
        handleApplicationSubmitted
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchDashboardData]);

  // Add a manual refresh function
  const handleRefresh = () => {
    fetchDashboardData();
  };

  const quickActions = [
    {
      title: "Post New Job",
      description: "Create a new job posting",
      icon: FiPlus,
      color: "bg-indigo-600",
      href: "/employer/post-job",
    },
    {
      title: "View Applicants",
      description: "Review job applications",
      icon: FiUsers,
      color: "bg-green-600",
      href: "/employer/applicants",
    },
    {
      title: "Schedule Interviews",
      description: "Manage interview calendar",
      icon: FiCalendar,
      color: "bg-purple-600",
      href: "/employer/interviews",
    },
    {
      title: "View Analytics",
      description: "Track job performance",
      icon: FiTrendingUp,
      color: "bg-blue-600",
      href: "/employer/analytics",
    },
  ];

  const workflowActions = [
    {
      title: "See Workflow Demo",
      description: "Step-by-step hiring process",
      icon: FiActivity,
      color: "bg-pink-600",
      action: () => setShowWorkflowDemo(true),
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewing":
        return "bg-blue-100 text-blue-800";
      case "interview":
        return "bg-purple-100 text-purple-800";
      case "hired":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Employer Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your job postings and track applicant progress.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <EmployerNotifications />
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3 mr-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-1">
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "increase"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    from last week
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Applications
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentApplications.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {application.avatar}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {application.applicantName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {application.jobTitle}
                        </p>
                        <p className="text-xs text-gray-400">
                          {application.appliedDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {application.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800">
                        <FiEye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Job Performance */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Job Performance
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {jobPerformance.map((job, index) => (
                  <div
                    key={index}
                    className="border-b border-gray-200 pb-4 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {job.title}
                      </h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {job.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <p className="text-gray-500">Views</p>
                        <p className="font-semibold">{job.views}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Applications</p>
                        <p className="font-semibold">{job.applications}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">Conversion</p>
                        <p className="font-semibold">{job.conversionRate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...quickActions, ...workflowActions].map((action, index) => (
                <a
                  key={index}
                  href={action.href || "#"}
                  onClick={action.action}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className={`${action.color} rounded-lg p-2 mr-3`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Demo Modal */}
      {showWorkflowDemo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Step-by-Step Hiring Workflow
                </h2>
                <button
                  onClick={() => setShowWorkflowDemo(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>
              <EmployerWorkflowDemo />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
