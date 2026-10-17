const path = require("path");
const { Op } = require("sequelize");
const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const Resume = require("../models/Resume");
const storageService = require("../services/storageService");

// Get all applications (for employers/admins)
const getApplications = async (req, res) => {
  try {
    const { jobId, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;

    // Check employer restriction: employers can only view applications for jobs they own
    if (req.user && req.user.role === "employer") {
      if (jobId) {
        // Verify this specific job belongs to the authenticated employer
        const job = await Job.findOne({
          where: { id: jobId, employerId: req.user.id },
        });
        if (!job) {
          return res.status(403).json({
            success: false,
            error: "You are not authorized to view applications for this job",
          });
        }
        whereClause.jobId = jobId;
      } else {
        // Fetch all jobs belonging to this employer
        const employerJobs = await Job.findAll({
          where: { employerId: req.user.id },
          attributes: ["id"],
        });
        const employerJobIds = employerJobs.map((j) => j.id);

        if (employerJobIds.length === 0) {
          return res.json({
            success: true,
            data: [],
            pagination: {
              total: 0,
              page: parseInt(page),
              limit: parseInt(limit),
              pages: 0,
            },
          });
        }
        whereClause.jobId = { [Op.in]: employerJobIds };
      }
    } else {
      // Admin or other roles
      if (jobId) whereClause.jobId = jobId;
    }

    const applications = await Application.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company", "location", "employerId"],
        },
      ],
      order: [["applicationDate", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: applications.rows,
      pagination: {
        total: applications.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(applications.count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch applications",
    });
  }
};

// Get single application by ID
const getApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          as: "job",
          attributes: [
            "id",
            "title",
            "company",
            "location",
            "description",
            "requirements",
            "employerId",
          ],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    // Check employer restriction: employers can only view applications for jobs they own
    if (req.user && req.user.role === "employer") {
      if (!application.job || application.job.employerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You are not authorized to view this application",
        });
      }
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch application",
    });
  }
};

// Create new application (submit job application) - REQUIRES AUTHENTICATED USER
const createApplication = async (req, res) => {
  try {
    const {
      jobId,
      applicantPhone,
      coverLetter,
      experience,
      education,
      skills,
      expectedSalary,
      availability,
    } = req.body;

    // Get authenticated user from request (set by authenticateToken middleware)
    const authenticatedUser = req.user;

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to submit applications",
      });
    }

    // Verify user is a job seeker or user (allow both roles for application submission)
    if (
      authenticatedUser.role !== "jobseeker" &&
      authenticatedUser.role !== "user" &&
      authenticatedUser.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "Only job seekers can submit applications",
      });
    }

    console.log("Creating application for authenticated user:", {
      userId: authenticatedUser.id,
      userEmail: authenticatedUser.email,
      userName: authenticatedUser.name,
    });

    // Enhanced validation
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: "Job ID is required",
      });
    }

    // Validate authenticated user has required fields
    if (!authenticatedUser.email) {
      return res.status(400).json({
        success: false,
        error: "User email is required for application submission",
      });
    }

    // Use authenticated user data - add fallbacks for missing fields
    const applicantName =
      authenticatedUser.name ||
      authenticatedUser.email?.split("@")[0] ||
      "Unknown User";
    const applicantEmail = authenticatedUser.email || "unknown@example.com";

    console.log("Authenticated user data:", {
      id: authenticatedUser.id,
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
    });

    console.log("Application data being set:", {
      applicantName,
      applicantEmail,
      applicantPhone,
    });

    // Phone number validation (if provided)
    if (applicantPhone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(applicantPhone) || applicantPhone.length < 10) {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid phone number",
        });
      }
    }

    // Check if job exists and is active
    const job = await Job.findByPk(jobId);
    console.log("Found job:", job);
    if (!job) {
      console.log("Job not found with ID:", jobId);
      return res.status(404).json({
        success: false,
        error: "Job not found",
      });
    }

    if (job.status !== "active" && job.status !== "Published") {
      console.log("Job status validation failed. Current status:", job.status);
      return res.status(400).json({
        success: false,
        error: "This job is no longer accepting applications",
      });
    }

    // Enhanced duplicate prevention - check if user has already applied for this job
    const existingApplication = await Application.findOne({
      where: {
        jobId,
        applicantEmail: authenticatedUser.email,
      },
    });

    if (existingApplication) {
      // Check if the previous application was recent (within 7 days)
      const daysSinceLastApplication =
        (new Date() - new Date(existingApplication.applicationDate)) /
        (1000 * 60 * 60 * 24);

      if (daysSinceLastApplication < 7) {
        return res.status(400).json({
          success: false,
          error: `You have already applied for this job on ${new Date(
            existingApplication.applicationDate
          ).toLocaleDateString()}. Please wait 7 days before reapplying.`,
        });
      } else {
        // If it's been more than 7 days, allow reapplication but update the existing one
        await existingApplication.update({
          applicantPhone,
          coverLetter,
          experience,
          education,
          skills,
          expectedSalary,
          availability,
          applicationDate: new Date(), // Update to current date
          status: "pending", // Reset to pending
          lastUpdated: new Date(),
        });

        // Return the updated application with job details
        const updatedApplication = await Application.findByPk(
          existingApplication.id,
          {
            include: [
              {
                model: Job,
                as: "job",
                attributes: ["id", "title", "company", "location"],
              },
            ],
          }
        );

        return res.status(200).json({
          success: true,
          message: "Your previous application has been updated successfully",
          data: updatedApplication,
        });
      }
    }

    // Rate limiting: Check how many applications this user has submitted in the last 24 hours
    const recentApplications = await Application.count({
      where: {
        applicantEmail: authenticatedUser.email,
        applicationDate: {
          [require("sequelize").Op.gte]: new Date(
            Date.now() - 24 * 60 * 60 * 1000
          ),
        },
      },
    });

    if (recentApplications >= 5) {
      return res.status(429).json({
        success: false,
        error:
          "You have reached the daily application limit. Please try again tomorrow.",
      });
    }

    // Risk assessment - lower risk for authenticated users
    let riskScore = 0;
    const suspiciousFactors = [];

    // Check application quality indicators
    if (!coverLetter || coverLetter.length < 50) {
      riskScore += 10;
      suspiciousFactors.push("No or minimal cover letter");
    }

    if (!skills || skills.split(",").length < 3) {
      riskScore += 5;
      suspiciousFactors.push("Few or no skills listed");
    }

    if (!experience || experience.length < 20) {
      riskScore += 5;
      suspiciousFactors.push("Minimal experience description");
    }

    // Get client IP and user agent for tracking
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.get("User-Agent") || "unknown";

    // Create verification token
    const verificationToken = require("crypto").randomBytes(32).toString("hex");

    // Process resume attachment (either direct upload or reference to existing resume)
    let resumePath = null;
    if (req.file) {
      resumePath = req.file.filename;
      try {
        await Resume.create({
          userId: authenticatedUser.id,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          isDefault: false,
        });
      } catch (resumeErr) {
        console.error("Note: could not create resume record:", resumeErr);
      }
    } else if (req.body.resumeId) {
      const selectedResume = await Resume.findOne({
        where: { id: req.body.resumeId, userId: authenticatedUser.id },
      });
      if (selectedResume) {
        resumePath = selectedResume.fileName;
      }
    } else if (req.body.resumePath) {
      resumePath = req.body.resumePath;
    }

    // Create application with verification data and user ID
    const application = await Application.create({
      jobId,
      applicantName,
      applicantEmail,
      applicantPhone,
      resumePath,
      coverLetter,
      experience,
      education,
      skills,
      expectedSalary,
      availability,
      verificationToken,
      ipAddress,
      userAgent,
      riskScore,
      flagged: riskScore > 50, // Flag if risk score is high
      userId: authenticatedUser.id, // Link to authenticated user
      isVerified: true, // Auto-verify for authenticated users
      emailVerified: true, // Auto-verify email for authenticated users
    });

    // Return the created application with job details
    const createdApplication = await Application.findByPk(application.id, {
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company", "location"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: createdApplication,
    });
  } catch (error) {
    console.error("Error creating application:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      errors: error.errors,
    });
    res.status(500).json({
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? `Server error: ${error.message}`
          : "Failed to submit application",
    });
  }
};

