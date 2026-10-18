const Setting = require("../models/Setting");
const Audit = require("../models/Audit");
const { sequelize } = require("../config/database");

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
    smtpPassword: "",
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

const FORBIDDEN_SECRET_KEYS = [
  "jwtsecret",
  "jwt_secret",
  "dbpassword",
  "db_password",
  "databaseurl",
  "database_url",
  "db_name",
  "process_env",
  "env",
  "secret_key",
  "session_secret",
];

const checkForForbiddenKeys = (obj) => {
  if (!obj || typeof obj !== "object") return null;
  for (const key of Object.keys(obj)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (FORBIDDEN_SECRET_KEYS.includes(normalizedKey)) {
      return key;
    }
    if (typeof obj[key] === "object" && obj[key] !== null) {
      const nested = checkForForbiddenKeys(obj[key]);
      if (nested) return nested;
    }
  }
  return null;
};

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "privatekey",
  "private_key",
];

// Deep, recursive masking of sensitive values before sending to client
const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pat) => lowerKey.includes(pat));

    if (isSensitive) {
      masked[key] = value ? "••••••••••" : "";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
};

// Mask sensitive passwords before sending to client
const maskCategorySettings = (category, data) => {
  if (!data) return data;
  return maskSensitiveData(data);
};

// @desc    Get all system settings
// @route   GET /api/settings
// @access  Private/Admin
exports.getSettings = async (req, res) => {
  try {
    const records = await Setting.findAll();
    const settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    records.forEach((record) => {
      if (settings[record.category] !== undefined && record.value) {
        settings[record.category] = {
          ...settings[record.category],
          ...record.value,
        };
      }
    });

    // Mask sensitive secrets like SMTP password
    const maskedSettings = {};
    for (const [cat, val] of Object.entries(settings)) {
      maskedSettings[cat] = maskCategorySettings(cat, val);
    }

    res.json({
      success: true,
      data: maskedSettings,
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    res.status(500).json({ success: false, error: "Failed to retrieve settings" });
  }
};

// @desc    Update system settings (single category or multi-category)
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Settings payload cannot be empty",
      });
    }

    // Security Check: Deny any forbidden secret injection
    const forbiddenKey = checkForForbiddenKeys(payload);
    if (forbiddenKey) {
      return res.status(400).json({
        success: false,
        error: `Setting "${forbiddenKey}" is protected and cannot be modified.`,
      });
    }

    // Validate categories
    const validCategories = Object.keys(DEFAULT_SETTINGS);
    const categoriesToUpdate = Object.keys(payload).filter((cat) =>
      validCategories.includes(cat)
    );

    if (categoriesToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        error: `No valid settings categories provided. Valid categories: ${validCategories.join(", ")}`,
      });
    }

    // Validate specific category fields
    if (payload.general) {
      if (payload.general.siteName !== undefined && typeof payload.general.siteName !== "string") {
        return res.status(400).json({ success: false, error: "siteName must be a string" });
      }
      if (payload.general.contactEmail !== undefined && typeof payload.general.contactEmail !== "string") {
        return res.status(400).json({ success: false, error: "contactEmail must be a valid email string" });
      }
    }

    if (payload.security) {
      if (payload.security.passwordMinLength !== undefined) {
        const minLen = parseInt(payload.security.passwordMinLength, 10);
        if (isNaN(minLen) || minLen < 6 || minLen > 128) {
          return res.status(400).json({ success: false, error: "passwordMinLength must be between 6 and 128" });
        }
      }
      if (payload.security.sessionTimeout !== undefined) {
        const timeout = parseInt(payload.security.sessionTimeout, 10);
        if (isNaN(timeout) || timeout < 1 || timeout > 1440) {
          return res.status(400).json({ success: false, error: "sessionTimeout must be between 1 and 1440 minutes" });
        }
      }
      if (payload.security.maxLoginAttempts !== undefined) {
        const attempts = parseInt(payload.security.maxLoginAttempts, 10);
        if (isNaN(attempts) || attempts < 1 || attempts > 50) {
          return res.status(400).json({ success: false, error: "maxLoginAttempts must be between 1 and 50" });
        }
      }
    }

    if (payload.email) {
      if (payload.email.smtpPort !== undefined) {
        const port = parseInt(payload.email.smtpPort, 10);
        if (isNaN(port) || port < 1 || port > 65535) {
          return res.status(400).json({ success: false, error: "smtpPort must be between 1 and 65535" });
        }
      }
    }

    await sequelize.transaction(async (t) => {
      for (const category of categoriesToUpdate) {
        const existingRecord = await Setting.findOne({
          where: { category },
          transaction: t,
        });

        let updatedCategoryData = {
          ...DEFAULT_SETTINGS[category],
          ...(existingRecord ? existingRecord.value : {}),
          ...payload[category],
        };

        // If updating email and password is unchanged mask ("••••••••••") or omitted, keep existing password
        if (category === "email") {
          const submittedPass = payload.email.smtpPassword;
          if (submittedPass === "••••••••••" || submittedPass === undefined) {
            if (existingRecord && existingRecord.value?.smtpPassword) {
              updatedCategoryData.smtpPassword = existingRecord.value.smtpPassword;
            } else {
              updatedCategoryData.smtpPassword = "";
            }
          }
        }

        if (existingRecord) {
          await existingRecord.update(
            {
              value: updatedCategoryData,
              updatedBy: req.user.id,
            },
            { transaction: t }
          );
        } else {
          await Setting.create(
            {
              category,
              value: updatedCategoryData,
              updatedBy: req.user.id,
            },
            { transaction: t }
          );
        }
      }

      // Record Audit trail
      await Audit.create(
        {
          action: "SETTING_UPDATE",
          performedBy: req.user.id,
          targetUserId: null,
          details: `Updated system settings categories: ${categoriesToUpdate.join(", ")}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
        },
        { transaction: t }
      );
    });

    // Re-fetch all settings to return updated, masked state
    const allRecords = await Setting.findAll();
    const finalSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    allRecords.forEach((rec) => {
      if (finalSettings[rec.category] !== undefined && rec.value) {
        finalSettings[rec.category] = {
          ...finalSettings[rec.category],
          ...rec.value,
        };
      }
    });

    const maskedFinal = {};
    for (const [cat, val] of Object.entries(finalSettings)) {
      maskedFinal[cat] = maskCategorySettings(cat, val);
    }

    res.json({
      success: true,
      message: "System settings saved successfully",
      data: maskedFinal,
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    res.status(500).json({ success: false, error: "Failed to update settings" });
  }
};

// @desc    Reset settings for a category or all categories to defaults
// @route   POST /api/settings/reset/:category?
// @access  Private/Admin
exports.resetSettings = async (req, res) => {
  try {
    const category = req.params.category || req.body?.category;
    const validCategories = Object.keys(DEFAULT_SETTINGS);

    if (category && category !== "all" && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category "${category}". Valid categories: ${validCategories.join(", ")}`,
      });
    }

    const categoriesToReset = !category || category === "all" ? validCategories : [category];

    await sequelize.transaction(async (t) => {
      for (const cat of categoriesToReset) {
        const existing = await Setting.findOne({ where: { category: cat }, transaction: t });
        let resetValue = { ...DEFAULT_SETTINGS[cat] };
        // Preserve existing configured credentials so reset does not destroy secrets unexpectedly
        if (cat === "email" && existing && existing.value?.smtpPassword) {
          resetValue.smtpPassword = existing.value.smtpPassword;
        }

        if (existing) {
          await existing.update(
            {
              value: resetValue,
              updatedBy: req.user.id,
            },
            { transaction: t }
          );
        } else {
          await Setting.create(
            {
              category: cat,
              value: resetValue,
              updatedBy: req.user.id,
            },
            { transaction: t }
          );
        }
      }

      await Audit.create(
        {
          action: "SETTING_UPDATE",
          performedBy: req.user.id,
          targetUserId: null,
          details: `Reset system settings to defaults for: ${categoriesToReset.join(", ")}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
        },
        { transaction: t }
      );
    });

    // Re-fetch all
    const allRecords = await Setting.findAll();
    const finalSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    allRecords.forEach((rec) => {
      if (finalSettings[rec.category] !== undefined && rec.value) {
        finalSettings[rec.category] = {
          ...finalSettings[rec.category],
          ...rec.value,
        };
      }
    });

    const maskedFinal = {};
    for (const [cat, val] of Object.entries(finalSettings)) {
      maskedFinal[cat] = maskCategorySettings(cat, val);
    }

    res.json({
      success: true,
      message: `Settings for ${categoriesToReset.join(", ")} reset to default successfully`,
      data: maskedFinal,
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    res.status(500).json({ success: false, error: "Failed to reset settings" });
  }
};
