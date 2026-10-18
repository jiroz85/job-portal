const { Op } = require("sequelize");
const Notification = require("../models/Notification");
const User = require("../models/User");

// @desc    Get current user's notifications with pagination, filters, and unread count
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { filter, search, type, priority } = req.query;

    const whereClause = { userId };

    if (filter === "unread") {
      whereClause.isRead = false;
    } else if (filter === "read") {
      whereClause.isRead = true;
    }

    if (type && type !== "all") {
      whereClause.type = type;
    }

    if (priority && priority !== "all") {
      whereClause.priority = priority;
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { title: { [Op.like]: term } },
        { message: { [Op.like]: term } },
      ];
    }

    const { count: total, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const unreadCount = await Notification.count({
      where: { userId, isRead: false },
    });

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Failed to retrieve notifications" });
  }
};

// @desc    Get unread notification count for current user
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ success: false, error: "Failed to fetch unread count" });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    await notification.update({
      isRead: true,
      readAt: new Date(),
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, error: "Failed to update notification" });
  }
};

// @desc    Mark a single notification as unread
// @route   PATCH /api/notifications/:id/unread
// @access  Private
exports.markAsUnread = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    await notification.update({
      isRead: false,
      readAt: null,
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as unread:", error);
    res.status(500).json({ success: false, error: "Failed to update notification" });
  }
};

// @desc    Mark all user's notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const [updatedCount] = await Notification.update(
      {
        isRead: true,
        readAt: new Date(),
      },
      {
        where: {
          userId: req.user.id,
          isRead: false,
        },
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      data: { updatedCount },
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ success: false, error: "Failed to mark all as read" });
  }
};

// @desc    Delete a single notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, error: "Failed to delete notification" });
  }
};

// @desc    Clear all notifications for current user
// @route   DELETE /api/notifications/clear-all
// @access  Private
exports.clearAllNotifications = async (req, res) => {
  try {
    const deletedCount = await Notification.destroy({
      where: {
        userId: req.user.id,
      },
    });

    res.json({
      success: true,
      message: "All notifications cleared",
      data: { deletedCount },
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ success: false, error: "Failed to clear notifications" });
  }
};

// Internal backend helper for trusted system workflows (application status updates, job moderation, etc.)
exports.sendSystemNotification = async ({
  userId,
  title,
  message,
  type = "info",
  priority = "medium",
  link = null,
  metadata = null,
  transaction,
}) => {
  if (!userId || !title || !message) return null;
  try {
    return await Notification.create(
      {
        userId,
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        link,
        metadata,
      },
      transaction ? { transaction } : undefined
    );
  } catch (err) {
    console.error("Error creating system notification:", err);
    return null;
  }
};

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private (Admins can notify any user; Ordinary users can only create self-alerts and cannot forge system types)
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, priority, link, metadata } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Title is required and must be a non-empty string",
      });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required and must be a non-empty string",
      });
    }

    if (title.trim().length > 255) {
      return res.status(400).json({
        success: false,
        error: "Title must not exceed 255 characters",
      });
    }

    const isAdmin = req.user && req.user.role === "admin";
    let targetUserId = req.user.id;

    if (isAdmin) {
      if (userId) {
        targetUserId = parseInt(userId, 10);
        if (isNaN(targetUserId)) {
          return res.status(400).json({
            success: false,
            error: "Invalid recipient userId",
          });
        }
      }
    } else {
      // Non-admin security enforcement:
      // 1. Cannot target another user
      if (userId && parseInt(userId, 10) !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: Ordinary users cannot create notifications for other users",
        });
      }

      // 2. Cannot forge system or privileged notification types
      const privilegedTypes = ["system", "application_status", "error"];
      if (type && privilegedTypes.includes(type)) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Notification type "${type}" is restricted to system workflows and administrators`,
        });
      }
    }

    // Verify recipient user exists
    const recipient = await User.findByPk(targetUserId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: "Recipient user not found",
      });
    }

    // Validate notification type against allowed enum
    const validTypes = [
      "info",
      "success",
      "warning",
      "error",
      "job_alert",
      "application_status",
      "system",
    ];
    const finalType = type && validTypes.includes(type) ? type : "info";

    // Validate priority
    const validPriorities = ["low", "medium", "high"];
    const finalPriority = priority && validPriorities.includes(priority) ? priority : "medium";

    const notification = await Notification.create({
      userId: targetUserId,
      title: title.trim(),
      message: message.trim(),
      type: finalType,
      priority: finalPriority,
      link: link || null,
      metadata: metadata || null,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ success: false, error: "Failed to create notification" });
  }
};
