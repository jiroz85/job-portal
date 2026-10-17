const { sequelize } = require("../config/database");

async function createResumesTable() {
  try {
    console.log("Creating resumes table...");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        originalName VARCHAR(255) NOT NULL,
        fileName VARCHAR(255) NOT NULL,
        filePath VARCHAR(255) NOT NULL,
        fileSize INT NOT NULL,
        mimeType VARCHAR(100) NOT NULL,
        isDefault BOOLEAN DEFAULT FALSE,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        INDEX idx_resumes_userId (userId),
        CONSTRAINT fk_resumes_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Resumes table created successfully");
  } catch (error) {
    console.error("❌ Error creating resumes table:", error);
    throw error;
  }
}

module.exports = createResumesTable;
