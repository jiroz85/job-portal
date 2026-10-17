import { useParams, useNavigate } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaBriefcase,
  FaClock,
  FaDollarSign,
  FaArrowLeft,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useJobs } from "../context/JobContext";
import useAuth from "../hooks/useAuth";
import { applicationService } from "../services/applicationService";

const JobDetailPage = () => {
  const { id } = useParams();
  const { getPublishedJobs } = useJobs();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    phone: "",
    experience: "",
    education: "",
    skills: "",
    coverLetter: "",
    resume: null,
  });
  const [errors, setErrors] = useState({});

  // Load job data
  useEffect(() => {
    const jobs = getPublishedJobs();
    const foundJob = jobs.find((j) => j.id === parseInt(id));
    console.log("Looking for job with ID:", id);
    console.log("Available jobs:", jobs);
    console.log("Found job:", foundJob);
    setJob(foundJob);
  }, [id, getPublishedJobs]);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Simple check - in real app this would be an API call
    setShowApplicationModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
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
        alert("File size exceeds 5 MB limit. Please select a smaller PDF or DOCX file.");
        e.target.value = "";
        return;
      }
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
      newErrors.experience = "Experience is required";
    if (!applicationData.education.trim())
      newErrors.education = "Education is required";
    if (!applicationData.skills.trim())
      newErrors.skills = "Skills are required";
    if (!applicationData.coverLetter.trim())
      newErrors.coverLetter = "Cover letter is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (validateApplication()) {
      try {
        // Prepare application data to match backend API - user data comes from authentication
        const applicationPayload = {
          jobId: parseInt(id),
          applicantPhone: applicationData.phone,
          experience: applicationData.experience,
          education: applicationData.education,
          skills: applicationData.skills,
          coverLetter: applicationData.coverLetter,
          availability: "Immediate",
          resume: applicationData.resume, // Include real resume file
        };

        console.log("Submitting application with payload:", applicationPayload);

        // Call the actual API
        const response = await applicationService.submitApplication(
          applicationPayload
        );

        console.log("Application response:", response);

        if (response.success) {
          alert(
            "Application submitted successfully! The employer will be notified."
          );
          setShowApplicationModal(false);
          setApplicationData({
            phone: "",
            experience: "",
            education: "",
            skills: "",
            coverLetter: "",
            resume: null,
          });

          // Trigger a global event to notify dashboard components
          console.log("Dispatching applicationSubmitted event...");
          const eventData = { jobId: parseInt(id), timestamp: Date.now() };
          // Use both custom event and localStorage for cross-tab communication
          window.dispatchEvent(
            new CustomEvent("applicationSubmitted", { detail: eventData })
          );
          localStorage.setItem(
            "applicationSubmitted",
            JSON.stringify(eventData)
          );
          localStorage.setItem(
            "applicationSubmittedTimestamp",
            Date.now().toString()
          );
          console.log("Event dispatched successfully");
        } else {
          throw new Error(response.error || "Failed to submit application");
        }
      } catch (error) {
        console.error("Error submitting application:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);

        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Unknown error occurred";
        alert(`Error submitting application: ${errorMessage}`);
      }
    }
  };

  if (!job) {
    return (
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
            <p className="mt-2 text-gray-600">
              The job you're looking for doesn't exist.
            </p>
            <Link
              to="/jobs"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <Link
          to="/jobs"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <FaArrowLeft className="mr-2" /> Back to Jobs
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Job Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {job.title}
            </h1>
            <p className="text-xl text-gray-700 mb-4">{job.company}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-1 text-gray-500" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center">
                <FaBriefcase className="mr-1 text-gray-500" />
                <span>{job.type}</span>
              </div>
              <div className="flex items-center">
                <FaDollarSign className="mr-1 text-gray-500" />
                <span>{job.salary}</span>
              </div>
              <div className="flex items-center">
                <FaClock className="mr-1 text-gray-500" />
                <span>Posted {job.posted}</span>
              </div>
            </div>

            <button
              onClick={handleApplyClick}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply Now
            </button>
          </div>

          {/* Job Details */}
          <div className="p-6">
            <div className="prose max-w-none">
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <p className="mb-6">{job.description}</p>

              <h3 className="text-lg font-semibold mb-3">Requirements</h3>
              <ul className="list-disc pl-5 mb-6 space-y-2">
                {job.requirements &&
                  job.requirements
                    .split(",")
                    .map((req, index) => <li key={index}>{req.trim()}</li>)}
              </ul>

              <h3 className="text-lg font-semibold mb-3">Responsibilities</h3>
              <ul className="list-disc pl-5 mb-6 space-y-2">
                {job.responsibilities &&
                  job.responsibilities
                    .split(",")
                    .map((resp, index) => <li key={index}>{resp.trim()}</li>)}
              </ul>

              <h3 className="text-lg font-semibold mb-3">Benefits</h3>
              <ul className="list-disc pl-5 space-y-2">
                {job.benefits &&
                  job.benefits
                    .split(",")
                    .map((benefit, index) => (
                      <li key={index}>{benefit.trim()}</li>
                    ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Application Modal */}
        {showApplicationModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Apply for {job.title}
                </h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitApplication} className="space-y-4">
                {/* User Information Display */}
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Applicant Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <p className="text-gray-900 font-medium">{user?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900 font-medium">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={applicationData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience *
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={applicationData.experience}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.experience ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g. 3 years of web development experience"
                  />
                  {errors.experience && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.experience}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education *
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={applicationData.education}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.education ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g. Bachelor's in Computer Science"
                  />
                  {errors.education && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.education}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills *
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={applicationData.skills}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.skills ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="e.g. React, JavaScript, CSS"
                  />
                  {errors.skills && (
                    <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    name="coverLetter"
                    value={applicationData.coverLetter}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.coverLetter ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Tell us why you're interested in this position..."
                  />
                  {errors.coverLetter && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.coverLetter}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.resume ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.resume && (
                    <p className="mt-1 text-sm text-red-600">{errors.resume}</p>
                  )}
                  {applicationData.resume && (
                    <p className="mt-1 text-sm text-gray-600">
                      Selected: {applicationData.resume.name}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;
