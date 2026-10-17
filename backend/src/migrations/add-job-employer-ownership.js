const { sequelize } = require("../config/database");

async function addJobEmployerOwnership() {
  try {
    console.log("Adding employerId ownership column to jobs table...");

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'jobs';
    `);

    if (tables.length === 0) {
      console.log("ℹ️ Table 'jobs' does not exist yet. Skipping column migration.");
      return;
    }

    // Check if column already exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'jobs' 
        AND COLUMN_NAME = 'employerId';
    `);

    if (columns.length === 0) {
      // Add employerId column (nullable to preserve existing data safely)
      await sequelize.query(`
        ALTER TABLE jobs 
        ADD COLUMN employerId INT NULL COMMENT 'ID of the employer who created the job';
      `);
      console.log("✅ Column employerId added to jobs table");

      // Add index for performance
      try {
        await sequelize.query(`
          CREATE INDEX idx_jobs_employerId ON jobs(employerId);
        `);
        console.log("✅ Created index idx_jobs_employerId");
      } catch (idxError) {
        console.log("ℹ️ Index creation note:", idxError.message);
      }

      // Add foreign key constraint referencing users(id)
      try {
        await sequelize.query(`
          ALTER TABLE jobs 
          ADD CONSTRAINT fk_jobs_employer 
          FOREIGN KEY (employerId) REFERENCES users(id) 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
        `);
        console.log("✅ Foreign key fk_jobs_employer added successfully");
      } catch (fkError) {
        console.log("ℹ️ Foreign key constraint note:", fkError.message);
      }
    } else {
      console.log("ℹ️ Column employerId already exists on jobs table");
    }

    console.log("✅ Job ownership migration completed safely without data loss");
  } catch (error) {
    console.error("❌ Error adding job employer ownership:", error);
    throw error;
  }
}

module.exports = addJobEmployerOwnership;
