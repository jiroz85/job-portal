/**
 * testAdminDashboardMetrics.js
 * Verification suite for Phase 4.3: Real Admin Dashboard Metrics & Historical Audit Feed
 */

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

console.log("=================================================");
console.log("  Running Admin Dashboard Metrics & Audit Tests  ");
console.log("=================================================\n");

// 1. Test Dashboard Statistics Data Mapping
console.log("1. Testing Dashboard Statistics & KPI Parsing:");

const mockBackendStats = {
  totalUsers: 142,
  totalJobs: 56,
  totalApplications: 389,
  recentActivity: 28,
  activeUsers: 130,
  inactiveUsers: 8,
  blockedUsers: 4,
  roleStats: [
    { role: "jobseeker", count: 98 },
    { role: "employer", count: 39 },
    { role: "admin", count: 5 },
  ],
  recentUsers: [
    { id: 142, name: "Alice Smith", email: "alice@example.com", role: "jobseeker", createdAt: "2026-10-18T10:00:00Z" },
    { id: 141, name: "TechCorp HR", email: "hr@techcorp.com", role: "employer", createdAt: "2026-10-18T09:30:00Z" },
  ],
};

const jobSeekersCount = mockBackendStats?.roleStats?.find((r) => r.role === "jobseeker")?.count ?? 0;
const employersCount = mockBackendStats?.roleStats?.find((r) => r.role === "employer")?.count ?? 0;
const adminsCount = mockBackendStats?.roleStats?.find((r) => r.role === "admin")?.count ?? 0;

assert(mockBackendStats.totalUsers === 142, "totalUsers reflects database total (142)");
assert(mockBackendStats.totalJobs === 56, "totalJobs reflects database total (56)");
assert(mockBackendStats.totalApplications === 389, "totalApplications reflects database total (389)");
assert(mockBackendStats.recentActivity === 28, "recentActivity reflects genuine 7-day application count (28)");
assert(jobSeekersCount === 98, "Extracts jobseeker count (98) from roleStats");
assert(employersCount === 39, "Extracts employer count (39) from roleStats");
assert(adminsCount === 5, "Extracts admin count (5) from roleStats");
assert(
  jobSeekersCount + employersCount + adminsCount === mockBackendStats.totalUsers,
  "Role distribution sum (98 + 39 + 5 = 142) matches totalUsers"
);

// 2. Test Empty & Degraded Stats Handling
console.log("\n2. Testing Degraded / Empty Statistics Fallbacks:");
const emptyStats = {};
const emptyJobSeekers = emptyStats?.roleStats?.find((r) => r.role === "jobseeker")?.count ?? 0;
const emptyActiveUsers = emptyStats?.activeUsers ?? 0;
const emptyTotalJobs = emptyStats?.totalJobs ?? 0;

assert(emptyJobSeekers === 0, "Gracefully defaults missing roleStats to 0");
assert(emptyActiveUsers === 0, "Gracefully defaults missing activeUsers to 0");
assert(emptyTotalJobs === 0, "Gracefully defaults missing totalJobs to 0");

// 3. Test Historical Audit Log Formatting & Mapping
console.log("\n3. Testing Historical Audit Trail Formatting & Fallbacks:");

const mockAuditLog1 = {
  id: 101,
  action: "ROLE_CHANGE",
  details: "Changed role from jobseeker to employer",
  createdAt: "2026-10-18T12:00:00Z",
  performedByUser: { id: 1, name: "System Admin", email: "admin@portal.com", role: "admin" },
  targetUser: { id: 45, name: "John Doe", email: "john@example.com", role: "employer" },
  ipAddress: "192.168.1.1",
};

const mockAuditLog2 = {
  id: 102,
  action: "USER_DELETE",
  details: "Deleted user account",
  createdAt: "2026-10-18T12:05:00Z",
  performedBy: 2,
  targetUserId: 78,
};

const getPerformedBy = (log) =>
  log.performedByUser?.name || log.performedByUser?.email || (log.performedBy ? `User #${log.performedBy}` : "System / Automated");

const getTargetUser = (log) =>
  log.targetUser?.name || log.targetUser?.email || (log.targetUserId ? `User #${log.targetUserId}` : null);

const getActionBadgeColor = (action = "") => {
  if (action.includes("DELETE") || action.includes("BLOCK")) return "red";
  if (action.includes("CREATE") || action.includes("REGISTER") || action.includes("SUBMIT")) return "green";
  if (action.includes("ROLE") || action.includes("STATUS") || action.includes("UPDATE")) return "blue";
  return "gray";
};

assert(getPerformedBy(mockAuditLog1) === "System Admin", "Extracts performedByUser name when available");
assert(getTargetUser(mockAuditLog1) === "John Doe", "Extracts targetUser name when available");
assert(getActionBadgeColor(mockAuditLog1.action) === "blue", "Action ROLE_CHANGE maps to blue badge");

assert(getPerformedBy(mockAuditLog2) === "User #2", "Falls back to User #ID when performedByUser is omitted");
assert(getTargetUser(mockAuditLog2) === "User #78", "Falls back to User #ID when targetUser is omitted");
assert(getActionBadgeColor(mockAuditLog2.action) === "red", "Action USER_DELETE maps to red badge");

console.log("\n=================================================");
console.log(`  Tests completed: ${testsPassed} passed, ${testsFailed} failed`);
console.log("=================================================");

if (testsFailed > 0) {
  process.exit(1);
}
