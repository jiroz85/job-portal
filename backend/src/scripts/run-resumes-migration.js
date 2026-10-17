require("dotenv").config();
const createResumesTable = require("../migrations/create-resumes-table");
const { sequelize } = require("../config/database");

async function runMigration() {
  try {
    console.log("🚀 Starting migration for resumes table...");
    await createResumesTable();
    console.log("✅ Migration completed successfully!");
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
