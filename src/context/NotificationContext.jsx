/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import notificationService from "../services/notificationService";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 50 });
      if (res.success && res.data) {
        const items = (res.data.notifications || []).map((n) => ({
          ...n,
          read: n.isRead,
          timestamp: n.createdAt || n.timestamp || new Date().toISOString(),
        }));
        setNotifications(items);
        setUnreadCount(res.data.unreadCount ?? items.filter((n) => !n.read).length);
      }
    } catch {
      // In case user is offline or backend unreachable, fallback safely
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Add a new notification
  const addNotification = async (notification) => {
    try {
      const res = await notificationService.createNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type || "info",
        priority: notification.priority || "medium",
        link: notification.link || null,
      });

      if (res.success && res.data) {
        const newItem = { ...res.data, read: res.data.isRead };
        setNotifications((prev) => [newItem, ...prev]);
        setUnreadCount((c) => c + 1);
        return newItem;
      }
    } catch {
      // Local fallback
      const fallback = {
        id: Date.now(),
        ...notification,
        isRead: false,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [fallback, ...prev]);
      setUnreadCount((c) => c + 1);
      return fallback;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.warn("Server markAsRead failed, updating locally:", err);
    }
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId
          ? { ...notif, isRead: true, read: true }
          : notif
      )
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.warn("Server markAllAsRead failed, updating locally:", err);
    }
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true, read: true }))
    );
    setUnreadCount(0);
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
    } catch (err) {
      console.warn("Server deleteNotification failed, updating locally:", err);
    }
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await notificationService.clearAllNotifications();
    } catch (err) {
      console.warn("Server clearAllNotifications failed, updating locally:", err);
    }
    setNotifications([]);
    setUnreadCount(0);
  };

  // Job alert notification
  const createJobAlert = (job, userSkills) => {
    const matchReason =
      job.title.toLowerCase().includes(userSkills.toLowerCase()) ||
      (job.requirements && job.requirements.toLowerCase().includes(userSkills.toLowerCase()));

    if (matchReason) {
      addNotification({
        type: "job_alert",
        title: "New Job Match!",
        message: `New job "${job.title}" at ${job.company} matches your profile`,
        link: `/jobs/${job.id}`,
        priority: "high",
      });
    }
  };

  // Application status update notification
  const createApplicationStatusNotification = (
    application,
    oldStatus,
    newStatus
  ) => {
    const statusMessages = {
      viewed: "Your application has been viewed by the employer",
      shortlisted:
        "Congratulations! You have been shortlisted for the position",
      rejected: "Unfortunately, your application was not selected",
      offered: "Congratulations! You have received a job offer",
    };

    addNotification({
      type: "application_status",
      title: "Application Status Updated",
      message:
        statusMessages[newStatus] ||
        `Your application status is now ${newStatus}`,
      link: `/applications`,
      priority: newStatus === "offered" ? "high" : "medium",
    });
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    refreshNotifications: fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createJobAlert,
    createApplicationStatusNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
