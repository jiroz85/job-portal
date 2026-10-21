const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middleware/auth");
const { handleUpload } = require("../middleware/upload");
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByEmail,
  verifyEmail,
  downloadApplicationResume,
  withdrawApplication,
} = require("../controllers/applicationController");

// Protected routes - require authentication
router.use(authenticateToken); // Apply auth middleware to all routes below

// Authenticated user routes
router.post(
  "/",
  authorize("jobseeker", "user", "admin"),
  handleUpload("resume"),
  createApplication
); // Submit application (supports multipart/form-data with resume file or JSON)
router.get("/:id/resume", downloadApplicationResume); // Download resume for an application (Applicant, Owning Employer, or Admin)
router.get("/email/:email", getApplicationsByEmail); // Get applications by email (for authenticated users)
router.get("/verify/:token", verifyEmail);
router.put("/:id/withdraw", authorize("jobseeker", "user", "admin"), withdrawApplication); // Email verification (public - still needed for email links)

// Employer/Admin only routes
router.get("/", authorize("employer", "admin"), getApplications); // Get all applications
router.get("/:id", authorize("employer", "admin"), getApplication); // Get single application
router.put(
  "/:id/status",
  authorize("employer", "admin"),
  updateApplicationStatus
); // Update application status
router.patch(
  "/:id/status",
  authorize("employer", "admin"),
  updateApplicationStatus
); // Update application status
router.delete("/:id", authorize("admin"), deleteApplication); // Delete application (admin only)

module.exports = router;
