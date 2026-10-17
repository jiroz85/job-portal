require("dotenv").config();
const addJobEmployerOwnership = require("../migrations/add-job-employer-ownership");
const { sequelize } = require("../config/database");

async function runMigration() {
  try {
    console.log("🚀 Starting migration for job employer ownership...");
    await addJobEmployerOwnership();
    console.log("✅ Migration completed successfully!");
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
