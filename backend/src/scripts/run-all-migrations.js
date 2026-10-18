/**
 * run-all-migrations.js
 * Safe, idempotent migration runner for production and local environments.
 * Runs all database migrations sequentially without dropping tables or altering existing data.
 */

require("dotenv").config();
const { sequelize } = require("../config/database");
const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Audit = require("../models/Audit");
const Resume = require("../models/Resume");
const Setting = require("../models/Setting");
const Notification = require("../models/Notification");
const addApplicationVerificationFields = require("../migrations/add-application-verification-fields");
const addJobEmployerOwnership = require("../migrations/add-job-employer-ownership");
const createResumesTable = require("../migrations/create-resumes-table");
const createSettingsAndNotificationsTables = require("../migrations/create-settings-and-notifications-tables");

// Setup associations
const setupAssociations = () => {
  User.associate({ Application, Audit, Job, Resume, Setting, Notification });
  Application.associate({ User, Job });
  Job.associate({ Application, User });
  Audit.associate({ User });
  Resume.associate({ User });
  Setting.associate({ User });
  Notification.associate({ User });
};

async function runAllMigrations() {
  console.log("==================================================");
  console.log("📦 Starting Database Migrations (Idempotent)");
  console.log("==================================================\n");

  try {
    // Verify connection first
    await sequelize.authenticate();
    console.log("✅ Database connection established.\n");

    // Ensure base tables exist
    console.log("Step 0/4: Synchronizing base models...");
    setupAssociations();
    await sequelize.sync();
    console.log("  ↳ Base tables created or verified.\n");

    // 1. Application verification fields
    console.log("Step 1/4: Running verification fields migration...");
    await addApplicationVerificationFields();
    console.log("  ↳ Verification fields completed.\n");

    // 2. Job employer ownership
    console.log("Step 2/4: Running job employer ownership migration...");
    await addJobEmployerOwnership();
    console.log("  ↳ Job ownership completed.\n");

    // 3. Resumes table
    console.log("Step 3/4: Running resumes table migration...");
    await createResumesTable();
    console.log("  ↳ Resumes table completed.\n");

    // 4. System settings & notifications tables and audit ENUM
    console.log("Step 4/4: Running system settings & notifications migration...");
    await createSettingsAndNotificationsTables();
    console.log("  ↳ System settings & notifications completed.\n");

    // 5. Admin Account Verification (Non-destructive: preserves all existing accounts)
    const adminUser = await User.findOne({ where: { role: "admin" } });
    if (adminUser) {
      console.log(`Step 5/5: Primary admin account verified (${adminUser.email}). Existing accounts preserved.\n`);
    } else if (process.env.ADMIN_EMAIL) {
      // Only bootstrap admin if explicitly configured via environment variable
      const bcrypt = require("bcryptjs");
      const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
      const adminRawPassword = process.env.ADMIN_PASSWORD || "password123";
      const adminName = process.env.ADMIN_NAME || "System Administrator";

      const existingUser = await User.findOne({ where: { email: adminEmail } });
      if (existingUser) {
        await existingUser.update({ role: "admin", status: "active" });
        console.log(`  ↳ User '${adminEmail}' assigned Admin role.\n`);
      } else {
        const adminPass = await bcrypt.hash(adminRawPassword, 10);
        await User.create({
          name: adminName,
          email: adminEmail,
          password: adminPass,
          role: "admin",
          status: "active",
        });
        console.log(`  ↳ Admin created from ADMIN_EMAIL: '${adminEmail}'.\n`);
      }
    } else {
      console.log("Step 5/5: No admin user configured via environment.\n");
    }

    console.log("==================================================");
    console.log("🎉 All migrations completed successfully!");
    console.log("==================================================");

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
    try {
      await sequelize.close();
    } catch (closeErr) {}
    process.exit(1);
  }
}

runAllMigrations();
