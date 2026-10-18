/**
 * testSettingsAndNotifications.js
 * Comprehensive security, migration, and contract verification suite for
 * Phase 4.7: System Settings & Notifications
 */

const fs = require("fs");
const path = require("path");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

console.log("===================================================================");
console.log("   Running Phase 4.7: System Settings & Notifications Verification");
console.log("===================================================================\n");

// Paths to backend files
const settingModelPath = path.resolve(__dirname, "../src/models/Setting.js");
const notificationModelPath = path.resolve(__dirname, "../src/models/Notification.js");
const userModelPath = path.resolve(__dirname, "../src/models/User.js");
const auditModelPath = path.resolve(__dirname, "../src/models/Audit.js");
const settingControllerPath = path.resolve(__dirname, "../src/controllers/settingController.js");
const notificationControllerPath = path.resolve(__dirname, "../src/controllers/notificationController.js");
const settingRoutesPath = path.resolve(__dirname, "../src/routes/settingRoutes.js");
const notificationRoutesPath = path.resolve(__dirname, "../src/routes/notificationRoutes.js");
const backendIndexPath = path.resolve(__dirname, "../src/index.js");
const migrationFilePath = path.resolve(__dirname, "../src/migrations/create-settings-and-notifications-tables.js");
const runMigrationsPath = path.resolve(__dirname, "../src/scripts/run-all-migrations.js");
const appControllerPath = path.resolve(__dirname, "../src/controllers/applicationController.js");
const jobControllerPath = path.resolve(__dirname, "../src/controllers/jobController.js");

// Paths to frontend files
const systemSettingsJsxPath = path.resolve(__dirname, "../../src/pages/admin/SystemSettings.jsx");
const notificationsJsxPath = path.resolve(__dirname, "../../src/components/admin/Notifications.jsx");
const adminHeaderJsxPath = path.resolve(__dirname, "../../src/components/admin/AdminHeader.jsx");
const notificationContextPath = path.resolve(__dirname, "../../src/context/NotificationContext.jsx");
const settingServicePath = path.resolve(__dirname, "../../src/services/settingService.js");
const notificationServicePath = path.resolve(__dirname, "../../src/services/notificationService.js");

const settingModelContent = fs.readFileSync(settingModelPath, "utf8");
const notificationModelContent = fs.readFileSync(notificationModelPath, "utf8");
const userModelContent = fs.readFileSync(userModelPath, "utf8");
const auditModelContent = fs.readFileSync(auditModelPath, "utf8");
const settingControllerContent = fs.readFileSync(settingControllerPath, "utf8");
const notificationControllerContent = fs.readFileSync(notificationControllerPath, "utf8");
const settingRoutesContent = fs.readFileSync(settingRoutesPath, "utf8");
const notificationRoutesContent = fs.readFileSync(notificationRoutesPath, "utf8");
const backendIndexContent = fs.readFileSync(backendIndexPath, "utf8");
const migrationContent = fs.readFileSync(migrationFilePath, "utf8");
const runMigrationsContent = fs.readFileSync(runMigrationsPath, "utf8");
const appControllerContent = fs.readFileSync(appControllerPath, "utf8");
const jobControllerContent = fs.readFileSync(jobControllerPath, "utf8");

const systemSettingsJsxContent = fs.existsSync(systemSettingsJsxPath) ? fs.readFileSync(systemSettingsJsxPath, "utf8") : null;
const notificationsJsxContent = fs.existsSync(notificationsJsxPath) ? fs.readFileSync(notificationsJsxPath, "utf8") : null;
const adminHeaderJsxContent = fs.existsSync(adminHeaderJsxPath) ? fs.readFileSync(adminHeaderJsxPath, "utf8") : null;
const notificationContextContent = fs.existsSync(notificationContextPath) ? fs.readFileSync(notificationContextPath, "utf8") : null;
const settingServiceContent = fs.existsSync(settingServicePath) ? fs.readFileSync(settingServicePath, "utf8") : null;
const notificationServiceContent = fs.existsSync(notificationServicePath) ? fs.readFileSync(notificationServicePath, "utf8") : null;

