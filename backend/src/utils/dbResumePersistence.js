/**
 * dbResumePersistence.js
 * 
 * Safely ensures that tables `resumes` and `applications` have the columns
 * required to store base64-encoded files directly in the database.
 * This guarantees resumes survive cloud container restarts, redeployments,
 * and ephemeral disk wipes.
 */

async function ensureResumePersistenceColumns(sequelize) {
  try {
    const queryInterface = sequelize.getQueryInterface();

    // 1. Check resumes table
    const resumesDesc = await queryInterface.describeTable("resumes").catch(() => null);
    if (resumesDesc && !resumesDesc.fileData) {
      console.log("Adding fileData column to resumes table...");
      await sequelize.query("ALTER TABLE resumes ADD COLUMN fileData LONGTEXT NULL;").catch((err) => {
        console.warn("Notice adding fileData to resumes:", err.message);
      });
    }

    // 2. Check applications table
    const appsDesc = await queryInterface.describeTable("applications").catch(() => null);
    if (appsDesc) {
      if (!appsDesc.fileData) {
        console.log("Adding fileData column to applications table...");
        await sequelize.query("ALTER TABLE applications ADD COLUMN fileData LONGTEXT NULL;").catch((err) => {
          console.warn("Notice adding fileData to applications:", err.message);
        });
      }
      if (!appsDesc.originalResumeName) {
        console.log("Adding originalResumeName column to applications table...");
        await sequelize.query("ALTER TABLE applications ADD COLUMN originalResumeName VARCHAR(255) NULL;").catch((err) => {
          console.warn("Notice adding originalResumeName to applications:", err.message);
        });
      }
      if (!appsDesc.mimeType) {
        console.log("Adding mimeType column to applications table...");
        await sequelize.query("ALTER TABLE applications ADD COLUMN mimeType VARCHAR(100) NULL;").catch((err) => {
          console.warn("Notice adding mimeType to applications:", err.message);
        });
      }
    }
  } catch (err) {
    console.warn("Could not check/add resume persistence columns:", err.message);
  }
}

module.exports = {
  ensureResumePersistenceColumns,
};