// Update application status (for employers/admins)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "employerId"],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    // Check employer restriction: employers can only update applications for jobs they own
    if (req.user && req.user.role === "employer") {
      if (!application.job || application.job.employerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You are not authorized to update applications for this job",
        });
      }
    }

    // Update application
    await application.update({
      status,
      notes: notes || application.notes,
      lastUpdated: new Date(),
    });

    // Return updated application with job details
    const updatedApplication = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company", "location"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Application status updated successfully",
      data: updatedApplication,
    });
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update application",
    });
  }
};

// Delete application (for employers/admins)
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    await application.destroy();

    res.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete application",
    });
  }
};

// Get applications by email (for applicants to check their applications)
const getApplicationsByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const applications = await Application.findAll({
      where: { applicantEmail: email },
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company", "location", "status"],
        },
      ],
      order: [["applicationDate", "DESC"]],
    });

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applications by email:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch applications",
    });
  }
};

// Verify applicant email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      });
    }

    const application = await Application.findOne({
      where: { verificationToken: token },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Invalid or expired verification token",
      });
    }

    // Update verification status
    await application.update({
      emailVerified: true,
      isVerified: true,
      verificationToken: null, // Clear token after verification
      lastUpdated: new Date(),
    });

    res.json({
      success: true,
      message:
        "Email verified successfully! Your application is now confirmed.",
      data: {
        applicationId: application.id,
        applicantName: application.applicantName,
        jobTitle: application.job?.title || "Unknown Position",
      },
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify email",
    });
  }
};

// @desc    Download the resume file attached to an application
// @route   GET /api/applications/:id/resume
// @access  Private (Applicant, Owning Employer, or Admin)
const downloadApplicationResume = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company", "employerId"],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    // Authorization:
    // 1. Admin can access any resume
    // 2. The applicant who submitted can access their own resume
    // 3. The employer who owns the job can access resumes for that job
    const isAdmin = req.user.role === "admin";
    const isApplicant =
      application.userId === req.user.id ||
      application.applicantEmail === req.user.email;
    const isOwningEmployer =
      req.user.role === "employer" &&
      application.job &&
      application.job.employerId === req.user.id;

    if (!isAdmin && !isApplicant && !isOwningEmployer) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to access this resume",
      });
    }

    if (!application.resumePath) {
      return res.status(404).json({
        success: false,
        error: "No resume attached to this application",
      });
    }

    if (!storageService.fileExists(application.resumePath)) {
      return res.status(404).json({
        success: false,
        error: "Resume file not found on storage",
      });
    }

    const filePath = storageService.getFilePath(application.resumePath);
    const ext = path.extname(application.resumePath) || ".pdf";
    const safeName = `${application.applicantName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume${ext}`;

    res.download(filePath, safeName);
  } catch (error) {
    console.error("Error downloading application resume:", error);
    res.status(500).json({
      success: false,
      error: "Server error downloading application resume",
    });
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplicationStatus,
  deleteApplication,
  getApplicationsByEmail,
  verifyEmail,
  downloadApplicationResume,
};