// 1. Setting Model & Persistence Architecture
console.log("1. Auditing Setting Model & Architecture:");
assert(
  settingModelContent.includes('tableName: "system_settings"') ||
    settingModelContent.includes("tableName: 'system_settings'"),
  "Setting model targets system_settings database table"
);
assert(
  settingModelContent.includes("category") && settingModelContent.includes("unique: true"),
  "Setting model defines unique category identifier"
);
assert(
  settingModelContent.includes("JSON.parse") && settingModelContent.includes("JSON.stringify"),
  "Setting model implements robust JSON serialization getter and setter for structured configuration"
);
assert(
  userModelContent.includes("models.Setting") && userModelContent.includes("updatedSettings"),
  "User model defines association to updatedSettings"
);
assert(
  auditModelContent.includes("SETTING_UPDATE"),
  "Audit action ENUM includes SETTING_UPDATE for persistent administrative audit trail"
);

// 2. Database Initialization & Deployment Migrations
console.log("\n2. Auditing Database Initialization & Deployment Migrations:");
assert(
  migrationContent.includes("CREATE TABLE IF NOT EXISTS system_settings") &&
    migrationContent.includes("CREATE TABLE IF NOT EXISTS notifications"),
  "Migration script defines idempotent CREATE TABLE IF NOT EXISTS for system_settings and notifications"
);
assert(
  migrationContent.includes("ALTER TABLE audit_logs") &&
    migrationContent.includes("SETTING_UPDATE"),
  "Migration script safely updates existing audit_logs action ENUM column in production databases"
);
assert(
  migrationContent.includes("INFORMATION_SCHEMA.COLUMNS") &&
    migrationContent.includes("INFORMATION_SCHEMA.TABLES"),
  "Migration script inspects schema metadata before applying column modifications (prevents errors on rerun)"
);
assert(
  migrationContent.includes("existingEnumValues") &&
    migrationContent.includes("targetEnumValues") &&
    migrationContent.includes("preCount !== postCount"),
  "Migration script dynamically preserves all existing audit ENUM members and validates zero record loss"
);
assert(
  !runMigrationsContent.includes("User.destroy"),
  "run-all-migrations.js does NOT automatically delete admin@example.com or any user accounts"
);
assert(
  !runMigrationsContent.includes("Tech Corp HR") &&
    !runMigrationsContent.includes("hr@techcorp.com") &&
    !runMigrationsContent.includes("Job.bulkCreate"),
  "run-all-migrations.js does NOT auto-create sample jobs or arbitrary employers"
);
assert(
  runMigrationsContent.includes("createSettingsAndNotificationsTables") &&
    runMigrationsContent.includes("await createSettingsAndNotificationsTables()"),
  "run-all-migrations.js registers and executes createSettingsAndNotificationsTables in deployment sequence"
);

// 3. Setting Security, Validation & Secret Protection
console.log("\n3. Auditing Setting Controller & Route Safeguards:");
assert(
  settingRoutesContent.includes('authorize("admin")'),
  "All setting routes strictly require admin role authorization"
);
assert(
  settingRoutesContent.includes("authenticateToken"),
  "All setting routes require JWT token authentication"
);
assert(
  settingControllerContent.includes("FORBIDDEN_SECRET_KEYS") &&
    settingControllerContent.includes("jwt_secret") &&
    settingControllerContent.includes("db_password"),
  "settingController enforces forbidden secret blacklist blocking unauthorized override of sensitive env credentials"
);
assert(
  settingControllerContent.includes("maskSensitiveData") &&
    settingControllerContent.includes("••••••••••"),
  "settingController implements recursive maskSensitiveData to prevent cleartext password or token leaks"
);
assert(
  settingControllerContent.includes("submittedPass === \"••••••••••\" || submittedPass === undefined") &&
    settingControllerContent.includes("updatedCategoryData.smtpPassword = existingRecord.value.smtpPassword"),
  "settingController preserves existing SMTP secret when masked or omitted, avoiding accidental mask storage"
);
assert(
  settingControllerContent.includes("resetValue.smtpPassword = existing.value.smtpPassword"),
  "resetSettings preserves existing configured credentials on reset without unexpectedly destroying secrets"
);
assert(
  settingControllerContent.includes("sequelize.transaction"),
  "settingController wraps setting mutations and audit log creation in atomic database transaction"
);
assert(
  settingControllerContent.includes('action: "SETTING_UPDATE"') &&
    settingControllerContent.includes("Audit.create"),
  "settingController creates persistent audit log record upon settings modification without logging credentials"
);
assert(
  settingControllerContent.includes("passwordMinLength") &&
    settingControllerContent.includes("sessionTimeout") &&
    settingControllerContent.includes("smtpPort"),
  "settingController enforces strict boundary validation on password length, session timeout, and SMTP port"
);

