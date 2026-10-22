const fs = require("fs");
const path = require("path");
const { generateResumePdf } = require("../utils/pdfGenerator");
const Resume = require("../models/Resume");
const User = require("../models/User");
const storageService = require("../services/storageService");

// @desc    Upload a new resume for authenticated user
// @route   POST /api/resumes/upload
// @access  Private
exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid resume file (PDF or DOCX)",
      });
    }

    const userId = req.user.id;

    // Check if user has any existing resumes
    const existingCount = await Resume.count({ where: { userId } });
    const isDefault = existingCount === 0; // First resume becomes default automatically

    let fileData = null;
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fileData = fs.readFileSync(req.file.path, { encoding: "base64" });
      } catch (readErr) {
        console.warn("Could not read uploaded file to base64:", readErr.message);
      }
    }

    const resume = await Resume.create({
      userId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileData,
      isDefault,
    });

    // Automatically link this uploaded resume to any past applications that are missing a resume file
    try {
      const Application = require("../models/Application");
      await Application.update(
        {
          fileData,
          originalResumeName: req.file.originalname,
          mimeType: req.file.mimetype,
          resumePath: req.file.filename,
        },
        {
          where: {
            userId,
            fileData: null,
          },
        }
      );
    } catch (backfillErr) {
      console.warn("Could not backfill application resume:", backfillErr.message);
    }

    // Update user's default resumePath
    if (isDefault) {
      await User.update(
        { resumePath: req.file.filename },
        { where: { id: userId } }
      );
    }

    res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      data: {
        id: resume.id,
        name: resume.originalName,
        fileName: resume.fileName,
        size: storageService.formatFileSize(resume.fileSize),
        fileSizeBytes: resume.fileSize,
        uploadedDate: resume.createdAt,
        isDefault: resume.isDefault,
      },
    });
  } catch (error) {
    console.error("Error uploading resume:", error);
    res.status(500).json({
      success: false,
      error: "Server error uploading resume",
    });
  }
};

// @desc    Get all resumes belonging to authenticated user
// @route   GET /api/resumes
// @access  Private
exports.getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.findAll({
      where: { userId: req.user.id },
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    const formatted = resumes.map((r) => ({
      id: r.id,
      name: r.originalName,
      fileName: r.fileName,
      size: storageService.formatFileSize(r.fileSize),
      fileSizeBytes: r.fileSize,
      uploadedDate: r.createdAt,
      isDefault: r.isDefault,
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching resumes",
    });
  }
};

// @desc    Download own resume file
// @route   GET /api/resumes/:id/download
// @access  Private
exports.downloadResume = async (req, res) => {
  try {
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: "Resume not found",
      });
    }

    // Authorization: owner or admin only
    if (req.user.role !== "admin" && resume.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to access this resume",
      });
    }

    const safeName = resume.originalName || "Resume.pdf";

    // 1. Direct file download if physical file exists on disk
    if (storageService.fileExists(resume.fileName)) {
      const filePath = storageService.getFilePath(resume.fileName);
      return res.download(filePath, safeName);
    }

    // 2. Exact uploaded file data stored in database (survives container restarts)
    if (resume.fileData) {
      const fileBuffer = Buffer.from(resume.fileData, "base64");
      const ext = path.extname(safeName).toLowerCase();
      const contentType =
        resume.mimeType ||
        (ext === ".docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : ext === ".doc"
          ? "application/msword"
          : "application/pdf");

      try {
        const filePath = storageService.getFilePath(resume.fileName);
        fs.writeFileSync(filePath, fileBuffer);
      } catch (cacheErr) {}

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
      return res.send(fileBuffer);
    }

    // Physical file missing on disk (e.g., container restarted) -> generate fallback PDF
    const user = await User.findByPk(resume.userId);
    const generatedPdf = generateResumePdf({
      name: user?.name || "Candidate",
      email: user?.email || "",
      phone: user?.phone || "",
      skills: user?.skills || "",
      experience: user?.bio || "",
      appliedDate: resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : "",
    });

    try {
      const fallbackPath = storageService.getFilePath(resume.fileName);
      fs.writeFileSync(fallbackPath, generatedPdf);
    } catch (saveErr) {
      console.warn("Could not cache generated resume on disk:", saveErr.message);
    }

    const downloadFileName = safeName.endsWith(".pdf") ? safeName : `${safeName}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadFileName}"`);
    return res.send(generatedPdf);
  } catch (error) {
    console.error("Error downloading resume:", error);
    res.status(500).json({
      success: false,
      error: "Server error downloading resume",
    });
  }
};

// @desc    Set a resume as default
// @route   PUT /api/resumes/:id/default
// @access  Private
exports.setDefaultResume = async (req, res) => {
  try {
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: "Resume not found",
      });
    }

    if (req.user.role !== "admin" && resume.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to modify this resume",
      });
    }

    // Reset other resumes
    await Resume.update(
      { isDefault: false },
      { where: { userId: resume.userId } }
    );

    // Set this one as default
    await resume.update({ isDefault: true });

    // Update user profile
    await User.update(
      { resumePath: resume.fileName },
      { where: { id: resume.userId } }
    );

    res.json({
      success: true,
      message: "Default resume updated",
      data: resume,
    });
  } catch (error) {
    console.error("Error setting default resume:", error);
    res.status(500).json({
      success: false,
      error: "Server error setting default resume",
    });
  }
};

// @desc    Delete a resume
// @route   DELETE /api/resumes/:id
// @access  Private
exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findByPk(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: "Resume not found",
      });
    }

    if (req.user.role !== "admin" && resume.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete this resume",
      });
    }

    const wasDefault = resume.isDefault;
    const userId = resume.userId;

    // Delete file from disk
    await storageService.deleteFile(resume.fileName);

    // Delete from database
    await resume.destroy();

    // If it was default, make the next one default if exists
    if (wasDefault) {
      const remainingResume = await Resume.findOne({
        where: { userId },
        order: [["createdAt", "DESC"]],
      });
      if (remainingResume) {
        await remainingResume.update({ isDefault: true });
        await User.update(
          { resumePath: remainingResume.fileName },
          { where: { id: userId } }
        );
      } else {
        await User.update(
          { resumePath: null },
          { where: { id: userId } }
        );
      }
    }

    res.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    res.status(500).json({
      success: false,
      error: "Server error deleting resume",
    });
  }
};
