const multer = require("multer");
const path = require("path");
const storageService = require("../services/storageService");

// Configure disk storage with secure, randomized filenames
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageService.uploadDir);
  },
  filename: (req, file, cb) => {
    const secureName = storageService.generateSecureFileName(file.originalname);
    cb(null, secureName);
  },
});

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Validate both extension and MIME type
  const isExtensionValid = ALLOWED_EXTENSIONS.includes(ext);
  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);

  if (isExtensionValid && isMimeValid) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF and DOCX documents are allowed.")
    );
  }
};

const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
  fileFilter,
});

/**
 * Middleware wrapper that catches Multer errors and formats them into
 * clean JSON responses without breaking server execution.
 */
const handleUpload = (fieldName) => {
  const singleUpload = upload.single(fieldName);

  return (req, res, next) => {
    singleUpload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              success: false,
              error: "File size exceeds maximum limit of 5 MB",
            });
          }
          return res.status(400).json({
            success: false,
            error: `Upload error: ${err.message}`,
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message || "Failed to upload file",
        });
      }
      next();
    });
  };
};

module.exports = {
  upload,
  handleUpload,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};
