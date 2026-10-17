const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { handleUpload } = require("../middleware/upload");
const {
  uploadResume,
  getMyResumes,
  downloadResume,
  setDefaultResume,
  deleteResume,
} = require("../controllers/resumeController");

// All resume routes require authentication
router.use(authenticateToken);

// Upload new resume
router.post("/upload", handleUpload("resume"), uploadResume);

// Get authenticated user's resumes
router.get("/", getMyResumes);

// Download resume file
router.get("/:id/download", downloadResume);

// Set resume as default
router.put("/:id/default", setDefaultResume);

// Delete resume
router.delete("/:id", deleteResume);

module.exports = router;
