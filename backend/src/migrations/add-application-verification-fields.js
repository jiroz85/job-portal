const { sequelize } = require("../config/database");

async function addApplicationVerificationFields() {
  try {
    console.log("Checking verification fields for applications table...");

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'applications';
    `);

    if (tables.length === 0) {
      console.log("ℹ️ Table 'applications' does not exist yet. Skipping column migration.");
      return;
    }

    // Retrieve existing columns on applications table
    const [existingColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'applications';
    `);

    const colNames = existingColumns.map((c) => c.COLUMN_NAME);

    const columnsToAdd = [
      {
        name: "isVerified",
        sql: "ALTER TABLE applications ADD COLUMN isVerified BOOLEAN DEFAULT FALSE COMMENT 'Whether the applicant has been verified as legitimate';",
      },
      {
        name: "verificationToken",
        sql: "ALTER TABLE applications ADD COLUMN verificationToken VARCHAR(255) NULL COMMENT 'Token for email verification';",
      },
      {
        name: "emailVerified",
        sql: "ALTER TABLE applications ADD COLUMN emailVerified BOOLEAN DEFAULT FALSE COMMENT 'Whether the applicant email has been verified';",
      },
      {
        name: "ipAddress",
        sql: "ALTER TABLE applications ADD COLUMN ipAddress VARCHAR(45) NULL COMMENT 'IP address of the applicant for fraud detection';",
      },
      {
        name: "userAgent",
        sql: "ALTER TABLE applications ADD COLUMN userAgent TEXT NULL COMMENT 'Browser user agent for application tracking';",
      },
      {
        name: "riskScore",
        sql: "ALTER TABLE applications ADD COLUMN riskScore INTEGER DEFAULT 0 COMMENT 'Risk assessment score (0-100, higher = more suspicious)';",
      },
      {
        name: "flagged",
        sql: "ALTER TABLE applications ADD COLUMN flagged BOOLEAN DEFAULT FALSE COMMENT 'Whether this application has been flagged as suspicious';",
      },
    ];

    for (const col of columnsToAdd) {
      if (!colNames.includes(col.name)) {
        await sequelize.query(col.sql);
        console.log(`✅ Column ${col.name} added to applications table`);
      } else {
        console.log(`ℹ️ Column ${col.name} already exists on applications table`);
      }
    }

    // Retrieve existing indexes
    const [existingIndexes] = await sequelize.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'applications';
    `);

    const indexNames = existingIndexes.map((i) => i.INDEX_NAME);

    const indexes = [
      {
        name: "idx_applications_isVerified",
        sql: "CREATE INDEX idx_applications_isVerified ON applications(isVerified);",
      },
      {
        name: "idx_applications_emailVerified",
        sql: "CREATE INDEX idx_applications_emailVerified ON applications(emailVerified);",
      },
      {
        name: "idx_applications_riskScore",
        sql: "CREATE INDEX idx_applications_riskScore ON applications(riskScore);",
      },
      {
        name: "idx_applications_flagged",
        sql: "CREATE INDEX idx_applications_flagged ON applications(flagged);",
      },
      {
        name: "idx_applications_verificationToken",
        sql: "CREATE INDEX idx_applications_verificationToken ON applications(verificationToken);",
      },
    ];

    for (const idx of indexes) {
      if (!indexNames.includes(idx.name)) {
        try {
          await sequelize.query(idx.sql);
          console.log(`✅ Created index: ${idx.name}`);
        } catch (idxErr) {
          console.warn(`Notice creating index ${idx.name}:`, idxErr.message);
        }
      } else {
        console.log(`ℹ️ Index ${idx.name} already exists`);
      }
    }

    console.log("✅ Verification fields and indexes checked successfully");
  } catch (error) {
    console.error("❌ Error adding verification fields:", error);
    throw error;
  }
}

module.exports = addApplicationVerificationFields;
