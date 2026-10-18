const Audit = require("../models/Audit");
const User = require("../models/User");
const { Op } = require("sequelize");

const VALID_AUDIT_ACTIONS = [
  "ROLE_CHANGE",
  "STATUS_CHANGE",
  "USER_DELETE",
  "USER_CREATE",
  "USER_UPDATE",
  "LOGIN",
  "LOGOUT",
  "JOB_CREATE",
  "JOB_UPDATE",
  "JOB_DELETE",
  "APPLICATION_SUBMIT",
  "APPLICATION_UPDATE",
];

// Log admin action for audit trail
const logAction = async (req, res) => {
  try {
    const { action, targetUserId, details } = req.body;
    const performedBy = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    if (!action) {
      return res.status(400).json({
        success: false,
        error: "Action is required",
      });
    }

    if (!VALID_AUDIT_ACTIONS.includes(action)) {
      return res.status(400).json({
        success: false,
        error: `Invalid audit action: "${action}". Valid actions are: ${VALID_AUDIT_ACTIONS.join(", ")}`,
      });
    }

    const auditLog = await Audit.create({
      action,
      targetUserId: targetUserId ? parseInt(targetUserId, 10) : null,
      performedBy,
      details,
      ipAddress,
      userAgent,
    });

    res.status(201).json({
      success: true,
      data: auditLog,
    });
  } catch (error) {
    console.error("Error logging audit action:", error);
    res.status(500).json({
      success: false,
      error: "Failed to log audit action",
    });
  }
};

// Get audit logs for admin dashboard
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action = "",
      userId = "",
      startDate = "",
      endDate = "",
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    const whereClause = {};

    // Build search conditions
    if (action && action !== "all") {
      whereClause.action = action.trim();
    }

    if (userId && userId !== "all") {
      const parsedUserId = parseInt(userId, 10);
      if (!isNaN(parsedUserId)) {
        whereClause[Op.or] = [
          { targetUserId: parsedUserId },
          { performedBy: parsedUserId },
        ];
      }
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const safeSortBy = ["createdAt", "action", "id"].includes(sortBy)
      ? sortBy
      : "createdAt";
    const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { count, rows: logs } = await Audit.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [[safeSortBy, safeSortOrder]],
      include: [
        {
          model: User,
          as: "performedByUser",
          attributes: ["id", "name", "email", "role"],
          foreignKey: "performedBy",
        },
        {
          model: User,
          as: "targetUser",
          attributes: ["id", "name", "email", "role"],
          foreignKey: "targetUserId",
        },
      ],
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(count / limitNum) || 1,
          totalLogs: count,
          hasNext: pageNum * limitNum < count,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch audit logs",
    });
  }
};

// Get user activity history
const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      startDate = "",
      endDate = "",
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    const parsedUserId = parseInt(userId, 10);

    const whereClause = {
      [Op.or]: [{ targetUserId: parsedUserId }, { performedBy: parsedUserId }],
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const safeSortBy = ["createdAt", "action", "id"].includes(sortBy)
      ? sortBy
      : "createdAt";
    const safeSortOrder = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const { count, rows: activities } = await Audit.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [[safeSortBy, safeSortOrder]],
      include: [
        {
          model: User,
          as: "performedByUser",
          attributes: ["id", "name", "email", "role"],
          foreignKey: "performedBy",
        },
        {
          model: User,
          as: "targetUser",
          attributes: ["id", "name", "email", "role"],
          foreignKey: "targetUserId",
        },
      ],
    });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(count / limitNum) || 1,
          totalActivities: count,
          hasNext: pageNum * limitNum < count,
          hasPrev: pageNum > 1,
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

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    // Get action breakdown
    const actionStats = await Audit.findAll({
      attributes: [
        "action",
        [Audit.sequelize.fn("COUNT", Audit.sequelize.col("id")), "count"],
      ],
      group: ["action"],
    });

    // Get recent activities (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const recentActivity = await Audit.findAll({
      where: {
        createdAt: {
          [Op.gte]: twentyFourHoursAgo,
        },
      },
      include: [
        {
          model: User,
          as: "performedByUser",
          attributes: ["id", "name", "email", "role"],
          foreignKey: "performedBy",
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    // Get activity trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activityTrend = await Audit.findAll({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      attributes: [
        [Audit.sequelize.fn("DATE", Audit.sequelize.col("createdAt")), "date"],
        [Audit.sequelize.fn("COUNT", Audit.sequelize.col("id")), "count"],
      ],
      group: [Audit.sequelize.fn("DATE", Audit.sequelize.col("createdAt"))],
      order: [
        [Audit.sequelize.fn("DATE", Audit.sequelize.col("createdAt")), "ASC"],
      ],
    });

    res.json({
      success: true,
      data: {
        actionStats: actionStats.map((stat) => ({
          action: stat.action,
          count: parseInt(stat.dataValues.count, 10),
        })),
        recentActivity,
        activityTrend: activityTrend.map((trend) => ({
          date: trend.dataValues.date,
          count: parseInt(trend.dataValues.count, 10),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch system stats",
    });
  }
};

// Export audit logs
const exportLogs = async (req, res) => {
  try {
    const { action, userId, startDate, endDate, format = "csv" } = req.query;

    const whereClause = {};

    if (action && action !== "all") {
      whereClause.action = action.trim();
    }

    if (userId && userId !== "all") {
      const parsedUserId = parseInt(userId, 10);
      if (!isNaN(parsedUserId)) {
        whereClause[Op.or] = [
          { targetUserId: parsedUserId },
          { performedBy: parsedUserId },
        ];
      }
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate && !isNaN(new Date(startDate).getTime())) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const logs = await Audit.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "performedByUser",
          attributes: ["id", "name", "email", "role"],
          foreignKey: "performedBy",
        },
        {
          model: User,
          as: "targetUser",
          attributes: ["id", "name", "email", "role"],
          foreignKey: "targetUserId",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (format === "csv") {
      // Convert to RFC 4180 CSV
      const csvHeaders = [
        "ID",
        "Action",
        "Target User",
        "Performed By",
        "Details",
        "IP Address",
        "Created At",
      ];

      const escapeCsvField = (field) => {
        if (field === null || field === undefined) return '""';
        return `"${String(field).replace(/"/g, '""')}"`;
      };

      const csvRows = logs.map((log) => [
        log.id,
        log.action,
        log.targetUser
          ? `${log.targetUser.name} (${log.targetUser.email})`
          : "N/A",
        log.performedByUser
          ? `${log.performedByUser.name} (${log.performedByUser.email})`
          : "N/A",
        log.details || "",
        log.ipAddress || "",
        log.createdAt ? log.createdAt.toISOString() : "",
      ]);

      const csvContent = [
        csvHeaders.map(escapeCsvField).join(","),
        ...csvRows.map((row) => row.map(escapeCsvField).join(",")),
      ].join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-logs-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );
      res.send(csvContent);
    } else {
      res.json({
        success: true,
        data: logs,
      });
    }
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export audit logs",
    });
  }
};

module.exports = {
  logAction,
  getAuditLogs,
  getUserActivity,
  getSystemStats,
  exportLogs,
};
