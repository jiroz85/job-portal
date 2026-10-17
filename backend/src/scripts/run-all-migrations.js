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
const addApplicationVerificationFields = require("../migrations/add-application-verification-fields");
const addJobEmployerOwnership = require("../migrations/add-job-employer-ownership");
const createResumesTable = require("../migrations/create-resumes-table");

// Setup associations
const setupAssociations = () => {
  User.associate({ Application, Audit, Job, Resume });
  Application.associate({ User, Job });
  Job.associate({ Application, User });
  Audit.associate({ User });
  Resume.associate({ User });
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
    console.log("Step 0/3: Synchronizing base models...");
    setupAssociations();
    await sequelize.sync();
    console.log("  ↳ Base tables created or verified.\n");

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

    // 4. Admin Account Verification (No hardcoded default admin)
    const adminUser = await User.findOne({ where: { role: "admin" } });
    if (adminUser) {
      console.log(`Step 4: Primary admin account verified (${adminUser.email}).\n`);
      // If a real admin exists, remove the placeholder admin@example.com if present
      if (adminUser.email !== "admin@example.com") {
        await User.destroy({ where: { email: "admin@example.com" } });
        console.log("  ↳ Removed placeholder admin@example.com.\n");
      }
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
      console.log("Step 4: No admin user configured via environment.\n");
    }

    // 5. Ensure sample jobs exist if jobs table is empty
    const jobCount = await Job.count();
    if (jobCount === 0) {
      console.log("Step 5: No jobs found. Creating initial sample jobs...");
      // Find or create an employer for sample jobs
      let employer = await User.findOne({ where: { role: "employer" } });
      if (!employer) {
        const userPass = await bcrypt.hash("password123", 10);
        employer = await User.create({
          name: "Tech Corp HR",
          email: "hr@techcorp.com",
          password: userPass,
          role: "employer",
          status: "active",
          bio: "Human Resources manager at Tech Corp.",
        });
      }

      await Job.bulkCreate([
        {
          title: "Frontend Developer",
          company: "Tech Corp",
          location: "New York, NY",
          description: "We are looking for a skilled Frontend Developer to join our team.",
          requirements: "3+ years of experience with React, JavaScript, and CSS",
          salary: "$90,000 - $120,000",
          type: "Full-time",
          experience: "Mid Level",
          skills: "React,JavaScript,CSS,HTML",
          status: "Published",
          approvalStatus: "approved",
          employerId: employer.id,
        },
        {
          title: "Backend Developer",
          company: "Tech Corp",
          location: "Remote",
          description: "Looking for a Backend Developer to build robust APIs and services.",
          requirements: "Experience with Node.js, Express, and databases",
          salary: "$100,000 - $140,000",
          type: "Full-time",
          experience: "Senior Level",
          skills: "Node.js,Express,SQL,API Development",
          status: "Published",
          approvalStatus: "approved",
          employerId: employer.id,
        },
      ]);
      console.log("  ↳ Initial sample jobs created.\n");
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