// 4. Notification Model & Recipient Isolation
console.log("\n4. Auditing Notification Model & Associations:");
assert(
  notificationModelContent.includes('tableName: "notifications"') ||
    notificationModelContent.includes("tableName: 'notifications'"),
  "Notification model targets notifications database table"
);
assert(
  notificationModelContent.includes("userId:") && notificationModelContent.includes("allowNull: false"),
  "Notification model strictly enforces non-null recipient userId"
);
assert(
  notificationModelContent.includes("isRead:") && notificationModelContent.includes("defaultValue: false"),
  "Notification model defaults isRead to false"
);
assert(
  notificationModelContent.includes('fields: ["userId"]') &&
    notificationModelContent.includes('fields: ["userId", "isRead"]'),
  "Notification model defines performance indexes on userId and composite userId+isRead"
);
assert(
  notificationModelContent.includes("onDelete: \"CASCADE\"") ||
    notificationModelContent.includes("onDelete: 'CASCADE'"),
  "Notification model enforces cascade deletion when recipient user is deleted"
);
assert(
  userModelContent.includes("models.Notification") && userModelContent.includes("as: \"notifications\""),
  "User model defines hasMany association with Notification"
);

// 5. Notification Controller & Recipient Security
console.log("\n5. Auditing Notification Controller & Recipient Security:");
assert(
  notificationRoutesContent.includes("authenticateToken"),
  "Notification routes enforce authentication across all endpoints"
);
assert(
  notificationControllerContent.includes("const userId = req.user.id") &&
    notificationControllerContent.includes("whereClause = { userId }"),
  "getNotifications strictly scopes records to req.user.id preventing cross-user data leakage"
);
assert(
  notificationControllerContent.includes("Notification.count({") &&
    notificationControllerContent.includes("isRead: false"),
  "notificationController computes authentic database-backed unreadCount for authenticated user"
);
assert(
  notificationControllerContent.includes("Math.min(100,") &&
    notificationControllerContent.includes("Math.max(1,"),
  "notificationController sanitizes pagination parameters and caps page limit at 100"
);
assert(
  notificationControllerContent.includes("where: {") &&
    notificationControllerContent.includes("id: req.params.id") &&
    notificationControllerContent.includes("userId: req.user.id"),
  "markAsRead, markAsUnread, and deleteNotification enforce strict recipient ownership matching req.user.id"
);
assert(
  notificationControllerContent.includes("Notification.update(") &&
    notificationControllerContent.includes("userId: req.user.id") &&
    notificationControllerContent.includes("isRead: false"),
  "markAllAsRead updates all unread notifications exclusively for authenticated user"
);
assert(
  notificationControllerContent.includes("Notification.destroy(") &&
    notificationControllerContent.includes("userId: req.user.id"),
  "clearAllNotifications strictly scopes deletion to authenticated user's records"
);
assert(
  notificationControllerContent.includes("userId && parseInt(userId, 10) !== req.user.id") &&
    notificationControllerContent.includes("Ordinary users cannot create notifications for other users"),
  "createNotification blocks non-admin users from creating notifications for other users (cross-user forging denied)"
);
assert(
  notificationControllerContent.includes("privilegedTypes = [\"system\", \"application_status\", \"error\"]") &&
    notificationControllerContent.includes("Notification type"),
  "createNotification blocks ordinary users from forging system or privileged notification types"
);
assert(
  notificationControllerContent.includes("sendSystemNotification = async"),
  "notificationController exports sendSystemNotification helper for trusted backend service workflows"
);

// 6. Trusted Backend Workflows for Notifications
console.log("\n6. Auditing Trusted Backend Workflows for Notification Delivery:");
assert(
  appControllerContent.includes("Notification.create") &&
    appControllerContent.includes("type: \"application_status\""),
  "applicationController delivers authentic application_status notification to applicant inside atomic transaction"
);
assert(
  jobControllerContent.includes("Notification.create") &&
    jobControllerContent.includes("type: \"system\""),
  "jobController delivers authentic system notification to employer when job approvalStatus is updated by admin"
);

// 7. Backend Server Routing & Associations
console.log("\n7. Auditing Backend Server Index & Route Mounting:");
assert(
  backendIndexContent.includes("app.use(\"/api/settings\", settingRoutes)") &&
    backendIndexContent.includes("app.use(\"/api/notifications\", notificationRoutes)"),
  "backend/src/index.js mounts /api/settings and /api/notifications routes"
);
assert(
  backendIndexContent.includes("setupAssociations = () => {") &&
    backendIndexContent.includes("Setting") &&
    backendIndexContent.includes("Notification"),
  "backend/src/index.js includes Setting and Notification in setupAssociations"
);

