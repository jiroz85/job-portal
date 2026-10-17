/**
 * run-all-migrations.js
 * Safe, idempotent migration runner for production and local environments.
 * Runs all database migrations sequentially without dropping tables or altering existing data.
 */

require("dotenv").config();
const { sequelize } = require("../config/database");
const addApplicationVerificationFields = require("../migrations/add-application-verification-fields");
const addJobEmployerOwnership = require("../migrations/add-job-employer-ownership");
const createResumesTable = require("../migrations/create-resumes-table");

async function runAllMigrations() {
  console.log("==================================================");
  console.log("📦 Starting Database Migrations (Idempotent)");
  console.log("==================================================\n");

  try {
    // Verify connection first
    await sequelize.authenticate();
    console.log("✅ Database connection established.\n");

    // 1. Application verification fields
    console.log("Step 1/3: Running verification fields migration...");
    await addApplicationVerificationFields();
    console.log("  ↳ Verification fields completed.\n");

    // 2. Job employer ownership
    console.log("Step 2/3: Running job employer ownership migration...");
    await addJobEmployerOwnership();
    console.log("  ↳ Job ownership completed.\n");

    // 3. Resumes table
    console.log("Step 3/3: Running resumes table migration...");
    await createResumesTable();
    console.log("  ↳ Resumes table completed.\n");

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
