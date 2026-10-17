import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiEye,
  FiDownload,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiBriefcase,
  FiFilter,
  FiSearch,
  FiMoreVertical,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiStar,
  FiMessageSquare,
} from "react-icons/fi";
import { applicationService } from "../../services/applicationService";

const ApplicantTracking = () => {
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showDropdown, setShowDropdown] = useState(null);

  const statusOptions = [
    "all",
    "pending",
    "under_review",
    "shortlisted",
    "interview_scheduled",
    "interviewed",
    "offered",
    "accepted",
    "rejected",
    "withdrawn",
  ];

  // Fetch all applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getAllApplications();

      if (response.success && response.data.length > 0) {
        // Transform application data to match the expected format
        const transformedApplicants = response.data.map((application) => ({
          id: application.id,
          name: application.applicantName,
          email: application.applicantEmail,
          phone: application.applicantPhone || "No phone provided",
          location: "Location not specified",
          jobTitle: application.job?.title || "Unknown Position",
          company: application.job?.company || "Unknown Company",
          appliedDate: application.applicationDate,
          status: application.status,
          experience: application.experience || "Not specified",
          skills: application.skills
            ? application.skills.split(",").map((s) => s.trim())
            : [],
          education: application.education || "Not specified",
          resume: application.resumePath || "resume.pdf",
          coverLetter: application.coverLetter || "No cover letter provided",
          rating: 0,
          notes: application.notes || "",
          interviews: [],
          applicationId: application.id,
          expectedSalary: application.expectedSalary,
          availability: application.availability,
          // Verification and risk fields
          isVerified: application.isVerified || false,
          emailVerified: application.emailVerified || false,
          riskScore: application.riskScore || 0,
          flagged: application.flagged || false,
          ipAddress: application.ipAddress,
          verificationToken: application.verificationToken,
        }));

        setApplicants(transformedApplicants);

        // Extract unique job titles for filtering
        const uniqueJobs = [
          ...new Set(transformedApplicants.map((app) => app.jobTitle)),
        ];
        setJobs(uniqueJobs);
      } else {
        setApplicants([]);
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplicants([]);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();

    // Listen for application submission events
    const handleApplicationSubmitted = () => {
      fetchApplications();
    };

    window.addEventListener("applicationSubmitted", handleApplicationSubmitted);

    return () => {
      window.removeEventListener(
        "applicationSubmitted",
        handleApplicationSubmitted
      );
    };
  }, []);

  const jobOptions = ["all", ...jobs];

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
        return <FiClock className="w-4 h-4" />;
      case "under_review":
        return <FiEye className="w-4 h-4" />;
      case "shortlisted":
        return <FiStar className="w-4 h-4" />;
      case "interview_scheduled":
        return <FiCalendar className="w-4 h-4" />;
      case "interviewed":
        return <FiCheckCircle className="w-4 h-4" />;
      case "offered":
        return <FiCheckCircle className="w-4 h-4" />;
      case "accepted":
        return <FiStar className="w-4 h-4" />;
      case "rejected":
        return <FiXCircle className="w-4 h-4" />;
      case "withdrawn":
        return <FiXCircle className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const filteredApplicants = applicants.filter((applicant) => {
    const matchesSearch =
      applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.skills.some((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || applicant.status === statusFilter;
    const matchesJob = jobFilter === "all" || applicant.jobTitle === jobFilter;

    return matchesSearch && matchesStatus && matchesJob;
  });

  const handleStatusChange = async (applicantId, newStatus) => {
    try {
      // Find the application to get the applicationId
      const applicant = applicants.find((a) => a.id === applicantId);
      if (applicant && applicant.applicationId) {
        // Check if status is actually changing
        if (applicant.status === newStatus) {
          console.log(`Status is already ${newStatus}, skipping update`);
          setShowDropdown(null);
          return;
        }

        // Update in backend first
        await applicationService.updateApplicationStatus(
          applicant.applicationId,
          { status: newStatus }
        );
      }

      // Update local state
      setApplicants(
        applicants.map((applicant) =>
          applicant.id === applicantId
            ? { ...applicant, status: newStatus }
            : applicant
        )
      );
      setShowDropdown(null);
    } catch (error) {
      console.error("Error updating application status:", error);
      alert("Failed to update application status");
    }
  };

  const toggleDropdown = (applicantId) => {
    setShowDropdown(showDropdown === applicantId ? null : applicantId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-2 text-gray-500">Loading applicants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Applicant Tracking</h1>
        <p className="text-gray-600 mt-2">
          Manage and track all job applicants in one place.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search applicants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all"
                    ? "All Statuses"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {jobOptions.map((job) => (
                <option key={job} value={job}>
                  {job === "all" ? "All Jobs" : job}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <FiFilter className="mr-2" />
            {filteredApplicants.length} of {applicants.length} applicants
          </div>
        </div>
      </div>

      {/* Applicants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredApplicants.map((applicant) => (
          <div
            key={applicant.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {applicant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {applicant.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {applicant.jobTitle}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown(applicant.id)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <FiMoreVertical className="w-5 h-5" />
                  </button>

                  {showDropdown === applicant.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          onClick={() => setSelectedApplicant(applicant)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiEye className="inline mr-2" />
                          View Details
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <FiMail className="inline mr-2" />
                          Send Email
                        </button>
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <FiMessageSquare className="inline mr-2" />
                          Add Note
                        </button>
                        <div className="border-t border-gray-100"></div>
                        <button
                          onClick={() =>
                            handleStatusChange(applicant.id, "under_review")
                          }
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiEye className="inline mr-2" />
                          Mark as Under Review
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(applicant.id, "shortlisted")
                          }
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiStar className="inline mr-2" />
                          Shortlist
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(
                              applicant.id,
                              "interview_scheduled"
                            )
                          }
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiCalendar className="inline mr-2" />
                          Schedule Interview
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(applicant.id, "offered")
                          }
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <FiCheckCircle className="inline mr-2" />
                          Offer Job
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(applicant.id, "rejected")
                          }
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <FiXCircle className="inline mr-2" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Rating */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      applicant.status
                    )}`}
                  >
                    {getStatusIcon(applicant.status)}
                    <span className="ml-1">{applicant.status}</span>
                  </span>

                  {/* Verification badges */}
                  {applicant.emailVerified && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      ✓ Email Verified
                    </span>
                  )}

                  {applicant.flagged && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      ⚠ Flagged
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {getRatingStars(applicant.rating)}
                </div>
              </div>

              {/* Risk Assessment */}
              {applicant.riskScore > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      Risk Assessment
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        applicant.riskScore > 50
                          ? "text-red-600"
                          : applicant.riskScore > 25
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {applicant.riskScore > 50
                        ? "High Risk"
                        : applicant.riskScore > 25
                        ? "Medium Risk"
                        : "Low Risk"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        applicant.riskScore > 50
                          ? "bg-red-500"
                          : applicant.riskScore > 25
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(applicant.riskScore, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FiMail className="w-4 h-4 mr-2" />
                  {applicant.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiPhone className="w-4 h-4 mr-2" />
                  {applicant.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FiMapPin className="w-4 h-4 mr-2" />
                  {applicant.location}
                </div>
              </div>

              {/* Skills */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {applicant.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {applicant.skills.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      +{applicant.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Experience and Education */}
              <div className="text-sm text-gray-600 mb-4">
                <div className="flex items-center mb-1">
                  <FiBriefcase className="w-4 h-4 mr-2" />
                  {applicant.experience} experience
                </div>
                <div>{applicant.education}</div>
              </div>

              {/* Applied Date */}
              <div className="text-xs text-gray-500 mb-4">
                Applied {new Date(applicant.appliedDate).toLocaleDateString()}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedApplicant(applicant)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center justify-center"
                >
                  <FiEye className="mr-2" />
                  View
                </button>
                <button className="px-3 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50 flex items-center justify-center">
                  <FiDownload className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApplicants.length === 0 && (
        <div className="text-center py-12">
          <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No applicants found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {/* Applicant Detail Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Applicant Details
                </h2>
                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-1">
                  <div className="text-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl font-medium">
                        {selectedApplicant.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedApplicant.name}
                    </h3>
                    <p className="text-gray-500">
                      {selectedApplicant.jobTitle}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiMail className="w-4 h-4 mr-2" />
                          {selectedApplicant.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiPhone className="w-4 h-4 mr-2" />
                          {selectedApplicant.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiMapPin className="w-4 h-4 mr-2" />
                          {selectedApplicant.location}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Experience & Education
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiBriefcase className="w-4 h-4 mr-2" />
                          {selectedApplicant.experience}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedApplicant.education}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="lg:col-span-2">
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicant.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Cover Letter
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {selectedApplicant.coverLetter}
                    </p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Interview Schedule
                    </h4>
                    <div className="space-y-2">
                      {selectedApplicant.interviews.map((interview, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {interview.type}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(interview.date).toLocaleDateString()}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              interview.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {interview.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                    <p className="text-gray-600 text-sm">
                      {selectedApplicant.notes}
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      Schedule Interview
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                      Send Email
                    </button>
                    <button
                      onClick={() => {
                        const targetId = selectedApplicant?.applicationId || selectedApplicant?.id;
                        if (targetId) {
                          applicationService
                            .downloadResume(targetId, selectedApplicant.name)
                            .catch((err) => alert(err.message || "Failed to download resume"));
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Download Resume
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantTracking;
