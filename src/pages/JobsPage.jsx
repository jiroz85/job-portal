import { useState, useMemo } from "react";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaBriefcase,
  FaTimes,
  FaFilter,
  FaSortAmountDown,
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

  // Draft inputs for search bar
  const [prevSearch, setPrevSearch] = useState(search);
  const [prevLocation, setPrevLocation] = useState(location);
  const [searchInput, setSearchInput] = useState(search);
  const [locationInput, setLocationInput] = useState(location);
  const [sortBy, setSortBy] = useState("newest");

  // Keep draft inputs synchronized with URL search params
  if (search !== prevSearch) {
    setPrevSearch(search);
    setSearchInput(search);
  }
  if (location !== prevLocation) {
    setPrevLocation(location);
    setLocationInput(location);
  }

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

  const clearAllFilters = () => {
    setSearchInput("");
    setLocationInput("");
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

  // Filter published jobs based on criteria
  const filteredJobs = useMemo(() => {
    return publishedJobs.filter((job) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !search ||
        (job.title && job.title.toLowerCase().includes(query)) ||
        (job.company && job.company.toLowerCase().includes(query)) ||
        (job.requirements && job.requirements.toLowerCase().includes(query)) ||
        (job.skills && job.skills.toLowerCase().includes(query));

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

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCategory &&
        matchesType &&
        matchesExperience &&
        matchesSalary
      );
    });
  }, [
    publishedJobs,
    search,
    location,
    category,
    typeFilter,
    experienceFilter,
    salaryFilter,
  ]);

  // Sort filtered jobs
  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs];
    if (sortBy === "salary-desc") {
      const getSalaryNum = (s) => {
        if (!s) return 0;
        const matches = s.match(/\$(\d+)/g);
        if (!matches) return 0;
        return (
          parseInt(matches[matches.length - 1].replace(/\$/g, "")) *
          (s.includes("k") ? 1000 : 1)
        );
      };
      return list.sort((a, b) => getSalaryNum(b.salary) - getSalaryNum(a.salary));
    }
    if (sortBy === "title-asc") {
      return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    // Default newest
    return list.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.posted || 0).getTime();
      const dateB = new Date(b.createdAt || b.posted || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredJobs, sortBy]);

  const hasActiveFilters = Boolean(
    search ||
      location ||
      category ||
      typeFilter ||
      experienceFilter ||
      salaryFilter
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Sleek Hero & Unified Search Header */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-400/30 text-blue-300 mb-4">
            <FaBriefcase className="text-xs text-blue-400" />
            <span>
              {loading
                ? "Connecting to database..."
                : `${sortedJobs.length} Verified Position${
                    sortedJobs.length === 1 ? "" : "s"
                  } Available`}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
            Find Your Next Opportunity
          </h1>
          <p className="text-sm sm:text-base text-gray-300 mb-8 max-w-xl mx-auto">
            Explore verified roles from trusted employers with real-time application tracking.
          </p>

          {/* Unified Floating Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white dark:bg-gray-800 p-2 sm:p-2.5 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700 max-w-4xl mx-auto"
          >
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 transition-colors">
                <FaSearch className="text-gray-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Job title, skills, or company"
                  className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 border-none p-0 focus:ring-0"
                />
              </div>

              <div className="flex-1 flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 transition-colors">
                <FaMapMarkerAlt className="text-gray-400 mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="City, state, or 'Remote'"
                  className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 border-none p-0 focus:ring-0"
                />
              </div>

              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <FaSearch className="text-xs" />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Filter Toolbar */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-1">
                <FaFilter className="mr-1.5 text-blue-600 text-xs" />
                <span>Filters</span>
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => updateParam("type", e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>

              {/* Experience Filter */}
              <select
                value={experienceFilter}
                onChange={(e) => updateParam("experience", e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Experience</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior Level">Senior Level</option>
                <option value="Lead">Lead</option>
                <option value="Manager">Manager</option>
              </select>

              {/* Salary Filter */}
              <select
                value={salaryFilter}
                onChange={(e) => updateParam("salary", e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">All Salary Ranges</option>
                <option value="0-50">Under $50k</option>
                <option value="50-80">$50k - $80k</option>
                <option value="80-120">$80k - $120k</option>
                <option value="120-150">$120k - $150k</option>
                <option value="150-200">$150k - $200k</option>
                <option value="200-999">$200k+</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <FaSortAmountDown className="text-gray-400 text-xs" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="salary-desc">Highest Salary</option>
                <option value="title-asc">Role Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <section className="bg-gray-100/70 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 py-2.5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center gap-2">
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
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 underline ml-2"
            >
              Reset all filters
            </button>
          </div>
        </section>
      )}

      {/* Main Job Cards Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {loading ? (
              "Loading open positions..."
            ) : (
              <span>
                Showing{" "}
                <strong className="text-gray-900 dark:text-white">
                  {sortedJobs.length}
                </strong>{" "}
                position{sortedJobs.length === 1 ? "" : "s"}
              </span>
            )}
          </p>
        </div>

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
        ) : sortedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedJobs.map((job) => (
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
              className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobsPage;
