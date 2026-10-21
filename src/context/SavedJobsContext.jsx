import React, { createContext, useContext, useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";

const SavedJobsContext = createContext();

export const useSavedJobs = () => {
  const context = useContext(SavedJobsContext);
  if (!context) {
    throw new Error("useSavedJobs must be used within a SavedJobsProvider");
  }
  return context;
};

export const SavedJobsProvider = ({ children }) => {
  const { user } = useAuth();
  const jobsStorageKey = user?.id ? `savedJobs_user_${user.id}` : "savedJobs_guest";
  const companiesStorageKey = user?.id ? `savedCompanies_user_${user.id}` : "savedCompanies_guest";

  const [savedJobs, setSavedJobs] = useState([]);
  const [savedCompanies, setSavedCompanies] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user-scoped saved jobs and companies whenever authenticated user changes
  useEffect(() => {
    try {
      const storedJobs = localStorage.getItem(jobsStorageKey);
      if (storedJobs) {
        setSavedJobs(JSON.parse(storedJobs));
      } else {
        // Fallback migration for existing data
        const legacyJobs = localStorage.getItem("savedJobs");
        if (legacyJobs && user?.id) {
          try {
            const parsed = JSON.parse(legacyJobs);
            setSavedJobs(parsed);
            localStorage.setItem(jobsStorageKey, legacyJobs);
          } catch {
            setSavedJobs([]);
          }
        } else {
          setSavedJobs([]);
        }
      }

      const storedCompanies = localStorage.getItem(companiesStorageKey);
      if (storedCompanies) {
        setSavedCompanies(JSON.parse(storedCompanies));
      } else {
        const legacyCompanies = localStorage.getItem("savedCompanies");
        if (legacyCompanies && user?.id) {
          try {
            const parsed = JSON.parse(legacyCompanies);
            setSavedCompanies(parsed);
            localStorage.setItem(companiesStorageKey, legacyCompanies);
          } catch {
            setSavedCompanies([]);
          }
        } else {
          setSavedCompanies([]);
        }
      }
    } catch (e) {
      console.error("Failed to load saved items from localStorage:", e);
      setSavedJobs([]);
      setSavedCompanies([]);
    } finally {
      setIsInitialized(true);
    }
  }, [jobsStorageKey, companiesStorageKey, user?.id]);

  // Persist saved jobs when state changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(jobsStorageKey, JSON.stringify(savedJobs));
    } catch (e) {
      console.error("Failed to persist saved jobs:", e);
    }
  }, [savedJobs, jobsStorageKey, isInitialized]);

  // Persist saved companies when state changes (after initialization)
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(companiesStorageKey, JSON.stringify(savedCompanies));
    } catch (e) {
      console.error("Failed to persist saved companies:", e);
    }
  }, [savedCompanies, companiesStorageKey, isInitialized]);

  // Save a job
  const saveJob = (job) => {
    if (!job || !job.id) return false;
    const isAlreadySaved = savedJobs.some((savedJob) => savedJob.id === job.id);
    if (!isAlreadySaved) {
      setSavedJobs((prev) => [
        ...prev,
        { ...job, savedAt: new Date().toISOString() },
      ]);
      return true;
    }
    return false;
  };

  // Unsave a job
  const unsaveJob = (jobId) => {
    if (!jobId) return;
    setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  // Check if job is saved
  const isJobSaved = (jobId) => {
    if (!jobId) return false;
    return savedJobs.some((job) => job.id === jobId);
  };

  // Save a company
  const saveCompany = (company) => {
    if (!company || !company.name) return false;
    const isAlreadySaved = savedCompanies.some(
      (savedCompany) => savedCompany.name === company.name
    );
    if (!isAlreadySaved) {
      setSavedCompanies((prev) => [
        ...prev,
        { ...company, savedAt: new Date().toISOString() },
      ]);
      return true;
    }
    return false;
  };

  // Unsave a company
  const unsaveCompany = (companyName) => {
    if (!companyName) return;
    setSavedCompanies((prev) =>
      prev.filter((company) => company.name !== companyName)
    );
  };

  // Check if company is saved
  const isCompanySaved = (companyName) => {
    if (!companyName) return false;
    return savedCompanies.some((company) => company.name === companyName);
  };

  // Get saved jobs count
  const getSavedJobsCount = () => savedJobs.length;

  // Get saved companies count
  const getSavedCompaniesCount = () => savedCompanies.length;

  // Get recently saved jobs (last 7 days)
  const getRecentlySavedJobs = () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return savedJobs
      .filter((job) => new Date(job.savedAt) > sevenDaysAgo)
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  };

  // Get saved jobs by category/type
  const getSavedJobsByType = (type) => {
    return savedJobs.filter((job) => job.type === type);
  };

  // Clear all saved jobs
  const clearAllSavedJobs = () => {
    setSavedJobs([]);
  };

  // Clear all saved companies
  const clearAllSavedCompanies = () => {
    setSavedCompanies([]);
  };

  const value = {
    savedJobs,
    savedCompanies,
    saveJob,
    unsaveJob,
    isJobSaved,
    saveCompany,
    unsaveCompany,
    isCompanySaved,
    getSavedJobsCount,
    getSavedCompaniesCount,
    getRecentlySavedJobs,
    getSavedJobsByType,
    clearAllSavedJobs,
    clearAllSavedCompanies,
  };

  return (
    <SavedJobsContext.Provider value={value}>
      {children}
    </SavedJobsContext.Provider>
  );
};

export default SavedJobsContext;
