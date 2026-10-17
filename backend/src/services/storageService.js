const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * Storage Service Abstraction
 * 
 * Manages file persistence, secure filename generation, and file operations.
 * By default, uses local filesystem storage with persistence under the configured upload directory.
 * In production environments (e.g., cloud platforms without persistent disks),
 * this abstraction can be configured with S3, Cloudinary, or GCS providers.
 */
class StorageService {
  constructor() {
    this.uploadDir =
      process.env.RESUME_UPLOAD_DIR ||
      path.resolve(__dirname, "../../uploads/resumes");
    this.ensureDirectoryExists(this.uploadDir);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Generates a cryptographically random, safe unique filename.
   * Client-supplied filenames are never used directly on disk.
   */
  generateSecureFileName(originalName) {
    const rawExt = path.extname(originalName).toLowerCase();
    const allowedExts = [".pdf", ".docx", ".doc"];
    const ext = allowedExts.includes(rawExt) ? rawExt : ".pdf";
    const randomHex = crypto.randomBytes(16).toString("hex");
    const timestamp = Date.now();
    return `resume_${randomHex}_${timestamp}${ext}`;
  }

  /**
   * Returns absolute path to stored file.
   */
  getFilePath(fileName) {
    // Prevent path traversal
    const safeFileName = path.basename(fileName);
    return path.join(this.uploadDir, safeFileName);
  }

  /**
   * Checks if file exists on disk.
   */
  fileExists(fileName) {
    const filePath = this.getFilePath(fileName);
    return fs.existsSync(filePath);
  }

  /**
   * Safely deletes file from storage.
   */
  async deleteFile(fileName) {
    try {
      const filePath = this.getFilePath(fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
      return false;
    }
  }

  /**
   * Formats file size in bytes to human-readable string (e.g., '2.4 MB')
   */
  formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

module.exports = new StorageService();
