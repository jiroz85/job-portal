const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  optionalAuthenticateToken,
  authorize,
} = require("../middleware/auth");
const {
  getJobs,
  getMyJobs,
  getAllJobsAdmin,
  getJob,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob,
} = require("../controllers/jobController");

// Public routes
router.get("/", getJobs);
// Employer / Admin my-jobs route (MUST be placed before /:id)
router.get(
  "/my-jobs",
  authenticateToken,
  authorize("admin", "employer"),
  getMyJobs
);
// Admin routes
router.get("/all", authenticateToken, authorize("admin"), getAllJobsAdmin);
router.get("/:id", optionalAuthenticateToken, getJob);

// Protected routes
router.post("/", authenticateToken, authorize("admin", "employer"), createJob);
router.put(
  "/:id",
  authenticateToken,
  authorize("admin", "employer"),
  updateJob
);
router.patch(
  "/:id/status",
  authenticateToken,
  authorize("admin", "employer"),
  updateJobStatus
);
router.delete(
  "/:id",
  authenticateToken,
  authorize("admin", "employer"),
  deleteJob
);

module.exports = router;
