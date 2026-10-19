import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaBriefcase,
  FaArrowRight,
  FaBuilding,
  FaShieldAlt,
  FaUserCheck,
  FaClock,
  FaLaptopCode,
  FaPaintBrush,
  FaChartLine,
  FaHandshake,
  FaMoneyBillWave,
  FaHospitalUser,
  FaHeadset,
  FaCogs,
  FaRedo,
  FaFilter,
  FaTimes,
  FaSortAmountDown,
} from "react-icons/fa";
import { useJobs } from "../context/JobContext";
import useAuth from "../hooks/useAuth";
import JobCard from "../components/jobs/JobCard";
import JobSkeleton from "../components/jobs/JobSkeleton";

const CATEGORIES_CONFIG = [
  {
    id: "software",
    name: "Software & Tech",
    slug: "Software",
    keywords: ["software", "developer", "engineer", "frontend", "backend", "fullstack", "react", "node", "python", "tech", "web"],
    icon: FaLaptopCode,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  },
  {
    id: "design",
    name: "Product & Design",
    slug: "Design",
    keywords: ["design", "ui", "ux", "product design", "figma", "graphic", "creative"],
    icon: FaPaintBrush,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400",
  },
  {
    id: "marketing",
    name: "Marketing & Growth",
    slug: "Marketing",
    keywords: ["marketing", "seo", "content", "growth", "social media", "brand", "digital"],
    icon: FaChartLine,
    color: "text-pink-600 bg-pink-50 dark:bg-pink-950/50 dark:text-pink-400",
  },
  {
    id: "sales",
    name: "Sales & Business",
    slug: "Sales",
    keywords: ["sales", "account", "business development", "b2b", "revenue"],
    icon: FaHandshake,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  {
    id: "finance",
    name: "Finance & Accounting",
    slug: "Finance",
    keywords: ["finance", "accounting", "auditor", "analyst", "financial", "tax"],
    icon: FaMoneyBillWave,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  },
  {
    id: "healthcare",
    name: "Healthcare & Science",
    slug: "Healthcare",
    keywords: ["health", "nurse", "medical", "doctor", "clinical", "hospital", "pharma"],
    icon: FaHospitalUser,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400",
  },
  {
    id: "support",
    name: "Customer Support",
    slug: "Support",
    keywords: ["support", "customer service", "help desk", "client success", "representative"],
    icon: FaHeadset,
    color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400",
  },
  {
    id: "operations",
    name: "Operations & HR",
    slug: "Operations",
    keywords: ["operation", "operations", "hr", "human resources", "recruiter", "logistics", "management"],
    icon: FaCogs,
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400",
  },
];

const QUICK_TAGS = [
  { label: "Remote", type: "type", value: "Remote" },
  { label: "Full-time", type: "type", value: "Full-time" },
  { label: "Engineering", type: "category", value: "Software" },
  { label: "Design", type: "category", value: "Design" },
  { label: "Marketing", type: "category", value: "Marketing" },
];

const HomePage = () => {
  const { getPublishedJobs, loading, error, fetchJobs } = useJobs();
  const { isAuthenticated, user } = useAuth();
  const locationState = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter criteria from searchParams
  const search = searchParams.get("search") || searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "";
  const typeFilter = searchParams.get("type") || "";
  const experienceFilter = searchParams.get("experience") || "";
  const salaryFilter = searchParams.get("salary") || "";

  // Hero search bar input state
  const [keywordInput, setKeywordInput] = useState(search);
  const [locationInput, setLocationInput] = useState(location);
  const [sortBy, setSortBy] = useState("newest");

  // Keep search bar inputs synced with URL search params
  useEffect(() => {
    setKeywordInput(search);
  }, [search]);

  useEffect(() => {
    setLocationInput(location);
  }, [location]);

  const publishedJobs = getPublishedJobs();

  const scrollToBrowseJobs = () => {
    const target =
      document.getElementById("browse-jobs") ||
      document.getElementById("featured-jobs");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Auto-scroll to browse jobs section if requested via hash
  useEffect(() => {
    const hash = locationState.hash || window.location.hash;
    if (
      hash === "#browse-jobs" ||
      hash === "#featured-jobs" ||
      hash === "#categories"
    ) {
      const targetId = hash === "#categories" ? "categories" : "browse-jobs";
      const target =
        document.getElementById(targetId) ||
        document.getElementById("featured-jobs");
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth" });
        }, 120);
      }
    }
  }, [locationState.hash]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (keywordInput.trim()) next.set("search", keywordInput.trim());
    else next.delete("search");

    if (locationInput.trim()) next.set("location", locationInput.trim());
    else next.delete("location");

    setSearchParams(next);
    scrollToBrowseJobs();
  };

  const handleQuickTagClick = (tag) => {
    const next = new URLSearchParams(searchParams);
    next.set(tag.type, tag.value);
    setSearchParams(next);
    scrollToBrowseJobs();
  };

  const handleCategoryClick = (categorySlug) => {
    const next = new URLSearchParams(searchParams);
    if (category === categorySlug) {
      next.delete("category");
    } else {
      next.set("category", categorySlug);
    }
    setSearchParams(next);
    scrollToBrowseJobs();
  };

  const clearAllFilters = () => {
    setKeywordInput("");
    setLocationInput("");
    setSearchParams(new URLSearchParams());
  };

  // Salary range parser
  const checkSalaryRange = (jobSalary, filterSalary) => {
    if (!jobSalary || !filterSalary) return true;

    if (filterSalary === "under-50k") {
      const match = jobSalary.match(/\$(\d+)k?/i);
      if (!match) return true;
      const num = parseInt(match[1]) * (match[0].toLowerCase().includes("k") ? 1000 : 1);
      return num < 50000;
    }
    if (filterSalary === "200k+") {
      const matches = jobSalary.match(/\$(\d+)k?/gi);
      if (!matches) return true;
      const last = matches[matches.length - 1];
      const num = parseInt(last.replace(/[$kK]/g, "")) * (last.toLowerCase().includes("k") ? 1000 : 1);
      return num >= 200000;
    }

    const jobSalaryMatch = jobSalary.match(/\$(\d+)k?/gi);
    if (!jobSalaryMatch) return true;

    const jobMin =
      parseInt(jobSalaryMatch[0].replace(/[$kK]/g, "")) *
      (jobSalaryMatch[0].toLowerCase().includes("k") ? 1000 : 1);
    const jobMax =
      jobSalaryMatch.length > 1
        ? parseInt(jobSalaryMatch[1].replace(/[$kK]/g, "")) *
          (jobSalaryMatch[1].toLowerCase().includes("k") ? 1000 : 1)
        : jobMin;

    const parts = filterSalary.split("-");
    if (parts.length === 2) {
      const filterMin = parseInt(parts[0]) * 1000;
      const filterMax = parseInt(parts[1]) * 1000;
      return jobMin >= filterMin && jobMax <= filterMax;
    }

    return true;
  };

  // Calculate real category counts from actual active jobs
  const getCategoryCount = (categoryKeywords) => {
    if (!publishedJobs || publishedJobs.length === 0) return 0;
    return publishedJobs.filter((job) => {
      const textToSearch = `${job.title || ""} ${job.requirements || ""} ${job.skills || ""} ${job.description || ""}`.toLowerCase();
      return categoryKeywords.some((kw) => textToSearch.includes(kw));
    }).length;
  };

  // Filter jobs based on active criteria
  const filteredJobs = useMemo(() => {
    return publishedJobs.filter((job) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !search ||
        (job.title && job.title.toLowerCase().includes(query)) ||
        (job.company && job.company.toLowerCase().includes(query)) ||
        (job.requirements && job.requirements.toLowerCase().includes(query)) ||
        (job.skills && job.skills.toLowerCase().includes(query)) ||
        (job.description && job.description.toLowerCase().includes(query));

      const matchesLocation =
        !location ||
        (job.location &&
          job.location.toLowerCase().includes(location.toLowerCase()));

      const matchesCategory =
        !category ||
        (job.category && job.category.toLowerCase().includes(category.toLowerCase())) ||
        (job.title && job.title.toLowerCase().includes(category.toLowerCase())) ||
        (job.requirements && job.requirements.toLowerCase().includes(category.toLowerCase())) ||
        (job.skills && job.skills.toLowerCase().includes(category.toLowerCase())) ||
        (job.description && job.description.toLowerCase().includes(category.toLowerCase()));

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
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-indigo-50/20 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-16 sm:py-24 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Live Availability Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100/80 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 mb-6 border border-blue-200/60 dark:border-blue-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {loading
                ? "Connecting to live job registry..."
                : publishedJobs.length > 0
                ? `${publishedJobs.length} verified position${publishedJobs.length === 1 ? "" : "s"} open right now`
                : "Real-time verified recruitment platform"}
            </div>

            {/* Primary Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.15] mb-6">
              Connect with Opportunities That{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Match Your Ambition
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
              Browse curated positions directly from verified employers. Apply seamlessly with your profile and track every stage in real time.
            </p>

            {/* Functional Search Bar */}
            <form
              onSubmit={handleHeroSearchSubmit}
              className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-200 dark:border-gray-700 max-w-3xl mx-auto"
            >
              <div className="flex flex-col md:flex-row gap-2">
                {/* Keywords input */}
                <div className="flex-1 flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <FaSearch className="text-gray-400 text-base mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Job title, skills, or company"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none p-0 focus:ring-0"
                    aria-label="Job title or keywords"
                  />
                </div>

                {/* Location input */}
                <div className="flex-1 flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <FaMapMarkerAlt className="text-gray-400 text-base mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Location or 'Remote'"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none p-0 focus:ring-0"
                    aria-label="Job location"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                >
                  <FaSearch className="mr-2 text-xs" />
                  Search Jobs
                </button>
              </div>

              {/* Quick Search Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 px-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium mr-1">Popular:</span>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* 2. UNIFIED BROWSE JOBS SECTION (Home + Browse on ONE page) */}
      <section
        id="browse-jobs"
        className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900/50 scroll-mt-20 border-b border-gray-200 dark:border-gray-800"
      >
        <div id="featured-jobs" className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
                <FaBriefcase className="text-xs" />
                <span>Current Opportunities</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                Featured & Recent Postings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Explore active roles from verified employers. Filter by type, experience, and salary right here.
              </p>
            </div>

            {/* Total count badge */}
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-900 dark:text-white">{sortedJobs.length}</span> of {publishedJobs.length} positions
            </div>
          </div>

          {/* Integrated Filter Toolbar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <FaFilter className="mr-1.5 text-blue-600 text-xs" />
                  <span>Filters:</span>
                </div>

                {/* Job Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => updateParam("type", e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label="Filter by Job Type"
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
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label="Filter by Experience Level"
                >
                  <option value="">All Experience Levels</option>
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
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label="Filter by Salary Range"
                >
                  <option value="">All Salary Ranges</option>
                  <option value="under-50k">Under $50k</option>
                  <option value="50-80">$50k - $80k</option>
                  <option value="80-120">$80k - $120k</option>
                  <option value="120-150">$120k - $150k</option>
                  <option value="150-200">$150k - $200k</option>
                  <option value="200k+">$200k+</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <FaSortAmountDown className="text-gray-400 text-xs" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  aria-label="Sort positions"
                >
                  <option value="newest">Newest First</option>
                  <option value="salary-desc">Highest Salary</option>
                  <option value="title-asc">Role Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Active filter badges row */}
            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Active filters:
                </span>

                {search && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Keyword: "{search}"
                    <button
                      type="button"
                      onClick={() => updateParam("search", "")}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {location && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Location: "{location}"
                    <button
                      type="button"
                      onClick={() => updateParam("location", "")}
                      className="hover:text-blue-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {category && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Category: {category}
                    <button
                      type="button"
                      onClick={() => updateParam("category", "")}
                      className="hover:text-indigo-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {typeFilter && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Type: {typeFilter}
                    <button
                      type="button"
                      onClick={() => updateParam("type", "")}
                      className="hover:text-emerald-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {experienceFilter && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Exp: {experienceFilter}
                    <button
                      type="button"
                      onClick={() => updateParam("experience", "")}
                      className="hover:text-purple-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                {salaryFilter && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Salary: {salaryFilter}
                    <button
                      type="button"
                      onClick={() => updateParam("salary", "")}
                      className="hover:text-amber-900 cursor-pointer"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline ml-2 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Jobs Listing Grid / Skeletons / Empty / Error State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <JobSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-red-200 dark:border-red-900/50 max-w-lg mx-auto shadow-sm">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
              <button
                type="button"
                onClick={fetchJobs}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              >
                <FaRedo className="text-xs" />
                <span>Retry loading jobs</span>
              </button>
            </div>
          ) : sortedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-xl mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
                <FaBriefcase className="text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {hasActiveFilters
                  ? "No positions match your selected filters"
                  : "No active job postings right now"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your search criteria, keywords, or clearing your active filters."
                  : "Be among the first employers to reach qualified candidates, or check back soon for fresh openings."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                ) : (
                  <Link
                    to={isAuthenticated && user?.role === "employer" ? "/employer/post-job" : "/register"}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
                  >
                    Post a Position
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. TARGETED DISCOVERY (Categories with real counts & interactive filter) */}
      <section id="categories" className="py-16 sm:py-20 bg-white dark:bg-gray-900 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Targeted Discovery
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              Explore Roles by Category
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Filter jobs matching your functional area of expertise with one click.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CATEGORIES_CONFIG.map((cat) => {
              const count = getCategoryCount(cat.keywords);
              const Icon = cat.icon;
              const isSelected = category.toLowerCase() === cat.slug.toLowerCase();

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`text-left group relative p-5 bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-500/30 shadow-md"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-500/50 hover:shadow-md"
                  }`}
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${cat.color}`}
                    >
                      <Icon className="text-xl" />
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                      {cat.name}
                    </h3>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {count > 0 ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {count} open role{count === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span>Explore category</span>
                      )}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs font-medium text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span>{isSelected ? "Filter applied" : "View positions"}</span>
                    <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. VALUE PROPOSITIONS & TRUST (Platform Pillars) */}
      <section className="py-12 bg-white dark:bg-gray-900 border-t border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                <FaShieldAlt className="text-lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  Verified Openings
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Direct postings from vetted hiring teams and organizations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                <FaUserCheck className="text-lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  Direct Application
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  No middleman redirections; submit your resume straight to recruiters.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 flex items-center justify-center flex-shrink-0">
                <FaClock className="text-lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  Real-Time Status
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Track when your resume is reviewed, shortlisted, or invited.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
                <FaBuilding className="text-lg" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  Dedicated Dashboards
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Tailored workspaces for candidates, hiring managers, and admins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Simple & Transparent
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
              How the Platform Works
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Designed to connect candidates and hiring managers with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* For Candidates */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
              <div className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 mb-4">
                For Job Seekers
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Fast-track your job search
              </h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Build Your Profile & Resume
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Create an account, upload your credentials, and maintain your primary resume in one secure hub.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Filter by Skills & Modality
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Search by remote preference, compensation range, and experience level with instant filter responses.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Apply Directly & Monitor Progress
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Submit applications with one click and track status updates through your candidate dashboard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={scrollToBrowseJobs}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                >
                  <span>Start browsing openings</span>
                  <FaArrowRight className="text-xs" />
                </button>
              </div>
            </div>

            {/* For Employers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
              <div className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 mb-4">
                For Employers & Recruiters
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Hire talent efficiently
              </h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Publish Vacancies
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Define responsibilities, salary ranges, and specific skill requirements using structured postings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Screen Qualified Applicants
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Access verified applicant profiles and inspect uploaded resumes within your employer portal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Manage Hiring Pipeline
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Shortlist top candidates, schedule interviews, and issue hiring decisions directly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <Link
                  to={isAuthenticated && user?.role === "employer" ? "/employer/post-job" : "/register"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  <span>Post your opening today</span>
                  <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to Take Your Next Career Step?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 mb-8 max-w-xl mx-auto">
            Whether you are seeking your next challenge or hiring qualified professionals, start today on JobPortal.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={scrollToBrowseJobs}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm shadow-lg transition-colors cursor-pointer"
            >
              Browse Open Positions
            </button>

            {isAuthenticated ? (
              <Link
                to={user?.role === "employer" ? "/employer/post-job" : user?.role === "admin" ? "/admin" : "/dashboard"}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white font-semibold text-sm border border-white/20 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white font-semibold text-sm border border-white/20 transition-colors"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
