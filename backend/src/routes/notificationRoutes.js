const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticateToken, authorize } = require("../middleware/auth");

// All notification operations require authentication
router.use(authenticateToken);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/mark-all-read", notificationController.markAllAsRead);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/:id/unread", notificationController.markAsUnread);
router.delete("/clear-all", notificationController.clearAllNotifications);
router.delete("/:id", notificationController.deleteNotification);
router.post("/", notificationController.createNotification);

module.exports = router;