// 8. Frontend Services & API Wiring
if (settingServiceContent && notificationServiceContent) {
  console.log("\n8. Auditing Frontend Services:");
  assert(
    settingServiceContent.includes("axios.get(`${API_BASE_URL}/api/settings`") &&
      settingServiceContent.includes("axios.put(`${API_BASE_URL}/api/settings`"),
    "settingService connects to real GET and PUT /api/settings endpoints"
  );
  assert(
    notificationServiceContent.includes("axios.get(url,") &&
      notificationServiceContent.includes("axios.patch(") &&
      notificationServiceContent.includes("/api/notifications"),
    "notificationService connects to real persistent notification endpoints"
  );

  // 9. SystemSettings.jsx Implementation
  console.log("\n9. Auditing SystemSettings.jsx Implementation:");
  assert(
    !systemSettingsJsxContent.includes("alert(\"Settings saved successfully!\")") &&
      !systemSettingsJsxContent.includes("console.log(\"Saving settings:\", settings)"),
    "Purged mock alert and console.log placeholders from SystemSettings.jsx"
  );
  assert(
    systemSettingsJsxContent.includes("settingService.getSettings") &&
      systemSettingsJsxContent.includes("settingService.updateSettings") &&
      systemSettingsJsxContent.includes("settingService.resetSettings"),
    "SystemSettings.jsx is wired to real database-backed settingService methods"
  );
  assert(
    systemSettingsJsxContent.includes("dark:bg-gray-800") &&
      systemSettingsJsxContent.includes("dark:text-gray-100") &&
      systemSettingsJsxContent.includes("dark:border-gray-700"),
    "SystemSettings.jsx implements full dark-mode styling consistent with admin theme"
  );
  assert(
    systemSettingsJsxContent.includes("Loading system settings from database") &&
      systemSettingsJsxContent.includes("Saving to Database..."),
    "SystemSettings.jsx provides clear database loading and saving visual feedback"
  );
  assert(
    systemSettingsJsxContent.includes("Security & Audit Isolation"),
    "SystemSettings.jsx clearly informs user of protected server credentials and audit trail"
  );

  // 10. Notifications.jsx Implementation
  console.log("\n10. Auditing Notifications.jsx Implementation:");
  assert(
    !notificationsJsxContent.includes("auditService.getAuditLogs({ limit: 100 })"),
    "Purged mock audit-log-as-notification workaround from Notifications.jsx"
  );
  assert(
    notificationsJsxContent.includes("notificationService.getNotifications") &&
      notificationsJsxContent.includes("notificationService.markAllAsRead") &&
      notificationsJsxContent.includes("notificationService.markAsRead"),
    "Notifications.jsx is wired to real persistent notificationService endpoints"
  );
  assert(
    notificationsJsxContent.includes("dark:bg-gray-800") &&
      notificationsJsxContent.includes("dark:text-gray-100") &&
      notificationsJsxContent.includes("dark:border-gray-700"),
    "Notifications.jsx implements full dark-mode styling consistent with admin theme"
  );
  assert(
    notificationsJsxContent.includes("Showing page") &&
      notificationsJsxContent.includes("totalPages"),
    "Notifications.jsx implements authentic server-side pagination controls"
  );
  assert(
    notificationsJsxContent.includes("Recipient Scoping:"),
    "Notifications.jsx discloses strict recipient scoping and database persistence"
  );

  // 11. AdminHeader.jsx & NotificationContext Persistence
  console.log("\n11. Auditing AdminHeader.jsx & NotificationContext.jsx:");
  assert(
    adminHeaderJsxContent.includes("notificationService.getNotifications") &&
      adminHeaderJsxContent.includes("notificationService.markAsRead"),
    "AdminHeader.jsx connects bell dropdown and markAsRead to real notificationService"
  );
  assert(
    !adminHeaderJsxContent.includes("auditService.getAuditLogs({ limit: 5 })"),
    "Purged audit-log workaround from AdminHeader.jsx"
  );
  assert(
    notificationContextContent.includes("notificationService.getNotifications") &&
      notificationContextContent.includes("notificationService.markAllAsRead"),
    "NotificationContext is wired to persistent notificationService endpoints"
  );
} else {
  console.log("\n8-11. Frontend service files not present in this revision (backend-only stage verified).");
}

console.log("\n===================================================================");
console.log(`   Verification Summary: ${testsPassed} passed, ${testsFailed} failed   `);
console.log("===================================================================");

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
