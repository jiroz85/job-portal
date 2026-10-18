const User = require("../models/User");
const Application = require("../models/Application");
const Job = require("../models/Job");
const Audit = require("../models/Audit");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");

// Get all users with pagination and filtering
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Build search conditions
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalUsers: count,
          hasNext: page * limit < count,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
};

// Get user by ID with detailed information
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Application,
          as: "applications",
          include: [
            {
              model: Job,
              as: "job",
              attributes: ["id", "title", "company", "location", "type"],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Parse JSON fields
    const userData = user.toJSON();
    if (userData.skills) {
      userData.skills = JSON.parse(userData.skills);
    }
    if (userData.experience) {
      userData.experience = JSON.parse(userData.experience);
    }
    if (userData.education) {
      userData.education = JSON.parse(userData.education);
    }
    if (userData.employerDetails) {
      userData.employerDetails = JSON.parse(userData.employerDetails);
    }

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user",
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates.emailVerificationToken;
    delete updates.passwordResetToken;
    delete updates.passwordResetExpires;

    // Parse JSON fields if they're strings
    if (updates.skills && typeof updates.skills === "string") {
      updates.skills = JSON.stringify(updates.skills);
    }
    if (updates.experience && typeof updates.experience === "string") {
      updates.experience = JSON.stringify(updates.experience);
    }
    if (updates.education && typeof updates.education === "string") {
      updates.education = JSON.stringify(updates.education);
    }
    if (
      updates.employerDetails &&
      typeof updates.employerDetails === "string"
    ) {
      updates.employerDetails = JSON.stringify(updates.employerDetails);
    }

    const [updatedRowsCount] = await User.update(updates, {
      where: { id },
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user",
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the user before deletion for audit
    const userBefore = await User.findByPk(id);
    if (!userBefore) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await sequelize.transaction(async (t) => {
      // Log action to persistent audit trail within transaction
      await Audit.create(
        {
          action: "USER_DELETE",
          targetUserId: null,
          performedBy: req.user.id,
          details: `Deleted user: ${userBefore.name} (${userBefore.email}), ID: ${id}, Role: ${userBefore.role}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
        },
        { transaction: t }
      );

      const deletedRowsCount = await User.destroy({
        where: { id },
        transaction: t,
      });

      if (deletedRowsCount === 0) {
        throw new Error("User not found or already deleted");
      }
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
};

// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["jobseeker", "admin", "employer"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role",
      });
    }

    // Get the user before update for audit
    const userBefore = await User.findByPk(id);
    if (!userBefore) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await sequelize.transaction(async (t) => {
      const [updatedRowsCount] = await User.update(
        { role },
        { where: { id }, transaction: t }
      );

      if (updatedRowsCount === 0) {
        throw new Error("User not found or role unchanged");
      }

      await Audit.create(
        {
          action: "ROLE_CHANGE",
          targetUserId: parseInt(id, 10),
          performedBy: req.user.id,
          details: `Changed role from ${userBefore.role} to ${role}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
        },
        { transaction: t }
      );
    });

    res.json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user role",
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    // Get the user before update for audit
    const userBefore = await User.findByPk(id);
    if (!userBefore) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    await sequelize.transaction(async (t) => {
      const [updatedRowsCount] = await User.update(
        { status },
        { where: { id }, transaction: t }
      );

      if (updatedRowsCount === 0) {
        throw new Error("User not found or status unchanged");
      }

      await Audit.create(
        {
          action: "STATUS_CHANGE",
          targetUserId: parseInt(id, 10),
          performedBy: req.user.id,
          details: `Changed status from ${userBefore.status} to ${status}`,
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get("User-Agent"),
        },
        { transaction: t }
      );
    });

    res.json({
      success: true,
      message: "User status updated successfully",
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user status",
    });
  }
};

// Get user & platform statistics
const getUserStatistics = async (req, res) => {
  try {
    const { dateRange = "30days", startDate, endDate } = req.query;

    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: "active" } });
    const inactiveUsers = await User.count({ where: { status: "inactive" } });
    const blockedUsers = await User.count({ where: { status: "blocked" } });

    // Get total jobs count
    const totalJobs = await Job.count();

    // Get total applications count
    const totalApplications = await Application.count();

    // Get recent activity (applications in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await Application.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    });

    // Date range filter for period-specific statistics
    let rangeFilter = null;
    if (startDate || endDate) {
      rangeFilter = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        rangeFilter[Op.gte] = new Date(startDate);
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        rangeFilter[Op.lte] = new Date(endDate);
      }
    } else if (dateRange !== "all") {
      const daysMap = { "7days": 7, "30days": 30, "90days": 90, "1year": 365 };
      const days = daysMap[dateRange] || 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      rangeFilter = { [Op.gte]: cutoff };
    }

    // Trend filter condition: use rangeFilter if present; fallback to 30 days
    const trendCondition = rangeFilter || { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };

    const roleStats = await User.findAll({
      attributes: [
        "role",
        [User.sequelize.fn("COUNT", User.sequelize.col("id")), "count"],
      ],
      group: ["role"],
    });

    const recentUsers = await User.findAll({
      limit: 5,
      order: [["createdAt", "DESC"]],
      attributes: ["id", "name", "email", "role", "createdAt"],
    });

    // User registration trends
    const registrationTrend = await User.findAll({
      where: {
        createdAt: trendCondition,
      },
      attributes: [
        [User.sequelize.fn("DATE", User.sequelize.col("createdAt")), "date"],
        [User.sequelize.fn("COUNT", User.sequelize.col("id")), "count"],
      ],
      group: [User.sequelize.fn("DATE", User.sequelize.col("createdAt"))],
      order: [
        [User.sequelize.fn("DATE", User.sequelize.col("createdAt")), "ASC"],
      ],
    });

    // Application submission trends
    const applicationTrend = await Application.findAll({
      where: {
        createdAt: trendCondition,
      },
      attributes: [
        [Application.sequelize.fn("DATE", Application.sequelize.col("createdAt")), "date"],
        [Application.sequelize.fn("COUNT", Application.sequelize.col("id")), "count"],
      ],
      group: [Application.sequelize.fn("DATE", Application.sequelize.col("createdAt"))],
      order: [
        [Application.sequelize.fn("DATE", Application.sequelize.col("createdAt")), "ASC"],
      ],
    });

    // Job breakdowns by status, approvalStatus, and type
    const jobStatusStats = await Job.findAll({
      attributes: [
        "status",
        [Job.sequelize.fn("COUNT", Job.sequelize.col("id")), "count"],
      ],
      group: ["status"],
    });

    const jobApprovalStats = await Job.findAll({
      attributes: [
        "approvalStatus",
        [Job.sequelize.fn("COUNT", Job.sequelize.col("id")), "count"],
      ],
      group: ["approvalStatus"],
    });

    const jobTypeStats = await Job.findAll({
      attributes: [
        "type",
        [Job.sequelize.fn("COUNT", Job.sequelize.col("id")), "count"],
      ],
      group: ["type"],
    });

    // Top applied jobs from database
    const topAppliedRows = await Application.findAll({
      attributes: [
        "jobId",
        [
          Application.sequelize.fn(
            "COUNT",
            Application.sequelize.col("Application.id")
          ),
          "applicationCount",
        ],
      ],
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title", "company"],
        },
      ],
      group: ["jobId", "job.id"],
      order: [[Application.sequelize.literal("applicationCount"), "DESC"]],
      limit: 5,
    });

    // Application breakdown by status
    const applicationStatusStats = await Application.findAll({
      attributes: [
        "status",
        [
          Application.sequelize.fn(
            "COUNT",
            Application.sequelize.col("id")
          ),
          "count",
        ],
      ],
      group: ["status"],
    });

    // Period specific new counts
    let periodNewUsers = null;
    let periodNewJobs = null;
    let periodNewApplications = null;

    if (rangeFilter) {
      [periodNewUsers, periodNewJobs, periodNewApplications] = await Promise.all([
        User.count({ where: { createdAt: rangeFilter } }),
        Job.count({ where: { createdAt: rangeFilter } }),
        Application.count({ where: { createdAt: rangeFilter } }),
      ]);
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        totalJobs,
        totalApplications,
        recentActivity,
        activeUsers,
        inactiveUsers,
        blockedUsers,
        roleStats: roleStats.map((stat) => ({
          role: stat.role,
          count: parseInt(stat.dataValues.count, 10),
        })),
        recentUsers,
        registrationTrend: registrationTrend.map((trend) => ({
          date: trend.dataValues.date,
          count: parseInt(trend.dataValues.count, 10),
        })),
        applicationTrend: applicationTrend.map((trend) => ({
          date: trend.dataValues.date,
          count: parseInt(trend.dataValues.count, 10),
        })),
        jobStats: {
          byStatus: jobStatusStats.map((st) => ({
            status: st.status,
            count: parseInt(st.dataValues.count, 10),
          })),
          byApprovalStatus: jobApprovalStats.map((ap) => ({
            approvalStatus: ap.approvalStatus,
            count: parseInt(ap.dataValues.count, 10),
          })),
          byType: jobTypeStats.map((tp) => ({
            type: tp.type,
            count: parseInt(tp.dataValues.count, 10),
          })),
          topAppliedJobs: topAppliedRows.map((row) => ({
            jobId: row.jobId,
            title: row.job?.title || `Job #${row.jobId}`,
            company: row.job?.company || "Unknown Company",
            applicationCount: parseInt(row.dataValues.applicationCount, 10),
          })),
        },
        applicationStats: {
          byStatus: applicationStatusStats.map((app) => {
            const count = parseInt(app.dataValues.count, 10);
            return {
              status: app.status,
              count,
              percentage:
                totalApplications > 0
                  ? Number(((count / totalApplications) * 100).toFixed(1))
                  : 0,
            };
          }),
        },
        periodStats: rangeFilter
          ? {
              dateRange,
              newUsers: periodNewUsers,
              newJobs: periodNewJobs,
              newApplications: periodNewApplications,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user statistics",
    });
  }
};

// Get user activity
const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: ["id", "name", "email", "lastLogin", "createdAt"],
      include: [
        {
          model: Application,
          as: "applications",
          include: [
            {
              model: Job,
              as: "job",
              attributes: ["id", "title", "company"],
            },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = user.toJSON();

    // Calculate activity metrics
    const totalApplications = userData.applications.length;
    const recentApplications = userData.applications.filter(
      (app) =>
        new Date(app.createdAt) >
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    // Application status breakdown
    const statusBreakdown = userData.applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          lastLogin: userData.lastLogin,
          memberSince: userData.createdAt,
        },
        activity: {
          totalApplications,
          recentApplications,
          statusBreakdown,
          applications: userData.applications,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user activity",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  getUserStatistics,
  getUserActivity,
};
