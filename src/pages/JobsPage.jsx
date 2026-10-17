import { useState, useEffect } from "react";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaBriefcase,
  FaBuilding,
  FaTimes,
  FaFilter,
} from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { useJobs } from "../context/JobContext";
import JobCard from "../components/jobs/JobCard";
import JobSkeleton from "../components/jobs/JobSkeleton";

const JobsPage = () => {
  const { getPublishedJobs, loading, error, fetchJobs } = useJobs();
  const publishedJobs = getPublishedJobs();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read state directly from URL query parameters (single source of truth)
  const search = searchParams.get("search") || searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "";
  const typeFilter = searchParams.get("type") || "";
  const experienceFilter = searchParams.get("experience") || "";
  const salaryFilter = searchParams.get("salary") || "";
  const skillsFilter = searchParams.get("skills") || "";

  // Draft inputs for search form
  const [searchInput, setSearchInput] = useState(search);
  const [locationInput, setLocationInput] = useState(location);
  const [skillsInput, setSkillsInput] = useState(skillsFilter);

  // Sync draft inputs when URL params change from external navigation
  useEffect(() => {
    setSearchInput(search);
    setLocationInput(location);
    setSkillsInput(skillsFilter);
  }, [search, location, skillsFilter]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set("search", searchInput.trim());
    else next.delete("search");
    if (locationInput.trim()) next.set("location", locationInput.trim());
    else next.delete("location");
    setSearchParams(next);
  };

  const handleSkillsSubmit = (e) => {
    e.preventDefault();
    updateParam("skills", skillsInput.trim());
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setLocationInput("");
    setSkillsInput("");
    setSearchParams(new URLSearchParams());
  };

  // Helper function to check salary range
  const checkSalaryRange = (jobSalary, filterSalary) => {
    if (!jobSalary || !filterSalary) return true;

    const jobSalaryMatch = jobSalary.match(/\$(\d+)k?/g);
    if (!jobSalaryMatch) return true;

    const jobMin =
      parseInt(jobSalaryMatch[0].replace(/\$|k/g, "")) *
      (jobSalaryMatch[0].includes("k") ? 1000 : 1);
    const jobMax =
      jobSalaryMatch.length > 1
        ? parseInt(jobSalaryMatch[1].replace(/\$|k/g, "")) *
          (jobSalaryMatch[1].includes("k") ? 1000 : 1)
        : jobMin;

    const filterMin = parseInt(filterSalary.split("-")[0]) * 1000;
    const filterMax = parseInt(filterSalary.split("-")[1]) * 1000;

    return jobMin >= filterMin && jobMax <= filterMax;
  };

  // Filter published jobs based on URL search criteria
  const filteredJobs = publishedJobs.filter((job) => {
    const matchesSearch =
      !search ||
      (job.title && job.title.toLowerCase().includes(search.toLowerCase())) ||
      (job.company && job.company.toLowerCase().includes(search.toLowerCase())) ||
      (job.requirements &&
        job.requirements.toLowerCase().includes(search.toLowerCase())) ||
      (job.skills &&
        job.skills.toLowerCase().includes(search.toLowerCase()));

    const matchesLocation =
      !location ||
      (job.location &&
        job.location.toLowerCase().includes(location.toLowerCase()));

    const matchesCategory =
      !category ||
      (job.title && job.title.toLowerCase().includes(category.toLowerCase())) ||
      (job.requirements &&
        job.requirements.toLowerCase().includes(category.toLowerCase())) ||
      (job.skills &&
        job.skills.toLowerCase().includes(category.toLowerCase()));

    const matchesType =
      !typeFilter ||
      (job.type && job.type.toLowerCase() === typeFilter.toLowerCase());

    const matchesExperience =
      !experienceFilter || job.experience === experienceFilter;

    const matchesSalary =
      !salaryFilter || checkSalaryRange(job.salary, salaryFilter);

    const matchesSkills =
      !skillsFilter ||
      (job.skills &&
        job.skills.toLowerCase().includes(skillsFilter.toLowerCase())) ||
      (job.requirements &&
        job.requirements.toLowerCase().includes(skillsFilter.toLowerCase()));

    return (
      matchesSearch &&
      matchesLocation &&
      matchesCategory &&
      matchesType &&
      matchesExperience &&
      matchesSalary &&
      matchesSkills
    );
  });

  const hasActiveFilters = Boolean(
    search ||
      location ||
      category ||
      typeFilter ||
      experienceFilter ||
      salaryFilter ||
      skillsFilter
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header & Search Section */}
      <section className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
              <FaBriefcase className="text-xs" />
              <span>
                {loading
                  ? "Loading positions..."
                  : `${filteredJobs.length} Job${
                      filteredJobs.length === 1 ? "" : "s"
                    } Available`}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Explore Active Career Opportunities
            </h1>
            <p className="text-base sm:text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Find and apply directly to roles with verified organizations.
            </p>

            {/* Search Form */}
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700 text-left"
            >
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700">
                  <FaSearch className="text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Job title, company, or keywords"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 border-none p-0 focus:ring-0"
                    aria-label="Search jobs"
                  />
                </div>

                <div className="flex-1 flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700">
                  <FaMapMarkerAlt className="text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Location or 'Remote'"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 border-none p-0 focus:ring-0"
                    aria-label="Location"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors whitespace-nowrap"
                >
                  Search Jobs
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Filter Controls Bar */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-1">
              <FaFilter className="mr-1.5 text-xs text-blue-600" />
              <span>Filters:</span>
            </div>

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => updateParam("type", e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Job Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
            </select>

            {/* Experience selector */}
            <select
              value={experienceFilter}
              onChange={(e) => updateParam("experience", e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Experience Levels</option>
              <option value="Entry Level">Entry Level</option>
              <option value="Mid Level">Mid Level</option>
              <option value="Senior Level">Senior Level</option>
              <option value="Lead">Lead</option>
              <option value="Manager">Manager</option>
            </select>

            {/* Salary selector */}
            <select
              value={salaryFilter}
              onChange={(e) => updateParam("salary", e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Salary Ranges</option>
              <option value="0-50">Under $50k</option>
              <option value="50-80">$50k - $80k</option>
              <option value="80-120">$80k - $120k</option>
              <option value="120-150">$120k - $150k</option>
              <option value="150-200">$150k - $200k</option>
              <option value="200-999">$200k+</option>
            </select>

            {/* Skills mini-form */}
            <form onSubmit={handleSkillsSubmit} className="flex items-center">
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Skill (e.g. React)"
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-l-lg text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32 sm:w-40"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-r-lg border border-blue-600"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <section className="bg-gray-100/70 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
              Active:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                Search: "{search}"
                <button
                  type="button"
                  onClick={() => updateParam("search", "")}
                  className="hover:opacity-75 focus:outline-none"
                  aria-label="Remove search filter"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            )}

            {location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                Location: "{location}"
                <button
                  type="button"
                  onClick={() => updateParam("location", "")}
                  className="hover:opacity-75 focus:outline-none"
                  aria-label="Remove location filter"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            )}

            {category && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                Category: {category}
                <button
                  type="button"
                  onClick={() => updateParam("category", "")}
                  className="hover:opacity-75 focus:outline-none"
                  aria-label="Remove category filter"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            )}

            {typeFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                Type: {typeFilter}
                <button
                  type="button"
                  onClick={() => updateParam("type", "")}
                  className="hover:opacity-75 focus:outline-none"
                  aria-label="Remove type filter"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            )}

            {experienceFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                Experience: {experienceFilter}
                <button
                  type="button"
                  onClick={() => updateParam("experience", "")}
                  className="hover:opacity-75 focus:outline-none"
                  aria-label="Remove experience filter"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            )}

            {salaryFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                Salary: {salaryFilter}
                <button
                  type="button"
                  onClick={() => updateParam("salary", "")}
                  className="hover:opacity-75 focus:outline-none"
                  aria-label="Remove salary filter"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            )}

            {skillsFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200">
                Skill: {skillsFilter}
                <button
                  type="button"
                  onClick={() => updateParam("skills", "")}
                  className="hover:opacity-75 focus:outline-none"
                  aria-label="Remove skill filter"
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 underline ml-2"
            >
              Reset all filters
            </button>
          </div>
        </section>
      )}

      {/* Job Listings Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <JobSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/50 p-8 max-w-md mx-auto shadow-sm">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
              <button
                type="button"
                onClick={fetchJobs}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm max-w-xl mx-auto p-8">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No matching jobs found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm">
                We couldn't find any positions matching your active filters. Try broadening your keywords or clearing constraints.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default JobsPage;
