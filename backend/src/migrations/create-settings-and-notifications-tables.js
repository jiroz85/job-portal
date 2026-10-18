const { sequelize } = require("../config/database");

async function createSettingsAndNotificationsTables() {
  try {
    console.log("Checking system_settings and notifications schema...");

    // 1. Ensure system_settings table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(64) NOT NULL UNIQUE,
        value LONGTEXT NOT NULL,
        updatedBy INT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        INDEX idx_settings_category (category),
        CONSTRAINT fk_settings_updatedBy FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("  ↳ system_settings table created or verified.");

    // 2. Ensure notifications table exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error', 'job_alert', 'application_status', 'system') NOT NULL DEFAULT 'info',
        priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
        isRead BOOLEAN NOT NULL DEFAULT FALSE,
        readAt DATETIME NULL,
        link VARCHAR(500) NULL,
        metadata TEXT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        INDEX idx_notifications_userId (userId),
        INDEX idx_notifications_userId_isRead (userId, isRead),
        INDEX idx_notifications_createdAt (createdAt),
        CONSTRAINT fk_notifications_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("  ↳ notifications table created or verified.");

    // 3. Ensure audit_logs action ENUM includes SETTING_UPDATE safely
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'audit_logs';
    `);

    if (tables.length > 0) {
      const [columns] = await sequelize.query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'audit_logs' 
          AND COLUMN_NAME = 'action';
      `);

      if (columns.length > 0) {
        const columnType = columns[0].COLUMN_TYPE || "";
        const matches = columnType.match(/'([^']+)'/g);
        const existingEnumValues = matches ? matches.map((m) => m.replace(/^'|'$/g, "")) : [];

        if (!existingEnumValues.includes("SETTING_UPDATE")) {
          console.log("  ↳ Preparing audit_logs action ENUM update...");

          // Merge existing values with SETTING_UPDATE without dropping any existing value
          const targetEnumValues = Array.from(new Set([...existingEnumValues, "SETTING_UPDATE"]));

          // Safety check: Verify no existing records have invalid or null action values
          const [invalidRows] = await sequelize.query(`
            SELECT COUNT(*) AS count 
            FROM audit_logs 
            WHERE action IS NULL 
               OR action NOT IN (${targetEnumValues.map((v) => `'${v}'`).join(", ")});
          `);

          const invalidCount = invalidRows[0]?.count || 0;
          if (invalidCount > 0) {
            throw new Error(
              `Cannot safely modify audit_logs action ENUM: found ${invalidCount} existing records with invalid or unrecognized actions. Migration aborted to prevent data corruption.`
            );
          }

          // Count rows before alteration to guarantee zero record loss
          const [preCountResult] = await sequelize.query(`SELECT COUNT(*) AS count FROM audit_logs;`);
          const preCount = preCountResult[0]?.count || 0;

          const enumDefinition = targetEnumValues.map((v) => `'${v}'`).join(", ");
          await sequelize.query(`
            ALTER TABLE audit_logs 
            MODIFY COLUMN action ENUM(${enumDefinition}) NOT NULL;
          `);

          // Verify row count after alteration
          const [postCountResult] = await sequelize.query(`SELECT COUNT(*) AS count FROM audit_logs;`);
          const postCount = postCountResult[0]?.count || 0;

          if (preCount !== postCount) {
            throw new Error(
              `CRITICAL INTEGRITY FAILURE: audit_logs record count changed from ${preCount} to ${postCount} during ENUM update.`
            );
          }

          console.log("  ↳ audit_logs action ENUM updated successfully with all existing records preserved.");
        } else {
          console.log("  ↳ audit_logs action ENUM already includes 'SETTING_UPDATE'.");
        }
      }
    }

    console.log("✅ System settings and notifications schema verified successfully.");
  } catch (error) {
    console.error("❌ Error in createSettingsAndNotificationsTables migration:", error);
    throw error;
  }
}

module.exports = createSettingsAndNotificationsTables;
