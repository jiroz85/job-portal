const { Op } = require("sequelize");
const Job = require("../models/Job");
const User = require("../models/User");

// @desc    Get all jobs (admin)
// @route   GET /api/jobs/all
// @access  Private/Admin
exports.getAllJobsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: jobs } = await Job.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalJobs: count,
          hasNext: page * limit < count,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching jobs (admin):", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const {
      search,
      location,
      type,
      experience,
      page = 1,
      limit = 10,
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      [Op.or]: [{ status: "Published" }, { status: "active" }],
    };

    if (search) {
      whereClause[Op.and] = [
        {
          [Op.or]: [{ status: "Published" }, { status: "active" }],
        },
        {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { company: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        },
      ];
    } else {
      whereClause[Op.or] = [{ status: "Published" }, { status: "active" }];
    }

    if (location) {
      if (whereClause[Op.and]) {
        whereClause[Op.and].push({ location: { [Op.like]: `%${location}%` } });
      } else {
        whereClause[Op.and] = [
          {
            [Op.or]: [{ status: "Published" }, { status: "active" }],
          },
          { location: { [Op.like]: `%${location}%` } },
        ];
      }
    }

    if (type) {
      if (whereClause[Op.and]) {
        whereClause[Op.and].push({ type: type });
      } else {
        whereClause[Op.and] = [
          {
            [Op.or]: [{ status: "Published" }, { status: "active" }],
          },
          { type: type },
        ];
      }
    }

    if (experience) {
      if (whereClause[Op.and]) {
        whereClause[Op.and].push({ experience: experience });
      } else {
        whereClause[Op.and] = [
          {
            [Op.or]: [{ status: "Published" }, { status: "active" }],
          },
          { experience: experience },
        ];
      }
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      count: jobs.length,
      total: count,
      totalPages,
      currentPage: parseInt(page),
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Get jobs created by the authenticated employer
// @route   GET /api/jobs/my-jobs
// @access  Private/Employer/Admin
exports.getMyJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (req.user.role === "employer") {
      // Employers can view only their own jobs
      whereClause.employerId = req.user.id;
    } else if (req.user.role === "admin" && req.query.employerId) {
      // Admin can filter by specific employer if provided
      whereClause.employerId = req.query.employerId;
    }

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "employer",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public (Published/active) / Private (Owner/Admin for Drafts/Closed)
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "employer",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // Public visibility check: published or active jobs are public
    const isPublic = job.status === "Published" || job.status === "active";
    if (!isPublic) {
      // Non-public jobs only visible to owner or admin
      if (
        !req.user ||
        (req.user.role !== "admin" && job.employerId !== req.user.id)
      ) {
        return res.status(404).json({ success: false, error: "Job not found" });
      }
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Create job
// @route   POST /api/jobs
// @access  Private/Admin/Employer
exports.createJob = async (req, res) => {
  try {
    const jobData = { ...req.body };

    // Prevent employers from changing ownership by sending another employer's ID
    if (req.user.role === "employer") {
      jobData.employerId = req.user.id;
    } else if (req.user.role === "admin") {
      // Admin can optionally assign to an employer or default to admin
      if (!jobData.employerId) {
        jobData.employerId = req.user.id;
      }
    }

    const job = await Job.create(jobData);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private/Admin/Employer
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // Authorization: Admin can update any job; Employer can only update their own job
    if (req.user.role === "employer") {
      if (job.employerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You are not authorized to update this job",
        });
      }
      // Prevent employers from transferring ownership
      delete req.body.employerId;
    }

    await job.update(req.body);
    res.json({ success: true, data: job });
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private/Admin/Employer
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // Authorization: Admin can delete any job; Employer can only delete their own job
    if (req.user.role === "employer") {
      if (job.employerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You are not authorized to delete this job",
        });
      }
    }

    await job.destroy();
    res.json({ success: true, data: {} });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// @desc    Update job status/approvalStatus
// @route   PATCH /api/jobs/:id/status
// @access  Private/Admin/Employer
exports.updateJobStatus = async (req, res) => {
  try {
    const { status, approvalStatus } = req.body;
    const job = await Job.findByPk(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    // Authorization: Admin can update any job status; Employer can only update their own job
    if (req.user.role === "employer") {
      if (job.employerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "You are not authorized to update this job's status",
        });
      }
      // Employers cannot approve/reject their own job approval status
      if (approvalStatus && approvalStatus !== job.approvalStatus) {
        return res.status(403).json({
          success: false,
          error: "Only administrators can change job approval status",
        });
      }
    }

    const updates = {};
    if (status) updates.status = status;
    if (approvalStatus && req.user.role === "admin") updates.approvalStatus = approvalStatus;

    await job.update(updates);
    res.json({ success: true, data: job });
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
