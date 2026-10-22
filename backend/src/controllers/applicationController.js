const fs = require("fs");
const path = require("path");
const { generateResumePdf } = require("../utils/pdfGenerator");
const { Op } = require("sequelize");
const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const Resume = require("../models/Resume");
const Audit = require("../models/Audit");
const Notification = require("../models/Notification");
const storageService = require("../services/storageService");
const { sequelize } = require("../config/database");

// Get all applications (for employers/admins)
const getApplications = async (req, res) => {
  try {
    const { jobId, status, page = 1, limit = 10, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const whereClause = {};
    if (status && status !== "all") whereClause.status = status;

    if (search && search.trim()) {
      whereClause[Op.or] = [
        { applicantName: { [Op.like]: `%${search.trim()}%` } },
        { applicantEmail: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

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
      if (jobId && jobId !== "all") whereClause.jobId = jobId;
    }

    const applications = await Application.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company", "location", "employerId"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone"],
          required: false,
        },
      ],
      order: [["applicationDate", "DESC"]],
      limit: limitNum,
      offset: offset,
    });

    res.json({
      success: true,
      data: applications.rows,
      pagination: {
        total: applications.count,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(applications.count / limitNum) || 1,
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

    // Process resume attachment (stores exact file in database so it survives cloud restarts)
    let resumePath = null;
    let fileData = null;
    let originalResumeName = null;
    let mimeType = null;

    if (req.file) {
      resumePath = req.file.filename;
      originalResumeName = req.file.originalname;
      mimeType = req.file.mimetype;
      if (req.file.path && fs.existsSync(req.file.path)) {
        try {
          fileData = fs.readFileSync(req.file.path, { encoding: "base64" });
        } catch (readErr) {
          console.warn("Could not read uploaded application resume:", readErr.message);
        }
      }

      // Also create a resume record in the candidate's resumes table so it's in their manager
      try {
        await Resume.create({
          userId: authenticatedUser.id,
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          fileData,
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
        fileData = selectedResume.fileData;
        originalResumeName = selectedResume.originalName;
        mimeType = selectedResume.mimeType;
      }
    } else {
      // Check if user has a default or existing resume in their resumes table
      try {
        const defaultResume = await Resume.findOne({
          where: { userId: authenticatedUser.id },
          order: [["isDefault", "DESC"], ["createdAt", "DESC"]],
        });
        if (defaultResume) {
          resumePath = defaultResume.fileName;
          fileData = defaultResume.fileData;
          originalResumeName = defaultResume.originalName;
          mimeType = defaultResume.mimeType;
        }
      } catch (dErr) {
        console.warn("Could not fetch default resume:", dErr.message);
      }
    }

    // Create application with verification data and user ID
    const application = await Application.create({
      jobId,
      applicantName,
      applicantEmail,
      applicantPhone,
      resumePath,
      fileData,
      originalResumeName,
      mimeType,
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

const VALID_APPLICATION_STATUSES = [
  "pending",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "offered",
  "accepted",
  "rejected",
  "withdrawn",
];

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

    if (!VALID_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid application status: "${status}". Valid statuses are: ${VALID_APPLICATION_STATUSES.join(", ")}`,
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
      if (application.status === "withdrawn") {
        return res.status(400).json({
          success: false,
          error: "Cannot change the status of an application withdrawn by the candidate",
        });
      }
    }

    // Update application notes logic:
    // If notes is undefined (omitted), preserve the existing note.
    // If notes is explicitly an empty string, allow it to be cleared (stored as null).
    const updatedNotes =
      notes !== undefined
        ? notes === ""
          ? null
          : notes
        : application.notes;

    // Update application and record audit atomically
    await sequelize.transaction(async (t) => {
      await application.update(
        {
          status,
          notes: updatedNotes,
          lastUpdated: new Date(),
        },
        { transaction: t }
      );

      await Audit.create(
        {
          action: "APPLICATION_UPDATE",
          targetUserId: application.userId || null,
          performedBy: req.user.id,
          details: `Updated application #${application.id} status to "${status}"`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
        },
        { transaction: t }
      );

      // Deliver trusted notification to candidate upon status transition
      if (application.userId) {
        const statusMessages = {
          viewed: "Your application has been viewed by the employer.",
          shortlisted: "Congratulations! You have been shortlisted for the position.",
          rejected: "Thank you for applying. Unfortunately, your application was not selected.",
          offered: "Congratulations! You have received a job offer.",
          hired: "Congratulations! You have been officially hired.",
          withdrawn: "Your application has been marked as withdrawn.",
        };

        await Notification.create(
          {
            userId: application.userId,
            title: "Application Status Updated",
            message:
              statusMessages[status] ||
              `Your application #${application.id} status is now "${status}".`,
            type: "application_status",
            priority: status === "offered" || status === "hired" ? "high" : "medium",
            link: "/applications",
          },
          { transaction: t }
        );
      }
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

    // Clean up stored resume file if it exists
    if (application.resumePath && storageService.fileExists(application.resumePath)) {
      await storageService.deleteFile(application.resumePath);
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

    // Authorization: only the applicant themselves or an admin can access applications for this email
    if (
      req.user &&
      req.user.role !== "admin" &&
      req.user.email?.toLowerCase() !== email.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to view applications for this email",
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

    const safeName =
      application.originalResumeName ||
      `${application.applicantName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Resume${path.extname(application.resumePath || "") || ".pdf"}`;

    // 1. Direct file download if physical file exists on disk
    if (application.resumePath && storageService.fileExists(application.resumePath)) {
      const filePath = storageService.getFilePath(application.resumePath);
      return res.download(filePath, safeName);
    }

    // 2. Exact uploaded file data stored in Application database record
    if (application.fileData) {
      const fileBuffer = Buffer.from(application.fileData, "base64");
      const ext = path.extname(safeName).toLowerCase();
      const contentType =
        application.mimeType ||
        (ext === ".docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : ext === ".doc"
          ? "application/msword"
          : "application/pdf");

      try {
        if (application.resumePath) {
          const cachePath = storageService.getFilePath(application.resumePath);
          fs.writeFileSync(cachePath, fileBuffer);
        }
      } catch (cacheErr) {}

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
      return res.send(fileBuffer);
    }

    // 3. Exact uploaded file data stored in Candidate's Resumes table
    if (application.userId) {
      try {
        const userResumes = await Resume.findAll({
          where: { userId: application.userId },
          order: [["isDefault", "DESC"], ["createdAt", "DESC"]],
        });
        for (const r of userResumes) {
          // If file is physically on disk
          if (r.fileName && storageService.fileExists(r.fileName)) {
            const candPath = storageService.getFilePath(r.fileName);
            const candName = r.originalName || safeName;
            return res.download(candPath, candName);
          }
          // If stored in database as base64
          if (r.fileData) {
            const fileBuffer = Buffer.from(r.fileData, "base64");
            const candName = r.originalName || safeName;
            const ext = path.extname(candName).toLowerCase();
            const contentType =
              r.mimeType ||
              (ext === ".docx"
                ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                : ext === ".doc"
                ? "application/msword"
                : "application/pdf");

            // Backfill the application with this exact uploaded resume
            try {
              await application.update({
                fileData: r.fileData,
                originalResumeName: candName,
                mimeType: contentType,
                resumePath: r.fileName,
              });
            } catch (uErr) {}

            res.setHeader("Content-Type", contentType);
            res.setHeader("Content-Disposition", `attachment; filename="${candName}"`);
            return res.send(fileBuffer);
          }
        }
      } catch (checkErr) {
        console.warn("Could not check user resumes table:", checkErr.message);
      }
    }

    // 3. Fallback: Cloud container ephemeral storage recovery (e.g. Render restart or historical application)
    // Automatically generate clean, valid PDF from verified candidate credentials
    const generatedPdf = generateResumePdf({
      name: application.applicantName,
      email: application.applicantEmail,
      phone: application.applicantPhone || "",
      jobTitle: application.job?.title || "",
      company: application.job?.company || "",
      appliedDate: application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "",
      skills: application.skills || "",
      experience: application.experience || "",
      education: application.education || "",
      coverLetter: application.coverLetter || "",
      expectedSalary: application.expectedSalary || "",
      availability: application.availability || "",
    });

    try {
      const fallbackFileName = `resume_auto_${application.id}.pdf`;
      const fallbackPath = storageService.getFilePath(fallbackFileName);
      fs.writeFileSync(fallbackPath, generatedPdf);
      if (!application.resumePath) {
        await application.update({ resumePath: fallbackFileName });
      }
    } catch (saveErr) {
      console.warn("Could not cache generated resume on disk:", saveErr.message);
    }

    const downloadFileName = safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadFileName}"`);
    return res.send(generatedPdf);
  } catch (error) {
    console.error("Error downloading application resume:", error);
    res.status(500).json({
      success: false,
      error: "Server error downloading application resume",
    });
  }
};

// @desc    Withdraw application (for candidate or admin)
// @route   PUT /api/applications/:id/withdraw
// @access  Private (Applicant or Admin)
const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company"],
        },
      ],
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isApplicant =
      application.userId === req.user.id ||
      application.applicantEmail?.toLowerCase() === req.user.email?.toLowerCase();

    if (!isAdmin && !isApplicant) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to withdraw this application",
      });
    }

    if (application.status === "withdrawn") {
      return res.status(400).json({
        success: false,
        error: "This application has already been withdrawn",
      });
    }

    if (application.status === "accepted" || application.status === "hired") {
      return res.status(400).json({
        success: false,
        error: "Cannot withdraw an application that has already been accepted/hired",
      });
    }

    if (application.status === "rejected") {
      return res.status(400).json({
        success: false,
        error: "Cannot withdraw an application that has already been closed/rejected",
      });
    }

    await sequelize.transaction(async (t) => {
      await application.update(
        {
          status: "withdrawn",
          lastUpdated: new Date(),
        },
        { transaction: t }
      );

      await Audit.create(
        {
          action: "APPLICATION_UPDATE",
          targetUserId: application.userId || null,
          performedBy: req.user.id,
          details: `Candidate withdrew application #${application.id} for "${application.job?.title || "Job"}"`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
        },
        { transaction: t }
      );
    });

    const updatedApplication = await Application.findByPk(id, {
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company", "location", "status"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Application withdrawn successfully",
      data: updatedApplication,
    });
  } catch (error) {
    console.error("Error withdrawing application:", error);
    res.status(500).json({
      success: false,
      error: "Failed to withdraw application",
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
  withdrawApplication,
};
