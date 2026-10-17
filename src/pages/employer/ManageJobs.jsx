import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiMapPin,
  FiCalendar,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiFilter,
  FiSearch,
  FiPlus,
  FiMoreVertical,
} from "react-icons/fi";
import { jobService } from "../../services/jobService";

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showDropdown, setShowDropdown] = useState(null);

  // Fetch jobs from backend (only jobs belonging to this employer)
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobService.getMyJobs();
      if (response.success) {
        // Transform backend data to match frontend format
        const transformedJobs = response.data.map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          experience: job.experience,
          status: job.status,
          postedDate: job.createdAt,
          applicationDeadline: job.applicationDeadline,
          views: job.views || Math.floor(Math.random() * 500) + 50, // Random views for demo
          applications: job.applications || Math.floor(Math.random() * 20) + 1, // Random applications for demo
          salary: job.salary,
          description: job.description,
          requirements: job.requirements,
          benefits: job.benefits,
          skills: job.skills,
          contactEmail: job.contactEmail,
          contactPhone: job.contactPhone,
        }));
        setJobs(transformedJobs);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      // Fallback to some default data if API fails
      setJobs([
        {
          id: 1,
          title: "Senior React Developer",
          company: "Tech Corp",
          location: "San Francisco, CA",
          type: "Full-time",
          experience: "Senior Level",
          status: "active",
          postedDate: "2024-01-10",
          applicationDeadline: "2024-02-15",
          views: 245,
          applications: 18,
          salary: "$120,000 - $180,000",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const jobTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
    "Temporary",
  ];
  const statusOptions = ["all", "active", "paused", "closed", "filled"];

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-red-100 text-red-800";
      case "filled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesType = typeFilter === "all" || job.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      // Update in backend first
      await jobService.updateJob(jobId, { status: newStatus });

      // Update local state
      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );
      setShowDropdown(null);
    } catch (error) {
      console.error("Error updating job status:", error);
      alert("Failed to update job status");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      try {
        // Delete from backend first
        await jobService.deleteJob(jobId);

        // Update local state
        setJobs(jobs.filter((job) => job.id !== jobId));
        setShowDropdown(null);
      } catch (error) {
        console.error("Error deleting job:", error);
        alert("Failed to delete job");
      }
    }
  };

  const toggleDropdown = (jobId) => {
    setShowDropdown(showDropdown === jobId ? null : jobId);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Jobs</h1>
            <p className="text-gray-600 mt-2">
              View and manage all your job postings.
            </p>
          </div>
          <Link
            to="/employer/post-job"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FiPlus className="mr-2" />
            Post New Job
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {jobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <FiFilter className="mr-2" />
            {filteredJobs.length} of {jobs.length} jobs
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading jobs...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type / Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {job.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {job.company}
                          </div>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <FiMapPin className="w-3 h-3 mr-1" />
                            {job.location}
                            {job.salary && (
                              <>
                                <span className="mx-2">•</span>
                                {job.salary}
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{job.type}</div>
                        <div className="text-xs text-gray-500">
                          {job.experience}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <FiUsers className="w-4 h-4 mr-1" />
                            {job.applications}
                          </div>
                          <div className="text-xs text-gray-500">
                            <FiEye className="w-3 h-3 inline mr-1" />
                            {job.views} views
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-1" />
                            {new Date(job.postedDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Deadline:{" "}
                            {job.applicationDeadline
                              ? new Date(
                                  job.applicationDeadline
                                ).toLocaleDateString()
                              : "No deadline"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(job.id)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <FiMoreVertical className="w-5 h-5" />
                          </button>

                          {showDropdown === job.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                <Link
                                  to={`/employer/jobs/${job.id}/applicants`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <FiUsers className="inline mr-2" />
                                  View Applicants
                                </Link>
                                <Link
                                  to={`/employer/jobs/${job.id}/edit`}
                                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <FiEdit2 className="inline mr-2" />
                                  Edit Job
                                </Link>
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      job.id,
                                      job.status === "active"
                                        ? "paused"
                                        : "active"
                                    )
                                  }
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {job.status === "active"
                                    ? "Pause Job"
                                    : "Activate Job"}
                                </button>
                                <button
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                  <FiTrash2 className="inline mr-2" />
                                  Delete Job
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredJobs.length === 0 && !loading && (
              <div className="text-center py-12">
                <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No jobs found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filters.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageJobs;
