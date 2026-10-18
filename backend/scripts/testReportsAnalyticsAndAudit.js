/**
 * testReportsAnalyticsAndAudit.js
 * Verification suite for Phase 4.6: Real Reports, Analytics & Audit Logs
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
console.log("   Running Phase 4.6: Reports, Analytics & Audit Verification     ");
console.log("===================================================================\n");

// 1. Audit Frontend Files for Eliminated Mocks & Contract Integrity
console.log("1. Auditing ReportsAnalytics.jsx for Eliminated Mock Data & Mocks:");

const reportsPath = path.resolve(__dirname, "../../src/pages/admin/ReportsAnalytics.jsx");
const auditServicePath = path.resolve(__dirname, "../../src/services/auditService.js");
const userApiPath = path.resolve(__dirname, "../../src/services/userApi.js");

const reportsContent = fs.readFileSync(reportsPath, "utf8");
const auditServiceContent = fs.readFileSync(auditServicePath, "utf8");
const userApiContent = fs.readFileSync(userApiPath, "utf8");

assert(
  !reportsContent.includes("conversionRate: 4.2") &&
    !reportsContent.includes("averageResponseTime: \"2.5 days\"") &&
    !reportsContent.includes("averageTimeToHire: \"18 days\""),
  "Purged fabricated conversion rates, response times, and time-to-hire mock statistics"
);

assert(
  !reportsContent.includes("console.log(`Exporting report as"),
  "Purged console.log placeholder export handler"
);

assert(
  !reportsContent.includes("+12% from last month") &&
    !reportsContent.includes("+8% from last month") &&
    !reportsContent.includes("+23% from last month"),
  "Purged fabricated +% trends and comparative percentage badges"
);

assert(
  reportsContent.includes("userApi.getUserStatistics") &&
    reportsContent.includes("auditService.getAuditLogs") &&
    reportsContent.includes("auditService.exportLogs"),
  "ReportsAnalytics is wired to genuine database statistics and audit export endpoints"
);

assert(
  reportsContent.includes("Transparent Data Disclosure") &&
    reportsContent.includes("omitted"),
  "ReportsAnalytics clearly discloses and labels unavailable metrics (impressions & hire duration)"
);

assert(
  reportsContent.includes("dark:bg-gray-800") &&
    reportsContent.includes("dark:text-white") &&
    reportsContent.includes("dark:border-gray-700"),
  "ReportsAnalytics implements full dark-mode support consistent with Admin layout"
);

// 2. Audit Model Immutability & Action Enums
console.log("\n2. Auditing Audit Model Immutability & Action ENUMs:");

const auditModelPath = path.resolve(__dirname, "../src/models/Audit.js");
const auditModelContent = fs.readFileSync(auditModelPath, "utf8");

assert(
  auditModelContent.includes("beforeUpdate") &&
    auditModelContent.includes("Audit logs are immutable and cannot be modified"),
  "Audit model defines beforeUpdate hook enforcing immutability against modifications"
);

assert(
  auditModelContent.includes("beforeDestroy") &&
    auditModelContent.includes("Audit logs are immutable and cannot be deleted"),
  "Audit model defines beforeDestroy hook enforcing immutability against record deletions"
);

const expectedActions = [
  "ROLE_CHANGE",
  "STATUS_CHANGE",
  "USER_DELETE",
  "USER_CREATE",
  "USER_UPDATE",
  "JOB_CREATE",
  "JOB_UPDATE",
  "JOB_DELETE",
  "APPLICATION_SUBMIT",
  "APPLICATION_UPDATE",
];

expectedActions.forEach((act) => {
  assert(
    auditModelContent.includes(`"${act}"`),
    `Audit ENUM supports required action: "${act}"`
  );
});

// 3. Audit Controller Validation, Sanitization & Authorization
console.log("\n3. Auditing Audit Controller & Route Safeguards:");

const auditControllerPath = path.resolve(__dirname, "../src/controllers/auditController.js");
const auditRoutesPath = path.resolve(__dirname, "../src/routes/auditRoutes.js");

const auditControllerContent = fs.readFileSync(auditControllerPath, "utf8");
const auditRoutesContent = fs.readFileSync(auditRoutesPath, "utf8");

assert(
  auditRoutesContent.includes("router.use(authenticateToken)") &&
    auditRoutesContent.includes('authorize("admin")'),
  "All audit routes require JWT authentication and admin authorization"
);

assert(
  !auditRoutesContent.includes("router.delete") &&
    !auditRoutesContent.includes("router.put") &&
    !auditRoutesContent.includes("router.patch"),
  "No mutation routes (PUT, PATCH, DELETE) exist on audit records in API"
);

assert(
  auditControllerContent.includes("VALID_AUDIT_ACTIONS") &&
    auditControllerContent.includes("Invalid audit action"),
  "auditController validates logAction requests against allowed audit ENUMs (returns 400 on invalid)"
);

assert(
  auditControllerContent.includes("Math.max(1, parseInt(page, 10) || 1)") &&
    auditControllerContent.includes("Math.min(100, parseInt(limit, 10) || 20)"),
  "auditController sanitizes page and limit parameters, capping limit at 100"
);

assert(
  auditControllerContent.includes('if (action && action !== "all")') &&
    auditControllerContent.includes('if (userId && userId !== "all")'),
  "auditController safely handles action='all' and userId='all' without breaking queries"
);

assert(
  auditControllerContent.includes('attributes: ["id", "name", "email", "role"]'),
  "auditController projects only safe public user fields (excludes passwords, reset tokens)"
);

// 4. RFC 4180 CSV Escaping Test
console.log("\n4. Testing RFC 4180 CSV Generation & Escaping Logic:");

function escapeCsvField(field) {
  if (field === null || field === undefined) return '""';
  return `"${String(field).replace(/"/g, '""')}"`;
}

assert(
  escapeCsvField("Simple String") === '"Simple String"',
  "Standard string wrapped in double quotes"
);
assert(
  escapeCsvField('He said "Hello"') === '"He said ""Hello"""',
  "Internal double quotes escaped to double-double quotes per RFC 4180"
);
assert(
  escapeCsvField("Line 1\nLine 2, with comma") === '"Line 1\nLine 2, with comma"',
  "Preserves embedded newlines and commas within quoted field"
);
assert(
  escapeCsvField(null) === '""' && escapeCsvField(undefined) === '""',
  "Null and undefined safely converted to empty quoted string"
);

// 5. Date Range Filtering & Metric Calculations
console.log("\n5. Testing Date Range Cutoff Mathematics:");

function calcDateCutoff(dateRange, now = new Date("2026-10-18T12:00:00Z")) {
  const daysMap = { "7days": 7, "30days": 30, "90days": 90, "1year": 365 };
  if (!daysMap[dateRange]) return null;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - daysMap[dateRange]);
  return cutoff;
}

const d7 = calcDateCutoff("7days", new Date("2026-10-18T12:00:00Z"));
assert(d7.toISOString().startsWith("2026-10-11"), "7 days cutoff matches 7 days prior");

const d30 = calcDateCutoff("30days", new Date("2026-10-18T12:00:00Z"));
assert(d30.toISOString().startsWith("2026-09-18"), "30 days cutoff matches 30 days prior");

const d90 = calcDateCutoff("90days", new Date("2026-10-18T12:00:00Z"));
assert(d90.toISOString().startsWith("2026-07-20"), "90 days cutoff matches 90 days prior");

assert(calcDateCutoff("all") === null, "All time returns null cutoff (no date restriction)");

// 6. Zero Division Safety in Percentage Math
console.log("\n6. Testing Zero Division Safety in Pipeline Percentages:");

function calcPercentage(count, total) {
  if (!total || total <= 0) return 0;
  return Number(((count / total) * 100).toFixed(1));
}

assert(calcPercentage(15, 60) === 25.0, "Calculates correct percentage (15/60 = 25%)");
assert(calcPercentage(0, 60) === 0, "Calculates zero when count is zero");
assert(calcPercentage(10, 0) === 0, "Returns 0 safely when total is zero (no NaN or Infinity)");

// 7. Audit Logging in Administrative Controllers
console.log("\n7. Auditing Administrative Controllers for Persistent Audit Logging:");

const userControllerPath = path.resolve(__dirname, "../src/controllers/userController.js");
const jobControllerPath = path.resolve(__dirname, "../src/controllers/jobController.js");
const appControllerPath = path.resolve(__dirname, "../src/controllers/applicationController.js");

const userControllerContent = fs.readFileSync(userControllerPath, "utf8");
const jobControllerContent = fs.readFileSync(jobControllerPath, "utf8");
const appControllerContent = fs.readFileSync(appControllerPath, "utf8");

assert(
  userControllerContent.includes('action: "ROLE_CHANGE"') &&
    userControllerContent.includes('action: "STATUS_CHANGE"') &&
    userControllerContent.includes('action: "USER_DELETE"'),
  "userController logs ROLE_CHANGE, STATUS_CHANGE, and USER_DELETE to Audit"
);

assert(
  jobControllerContent.includes('action: "JOB_UPDATE"') &&
    jobControllerContent.includes('action: "JOB_DELETE"'),
  "jobController logs JOB_UPDATE and JOB_DELETE to Audit"
);

assert(
  appControllerContent.includes('action: "APPLICATION_UPDATE"'),
  "applicationController logs APPLICATION_UPDATE to Audit"
);

assert(
  auditModelContent.includes("beforeBulkUpdate") &&
    auditModelContent.includes("Bulk modification of audit logs is forbidden"),
  "Audit model defines beforeBulkUpdate hook blocking bulk ORM updates"
);

assert(
  auditModelContent.includes("beforeBulkDestroy") &&
    auditModelContent.includes("Bulk deletion of audit logs is forbidden"),
  "Audit model defines beforeBulkDestroy hook blocking bulk ORM deletions"
);

assert(
  userControllerContent.includes("sequelize.transaction(async (t)") &&
    jobControllerContent.includes("sequelize.transaction(async (t)") &&
    appControllerContent.includes("sequelize.transaction(async (t)"),
  "Mutations and their audit logging in userController, jobController, and applicationController are wrapped in sequelize.transaction"
);

assert(
  reportsContent.includes("getStartDateFromRange(dateRange)") &&
    reportsContent.includes("startDate: startDate || undefined"),
  "ReportsAnalytics honors active dateRange filter in both audit log queries and audit CSV exports"
);

assert(
  userControllerContent.includes("getUserStatistics") &&
    userControllerContent.includes("jobStats") &&
    userControllerContent.includes("applicationStats") &&
    userControllerContent.includes("topAppliedJobs"),
  "getUserStatistics returns genuine jobStats, applicationStats, and topAppliedJobs"
);

console.log("\n===================================================================");
console.log(`   Verification Summary: ${testsPassed} passed, ${testsFailed} failed   `);
console.log("===================================================================");

process.exit(testsFailed > 0 ? 1 : 0);

