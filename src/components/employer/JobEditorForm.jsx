import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiSave,
  FiX,
  FiPlus,
  FiAlertCircle,
  FiCheckCircle,
  FiMail,
  FiPhone,
  FiCalendar,
  FiArrowLeft,
  FiRefreshCw,
} from "react-icons/fi";
import { jobService } from "../../services/jobService";
import useAuth from "../../hooks/useAuth";

const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Temporary",
];

const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Mid Level",
  "Senior Level",
  "Lead",
  "Manager",
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active (Accepting Applications)" },
  { value: "Published", label: "Published (Publicly Visible)" },
  { value: "Draft", label: "Draft (Saved Privately)" },
  { value: "Closed", label: "Closed (Applications Stopped)" },
];

const JobEditorForm = ({ initialData = null, isEdit = false, jobId = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    experience: "Mid Level",
    salary: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    applicationDeadline: "",
    contactEmail: "",
    contactPhone: "",
    status: "active",
  });

  const [skillsList, setSkillsList] = useState([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Populate form if initialData exists or pre-fill from user profile
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        company: initialData.company || user?.company || "",
        location: initialData.location || "",
        type: initialData.type || "Full-time",
        experience: initialData.experience || "Mid Level",
        salary: initialData.salary || "",
        description: initialData.description || "",
        requirements: initialData.requirements || "",
        responsibilities: initialData.responsibilities || "",
        benefits: initialData.benefits || "",
        applicationDeadline: initialData.applicationDeadline
          ? initialData.applicationDeadline.split("T")[0]
          : "",
        contactEmail: initialData.contactEmail || user?.email || "",
        contactPhone: initialData.contactPhone || "",
        status: initialData.status || "active",
      });

      if (initialData.skills) {
        if (Array.isArray(initialData.skills)) {
          setSkillsList(initialData.skills);
        } else if (typeof initialData.skills === "string") {
          setSkillsList(
            initialData.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          );
        }
      }
    } else if (user) {
      // New job pre-fill
      setFormData((prev) => ({
        ...prev,
        company: user.company || user.name || "",
        contactEmail: user.email || "",
      }));
    }
  }, [initialData, user]);

  const validateField = (name, value) => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Job title is required.";
        if (value.trim().length < 3) return "Title must be at least 3 characters.";
        if (value.trim().length > 100) return "Title cannot exceed 100 characters.";
        return null;
      case "company":
        if (!value.trim()) return "Company name is required.";
        if (value.trim().length < 2) return "Company name must be at least 2 characters.";
        if (value.trim().length > 100) return "Company cannot exceed 100 characters.";
        return null;
      case "location":
        if (!value.trim()) return "Location is required (e.g., 'San Francisco, CA' or 'Remote').";
        if (value.trim().length < 2) return "Location must be at least 2 characters.";
        return null;
      case "description":
        if (!value.trim()) return "Job description is required.";
        if (value.trim().length < 30)
          return `Description must be at least 30 characters (${value.trim().length}/30).`;
        if (value.trim().length > 5000) return "Description cannot exceed 5000 characters.";
        return null;
      case "requirements":
        if (!value.trim()) return "Job requirements are required.";
        if (value.trim().length < 20)
          return `Requirements must be at least 20 characters (${value.trim().length}/20).`;
        if (value.trim().length > 3000) return "Requirements cannot exceed 3000 characters.";
        return null;
      case "contactEmail":
        if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return "Please enter a valid email address.";
        }
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time error clearance
    if (errors[name]) {
      const errorMsg = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = currentSkill.trim();
    if (!trimmed) return;
    if (skillsList.length >= 15) {
      setErrors((prev) => ({ ...prev, skills: "Maximum 15 skills allowed." }));
      return;
    }
    if (skillsList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setCurrentSkill("");
      return;
    }
    setSkillsList([...skillsList, trimmed]);
    setCurrentSkill("");
    setErrors((prev) => ({ ...prev, skills: null }));
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSubmit = async (overrideStatus) => {
    const currentStatus = overrideStatus || formData.status;

    // Full form validation
    const newErrors = {};
    const titleErr = validateField("title", formData.title);
    if (titleErr) newErrors.title = titleErr;
    const compErr = validateField("company", formData.company);
    if (compErr) newErrors.company = compErr;
    const locErr = validateField("location", formData.location);
    if (locErr) newErrors.location = locErr;
    const descErr = validateField("description", formData.description);
    if (descErr) newErrors.description = descErr;
    const reqErr = validateField("requirements", formData.requirements);
    if (reqErr) newErrors.requirements = reqErr;
    const emailErr = validateField("contactEmail", formData.contactEmail);
    if (emailErr) newErrors.contactEmail = emailErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError("Please correct the highlighted fields before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      title: formData.title.trim(),
      company: formData.company.trim(),
      location: formData.location.trim(),
      type: formData.type,
      experience: formData.experience,
      salary: formData.salary.trim() || null,
      description: formData.description.trim(),
      requirements: formData.requirements.trim(),
      responsibilities: formData.responsibilities.trim() || null,
      benefits: formData.benefits.trim() || null,
      applicationDeadline: formData.applicationDeadline || null,
      contactEmail: formData.contactEmail.trim() || null,
      contactPhone: formData.contactPhone.trim() || null,
      skills: skillsList.join(", "),
      status: currentStatus,
    };

    try {
      let response;
      if (isEdit && jobId) {
        response = await jobService.updateJob(jobId, payload);
      } else {
        response = await jobService.createJob(payload);
      }

      if (response && response.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          navigate("/employer/jobs");
        }, 1200);
      } else {
        throw new Error(response?.error || "Failed to save job posting.");
      }
    } catch (err) {
      console.error("Job save error:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred while saving the job posting.";
      setSubmitError(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner Notifications */}
      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center space-x-3 animate-in fade-in">
          <FiCheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-semibold">
            {isEdit
              ? "Job posting updated successfully! Redirecting to Manage Jobs..."
              : "Job posted successfully! Redirecting to Manage Jobs..."}
          </p>
        </div>
      )}

      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center space-x-3 animate-in fade-in">
          <FiAlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
        className="space-y-6"
      >
        {/* Section 1: Core Job Details */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <FiBriefcase className="text-blue-600 dark:text-blue-400" />
              <span>Core Position Details</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Specify the primary role attributes that will appear in search results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Job Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                onBlur={handleBlur}
                maxLength={100}
                placeholder="e.g. Senior Full-Stack Engineer"
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                  errors.title
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-gray-300 dark:border-gray-700 focus:ring-blue-500"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.title ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">{errors.title}</p>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-gray-400">
                  {formData.title.length}/100
                </span>
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Hiring Organization / Company <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                onBlur={handleBlur}
                maxLength={100}
                placeholder="e.g. Acme Innovations"
                className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                  errors.company
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-gray-300 dark:border-gray-700 focus:ring-blue-500"
                }`}
              />
              {errors.company && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.company}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  maxLength={100}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                    errors.location
                      ? "border-rose-400 focus:ring-rose-500"
                      : "border-gray-300 dark:border-gray-700 focus:ring-blue-500"
                  }`}
                />
              </div>
              {errors.location && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.location}
                </p>
              )}
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Employment Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Experience Level <span className="text-rose-500">*</span>
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Compensation / Salary */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Salary or Compensation Range
              </label>
              <div className="relative">
                <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  maxLength={100}
                  placeholder="e.g. $120,000 - $150,000 USD"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Application Deadline */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Application Deadline
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Status Selector */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Job Posting Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: opt.value }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formData.status === opt.value
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-semibold ring-2 ring-blue-500/20"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-sm font-semibold block capitalize">{opt.value}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                      {opt.value === "active" || opt.value === "Published"
                        ? "Public & live"
                        : opt.value === "Draft"
                        ? "Internal only"
                        : "Archived"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Detailed Descriptions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <FiClock className="text-blue-600 dark:text-blue-400" />
              <span>Role Overview & Requirements</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Clear requirements and expectations attract the most qualified talent.
            </p>
          </div>

          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Job Overview & Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleInputChange}
                onBlur={handleBlur}
                maxLength={5000}
                placeholder="Provide a thorough overview of the role, company mission, team culture, and day-to-day impact..."
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors text-sm leading-relaxed ${
                  errors.description
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-gray-300 dark:border-gray-700 focus:ring-blue-500"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {errors.description}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-gray-400">
                  {formData.description.length}/5000 (min 30)
                </span>
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Qualifications & Requirements <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="requirements"
                rows={4}
                value={formData.requirements}
                onChange={handleInputChange}
                onBlur={handleBlur}
                maxLength={3000}
                placeholder="List required technical skills, minimum years of experience, relevant degrees or certifications..."
                className={`w-full px-4 py-3 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors text-sm leading-relaxed ${
                  errors.requirements
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-gray-300 dark:border-gray-700 focus:ring-blue-500"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.requirements ? (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {errors.requirements}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-gray-400">
                  {formData.requirements.length}/3000 (min 20)
                </span>
              </div>
            </div>

            {/* Key Responsibilities (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Key Responsibilities (Optional)
              </label>
              <textarea
                name="responsibilities"
                rows={3}
                value={formData.responsibilities}
                onChange={handleInputChange}
                maxLength={3000}
                placeholder="Core day-to-day duties, architectural leadership, code reviews, mentoring..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
              />
            </div>

            {/* Benefits & Perks (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Benefits & Perks (Optional)
              </label>
              <textarea
                name="benefits"
                rows={3}
                value={formData.benefits}
                onChange={handleInputChange}
                maxLength={2000}
                placeholder="Health insurance, 401(k) matching, flexible PTO, remote office stipend, education budget..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
              />
            </div>

            {/* Skills Tags Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Key Skills & Technologies (Up to 15)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={handleKeyDownSkill}
                  placeholder="e.g. React, TypeScript, PostgreSQL (press Enter to add)"
                  maxLength={30}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={!currentSkill.trim() || skillsList.length >= 15}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>

              {errors.skills && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.skills}
                </p>
              )}

              {/* Tag Badges */}
              {skillsList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200"
                        aria-label={`Remove ${skill}`}
                      >
                        <FiX className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Contact & Application Handling */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <FiMail className="text-blue-600 dark:text-blue-400" />
              <span>Contact & Notification Routing</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Specify where internal candidate notifications or direct inquiries should be sent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Contact / Notification Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="recruiting@company.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors text-sm ${
                    errors.contactEmail
                      ? "border-rose-400 focus:ring-rose-500"
                      : "border-gray-300 dark:border-gray-700 focus:ring-blue-500"
                  }`}
                />
              </div>
              {errors.contactEmail && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.contactEmail}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Contact Phone (Optional)
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 012-3456"
                  maxLength={30}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/employer/jobs")}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold text-sm transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Save as Draft */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("Draft")}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 font-semibold text-sm transition-colors shadow-xs disabled:opacity-50"
            >
              <FiSave className="w-4 h-4 text-gray-500" />
              <span>Save as Draft</span>
            </button>

            {/* Publish / Update Job */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isEdit ? "Updating..." : "Publishing..."}</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  <span>{isEdit ? "Update Job Posting" : "Publish Job Posting"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JobEditorForm;
