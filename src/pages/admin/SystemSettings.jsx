import React, { useState, useEffect } from "react";
import {
  FiSettings,
  FiMail,
  FiLock,
  FiCreditCard,
  FiStar,
  FiBell,
  FiSave,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";
import settingService from "../../services/settingService";

const DEFAULT_SETTINGS = {
  general: {
    siteName: "Job Portal",
    siteDescription: "Find your dream job today",
    contactEmail: "admin@jobportal.com",
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  },
  email: {
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUser: "noreply@jobportal.com",
    smtpPassword: "••••••••••",
    emailFromName: "Job Portal Team",
    emailFromAddress: "noreply@jobportal.com",
    enableEmailNotifications: true,
  },
  security: {
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableTwoFactorAuth: false,
  },
  subscriptions: {
    freePlan: {
      name: "Free",
      price: 0,
      jobPostings: 5,
      featuredJobs: 0,
      resumeViews: 50,
      duration: "30 days",
    },
    basicPlan: {
      name: "Basic",
      price: 29,
      jobPostings: 25,
      featuredJobs: 2,
      resumeViews: 500,
      duration: "30 days",
    },
    premiumPlan: {
      name: "Premium",
      price: 79,
      jobPostings: 100,
      featuredJobs: 10,
      resumeViews: 2000,
      duration: "30 days",
    },
    enterprisePlan: {
      name: "Enterprise",
      price: 199,
      jobPostings: "Unlimited",
      featuredJobs: 25,
      resumeViews: "Unlimited",
      duration: "30 days",
    },
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    newJobAlerts: true,
    applicationUpdates: true,
    systemAlerts: true,
    marketingEmails: false,
  },
  featuredJobs: {
    enableFeaturedJobs: true,
    maxFeaturedJobs: 50,
    featuredJobPrice: 25,
    featuredDuration: 7,
    autoRenewFeatured: false,
  },
};

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [showPasswords, setShowPasswords] = useState({
    smtp: false,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await settingService.getSettings();
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err.response?.data?.error || "Failed to load system settings from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingChange = (category, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await settingService.updateSettings(settings);
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));
        setSuccessMessage("Settings successfully saved to database.");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(err.response?.data?.error || "Failed to save settings to server.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async (category) => {
    if (
      !window.confirm(
        `Are you sure you want to reset "${category}" settings to system defaults? Any unsaved changes in this category will be overwritten.`
      )
    ) {
      return;
    }

    try {
      setResetting(true);
      setError(null);
      setSuccessMessage(null);

      const res = await settingService.resetSettings(category);
      if (res.success && res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));
        setSuccessMessage(`"${category}" settings reset to default.`);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error(`Failed to reset ${category} settings:`, err);
      setError(err.response?.data?.error || `Failed to reset ${category} settings.`);
    } finally {
      setResetting(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: FiSettings },
    { id: "email", label: "Email", icon: FiMail },
    { id: "security", label: "Security", icon: FiLock },
    { id: "subscriptions", label: "Subscriptions", icon: FiCreditCard },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "featured", label: "Featured Jobs", icon: FiStar },
  ];

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading system settings from database...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">System Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure system-wide settings, authentication rules, and notification policies.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading || saving}
          className="inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs"
        >
          <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Reload
        </button>
      </div>

      {/* Security notice */}
      <div className="flex items-start p-4 text-xs sm:text-sm rounded-lg border bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900">
        <FiShield className="w-5 h-5 mr-3 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <span className="font-semibold">Security & Audit Isolation:</span> Core system secrets (JWT keys, database passwords) are strictly managed via protected environment variables and cannot be exposed or overridden via UI. All settings changes are immutably logged to the administrative audit trail.
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start text-sm text-red-700 dark:text-red-300">
          <FiAlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1">
            <span className="font-semibold">Error:</span> {error}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 flex items-start text-sm text-green-700 dark:text-green-300">
          <FiCheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-green-500" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                    isActive
                      ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Site Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={settings.general.siteName || ""}
                    onChange={(e) => handleSettingChange("general", "siteName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={settings.general.contactEmail || ""}
                    onChange={(e) => handleSettingChange("general", "contactEmail", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Site Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={settings.general.siteDescription || ""}
                  onChange={(e) => handleSettingChange("general", "siteDescription", e.target.value)}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.general.maintenanceMode)}
                    onChange={(e) => handleSettingChange("general", "maintenanceMode", e.target.checked)}
                  />
                  <label htmlFor="maintenanceMode" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Maintenance Mode (displays temporary maintenance alert for regular users)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowRegistration"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.general.allowRegistration)}
                    onChange={(e) => handleSettingChange("general", "allowRegistration", e.target.checked)}
                  />
                  <label htmlFor="allowRegistration" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Allow New User Registration
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireEmailVerification"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.general.requireEmailVerification)}
                    onChange={(e) => handleSettingChange("general", "requireEmailVerification", e.target.checked)}
                  />
                  <label htmlFor="requireEmailVerification" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Require Email Verification Before Application
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === "email" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={settings.email.smtpHost || ""}
                    onChange={(e) => handleSettingChange("email", "smtpHost", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={settings.email.smtpPort || 587}
                    onChange={(e) => handleSettingChange("email", "smtpPort", parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={settings.email.smtpUser || ""}
                    onChange={(e) => handleSettingChange("email", "smtpUser", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    SMTP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.smtp ? "text" : "password"}
                      className="w-full px-3.5 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={settings.email.smtpPassword || ""}
                      onChange={(e) => handleSettingChange("email", "smtpPassword", e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={() => setShowPasswords((prev) => ({ ...prev, smtp: !prev.smtp }))}
                    >
                      {showPasswords.smtp ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Password is masked for security. Leave as &quot;••••••••••&quot; to retain current credentials.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    From Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={settings.email.emailFromName || ""}
                    onChange={(e) => handleSettingChange("email", "emailFromName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    From Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={settings.email.emailFromAddress || ""}
                    onChange={(e) => handleSettingChange("email", "emailFromAddress", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="enableEmailNotifications"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                  checked={Boolean(settings.email.enableEmailNotifications)}
                  onChange={(e) => handleSettingChange("email", "enableEmailNotifications", e.target.checked)}
                />
                <label htmlFor="enableEmailNotifications" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                  Enable Outbound Email Notifications
                </label>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                  Password Complexity Requirements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Minimum Length (Characters)
                    </label>
                    <input
                      type="number"
                      min={6}
                      max={128}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={settings.security.passwordMinLength || 8}
                      onChange={(e) =>
                        handleSettingChange("security", "passwordMinLength", parseInt(e.target.value, 10) || 8)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reqUpper"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={Boolean(settings.security.passwordRequireUppercase)}
                      onChange={(e) => handleSettingChange("security", "passwordRequireUppercase", e.target.checked)}
                    />
                    <label htmlFor="reqUpper" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                      Require Uppercase Letters (A-Z)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reqLower"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={Boolean(settings.security.passwordRequireLowercase)}
                      onChange={(e) => handleSettingChange("security", "passwordRequireLowercase", e.target.checked)}
                    />
                    <label htmlFor="reqLower" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                      Require Lowercase Letters (a-z)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reqNum"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={Boolean(settings.security.passwordRequireNumbers)}
                      onChange={(e) => handleSettingChange("security", "passwordRequireNumbers", e.target.checked)}
                    />
                    <label htmlFor="reqNum" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                      Require Numeric Digits (0-9)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="reqSpec"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={Boolean(settings.security.passwordRequireSpecialChars)}
                      onChange={(e) => handleSettingChange("security", "passwordRequireSpecialChars", e.target.checked)}
                    />
                    <label htmlFor="reqSpec" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                      Require Special Characters (!@#$%^&*)
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                  Session & Authentication Safeguards
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Session Inactivity Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={1440}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={settings.security.sessionTimeout || 30}
                      onChange={(e) =>
                        handleSettingChange("security", "sessionTimeout", parseInt(e.target.value, 10) || 30)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Max Failed Login Attempts Before Rate Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={settings.security.maxLoginAttempts || 5}
                      onChange={(e) =>
                        handleSettingChange("security", "maxLoginAttempts", parseInt(e.target.value, 10) || 5)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center pt-4">
                  <input
                    type="checkbox"
                    id="enableTwoFactorAuth"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.security.enableTwoFactorAuth)}
                    onChange={(e) => handleSettingChange("security", "enableTwoFactorAuth", e.target.checked)}
                  />
                  <label htmlFor="enableTwoFactorAuth" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Enable Two-Factor Authentication (2FA) Requirement
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                  Subscription Plans Configuration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(settings.subscriptions || {}).map(([key, plan]) => (
                    <div
                      key={key}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50/50 dark:bg-gray-700/30 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-center mb-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                            {plan.name}
                          </span>
                          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-3">
                            ${plan.price}
                            <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/mo</span>
                          </div>
                        </div>

                        <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                          <li className="flex items-center">
                            <FiStar className="h-3.5 w-3.5 text-yellow-500 mr-2 flex-shrink-0" />
                            {plan.jobPostings} job postings
                          </li>
                          <li className="flex items-center">
                            <FiStar className="h-3.5 w-3.5 text-amber-500 mr-2 flex-shrink-0" />
                            {plan.featuredJobs} featured jobs
                          </li>
                          <li className="flex items-center">
                            <FiEye className="h-3.5 w-3.5 text-blue-500 mr-2 flex-shrink-0" />
                            {plan.resumeViews} resume views
                          </li>
                          <li className="text-gray-500 dark:text-gray-400 pt-1">
                            Duration: {plan.duration}
                          </li>
                        </ul>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Price ($)
                        </label>
                        <input
                          type="number"
                          min={0}
                          className="w-full px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          value={plan.price}
                          onChange={(e) => {
                            const newPrice = parseFloat(e.target.value) || 0;
                            setSettings((prev) => ({
                              ...prev,
                              subscriptions: {
                                ...prev.subscriptions,
                                [key]: { ...plan, price: newPrice },
                              },
                            }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                Notification Delivery Channels & Alerts
              </h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotif"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.notifications.emailNotifications)}
                    onChange={(e) => handleSettingChange("notifications", "emailNotifications", e.target.checked)}
                  />
                  <label htmlFor="emailNotif" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Email Notification Dispatch
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pushNotif"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.notifications.pushNotifications)}
                    onChange={(e) => handleSettingChange("notifications", "pushNotifications", e.target.checked)}
                  />
                  <label htmlFor="pushNotif" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Web In-App Push Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smsNotif"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.notifications.smsNotifications)}
                    onChange={(e) => handleSettingChange("notifications", "smsNotifications", e.target.checked)}
                  />
                  <label htmlFor="smsNotif" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    SMS Urgent Alerts (Requires SMS gateway setup)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="jobAlerts"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.notifications.newJobAlerts)}
                    onChange={(e) => handleSettingChange("notifications", "newJobAlerts", e.target.checked)}
                  />
                  <label htmlFor="jobAlerts" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Candidate New Job Match Alerts
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="appUpdates"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.notifications.applicationUpdates)}
                    onChange={(e) => handleSettingChange("notifications", "applicationUpdates", e.target.checked)}
                  />
                  <label htmlFor="appUpdates" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Application Status Lifecycle Updates
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sysAlerts"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.notifications.systemAlerts)}
                    onChange={(e) => handleSettingChange("notifications", "systemAlerts", e.target.checked)}
                  />
                  <label htmlFor="sysAlerts" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Administrative System Alerts
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Featured Jobs Tab */}
          {activeTab === "featured" && (
            <div className="space-y-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                Featured Jobs Placement & Pricing
              </h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableFeatured"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.featuredJobs.enableFeaturedJobs)}
                    onChange={(e) => handleSettingChange("featuredJobs", "enableFeaturedJobs", e.target.checked)}
                  />
                  <label htmlFor="enableFeatured" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Enable Featured Jobs System
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Max Simultaneous Featured Jobs
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={settings.featuredJobs.maxFeaturedJobs || 50}
                      onChange={(e) =>
                        handleSettingChange("featuredJobs", "maxFeaturedJobs", parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Featured Placement Price ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={settings.featuredJobs.featuredJobPrice || 25}
                      onChange={(e) =>
                        handleSettingChange("featuredJobs", "featuredJobPrice", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Featured Duration (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      className="w-full px-3.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={settings.featuredJobs.featuredDuration || 7}
                      onChange={(e) =>
                        handleSettingChange("featuredJobs", "featuredDuration", parseInt(e.target.value, 10) || 7)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="autoRenewFeatured"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={Boolean(settings.featuredJobs.autoRenewFeatured)}
                    onChange={(e) => handleSettingChange("featuredJobs", "autoRenewFeatured", e.target.checked)}
                  />
                  <label htmlFor="autoRenewFeatured" className="ml-2.5 text-sm text-gray-700 dark:text-gray-300">
                    Auto-renew Featured Jobs Upon Expiry
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            disabled={saving || resetting}
            onClick={() => handleResetSettings(activeTab)}
            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs disabled:opacity-50"
          >
            {resetting ? "Resetting..." : `Reset "${activeTab}" to Default`}
          </button>

          <button
            type="button"
            disabled={saving || resetting}
            onClick={handleSaveSettings}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving to Database...
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
