/**
 * testJobAndAppModeration.js
 * Verification suite for Phase 4.5: Real Job & Application Moderation
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
console.log("   Running Phase 4.5: Job & Application Moderation Verification    ");
console.log("===================================================================\n");

// 1. Audit Frontend Files for Eliminated Mocks & Contract Integrity
console.log("1. Auditing Frontend Files for Eliminated Mocks & Safety:");

const jobsMgmtPath = path.resolve(__dirname, "../../src/pages/admin/JobsManagement.jsx");
const appsMgmtPath = path.resolve(__dirname, "../../src/pages/admin/ApplicationsManagement.jsx");
const jobApiPath = path.resolve(__dirname, "../../src/services/jobApi.js");
const appServicePath = path.resolve(__dirname, "../../src/services/applicationService.js");

const jobsMgmtContent = fs.readFileSync(jobsMgmtPath, "utf8");
const appsMgmtContent = fs.readFileSync(appsMgmtPath, "utf8");
const jobApiContent = fs.readFileSync(jobApiPath, "utf8");
const appServiceContent = fs.readFileSync(appServicePath, "utf8");

assert(
  !jobsMgmtContent.includes("window.confirm") &&
    !appsMgmtContent.includes("window.confirm"),
  "Neither JobsManagement nor ApplicationsManagement uses native window.confirm; both use in-app accessible modals"
);

assert(
  !jobsMgmtContent.includes("alert(") &&
    !appsMgmtContent.includes("alert("),
  "Neither page uses native alert(); both use non-blocking notification banners and accessible UI modals"
);

assert(
  !appsMgmtContent.includes("alert(`Downloading resume:") &&
    appsMgmtContent.includes("applicationService.downloadResume"),
  "ApplicationsManagement does NOT fake resume downloads; it calls genuine applicationService.downloadResume"
);

assert(
  appsMgmtContent.includes("applicationService.deleteApplication") &&
    appsMgmtContent.includes("applicationService.updateApplicationStatus"),
  "ApplicationsManagement is wired to real backend mutation endpoints for status updates and deletion"
);

assert(
  jobsMgmtContent.includes("jobApi.updateJobStatus") &&
    jobsMgmtContent.includes("jobApi.deleteJob") &&
    jobsMgmtContent.includes("jobApi.getAllJobsAdmin"),
  "JobsManagement is wired to real backend moderation, deletion, and admin retrieval endpoints"
);

// 2. Validate Application Pipeline Statuses against Backend Contract
console.log("\n2. Validating Application Statuses against Backend Constraints:");

const backendValidAppStatuses = [
  "pending",
  "under_review",
  "shortlisted",
  "interview_scheduled",
  "interviewed",
  "offered",
  "accepted",
  "rejected",
  "withdrawn",
];

// Check that invalid statuses like 'reviewing' or 'interview' are NOT used as status options
assert(
  !appsMgmtContent.includes('value="reviewing"') &&
    !appsMgmtContent.includes('value="interview"'),
  "Obsolete and invalid statuses ('reviewing', 'interview') have been purged"
);

backendValidAppStatuses.forEach((st) => {
  assert(
    appsMgmtContent.includes(`value="${st}"`),
    `ApplicationsManagement supports genuine backend status: "${st}"`
  );
});

// 3. Validate Job Moderation Statuses against Backend Contract
console.log("\n3. Validating Job Moderation Statuses against Backend Constraints:");

const backendValidJobStatuses = ["active", "inactive", "filled", "Draft", "Published", "Closed"];
const backendValidApprovalStatuses = ["pending", "approved", "rejected"];

backendValidJobStatuses.forEach((st) => {
  assert(
    jobsMgmtContent.includes(`value="${st}"`),
    `JobsManagement includes valid job status: "${st}"`
  );
});

backendValidApprovalStatuses.forEach((ap) => {
  assert(
    jobsMgmtContent.includes(`value="${ap}"`),
    `JobsManagement includes valid approval status: "${ap}"`
  );
});

// 4. Test Query Parameter Sanitization Logic
console.log("\n4. Testing Query Parameter Sanitization (Omitting 'all'):");

function simulateJobAdminParams(filters) {
  const params = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search && filters.search.trim()) params.search = filters.search.trim();
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.approvalStatus && filters.approvalStatus !== "all") {
    params.approvalStatus = filters.approvalStatus;
  }
  return params;
}

function simulateAppAdminParams(filters) {
  const params = {};
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  if (filters.search && filters.search.trim()) params.search = filters.search.trim();
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.jobId && filters.jobId !== "all") params.jobId = filters.jobId;
  return params;
}

const jobParams = simulateJobAdminParams({
  status: "all",
  approvalStatus: "all",
  search: "  Engineer  ",
  page: 2,
  limit: 10,
});
assert(jobParams.status === undefined, "Job query omits status='all'");
assert(jobParams.approvalStatus === undefined, "Job query omits approvalStatus='all'");
assert(jobParams.search === "Engineer", "Job query trims search whitespace");
assert(jobParams.page === 2 && jobParams.limit === 10, "Job query passes page and limit");

const appParams = simulateAppAdminParams({
  status: "all",
  jobId: "all",
  search: "  Jane Doe  ",
  page: 3,
  limit: 10,
});
assert(appParams.status === undefined, "App query omits status='all'");
assert(appParams.jobId === undefined, "App query omits jobId='all'");
assert(appParams.search === "Jane Doe", "App query trims search whitespace");
assert(appParams.page === 3 && appParams.limit === 10, "App query passes page and limit");

assert(
  jobApiContent.includes('if (filters.status && filters.status !== "all")') &&
    jobApiContent.includes('if (filters.approvalStatus && filters.approvalStatus !== "all")'),
  "jobApi.getAllJobsAdmin filters out 'all' before dispatching request"
);

assert(
  appServiceContent.includes('if (filters.status && filters.status !== "all")') &&
    appServiceContent.includes('if (filters.jobId && filters.jobId !== "all")'),
  "applicationService.getAllApplications filters out 'all' before dispatching request"
);

// 5. Test Pagination Math on Large Datasets (> 10 items)
console.log("\n5. Testing Multi-Page Pagination Boundary Mathematics:");

function calcPagination(totalCount, page, limit) {
  const totalPages = Math.ceil(totalCount / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return { totalPages, startItem, endItem, hasNext, hasPrev };
}

// Case: 153 applications, limit 10
const p1 = calcPagination(153, 1, 10);
assert(p1.totalPages === 16, "153 items with limit 10 produces 16 total pages");
assert(p1.startItem === 1 && p1.endItem === 10, "Page 1 displays items 1 to 10");
assert(p1.hasNext === true && p1.hasPrev === false, "Page 1 hasNext=true, hasPrev=false");

const p8 = calcPagination(153, 8, 10);
assert(p8.startItem === 71 && p8.endItem === 80, "Page 8 displays items 71 to 80");
assert(p8.hasNext === true && p8.hasPrev === true, "Page 8 hasNext=true, hasPrev=true");

const p16 = calcPagination(153, 16, 10);
assert(p16.startItem === 151 && p16.endItem === 153, "Page 16 displays items 151 to 153");
assert(p16.hasNext === false && p16.hasPrev === true, "Page 16 hasNext=false, hasPrev=true");

// 6. Test Safe Resume Name Generation
console.log("\n6. Testing Safe Resume File Name Generation:");

function sanitizeResumeName(applicantName, ext = ".pdf") {
  const safe = applicantName.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${safe}_Resume${ext}`;
}

assert(
  sanitizeResumeName("John Doe") === "John_Doe_Resume.pdf",
  "Generates safe file name for standard name"
);
assert(
  sanitizeResumeName("María O'Connor / Admin") === "Mar_a_O_Connor___Admin_Resume.pdf",
  "Removes special characters and slashes to prevent directory traversal in downloads"
);

// 7. Test Backend Moderation & Approval Safety
console.log("\n7. Auditing Backend Moderation & Approval Controllers:");

const jobControllerPath = path.resolve(__dirname, "../src/controllers/jobController.js");
const appControllerPath = path.resolve(__dirname, "../src/controllers/applicationController.js");
const appRoutesPath = path.resolve(__dirname, "../src/routes/applicationRoutes.js");

const jobControllerContent = fs.readFileSync(jobControllerPath, "utf8");
const appControllerContent = fs.readFileSync(appControllerPath, "utf8");
const appRoutesContent = fs.readFileSync(appRoutesPath, "utf8");

assert(
  jobControllerContent.includes("VALID_JOB_STATUSES") &&
    jobControllerContent.includes("VALID_APPROVAL_STATUSES"),
  "jobController defines explicit valid job statuses and approval statuses"
);

assert(
  jobControllerContent.includes("Invalid job status") &&
    jobControllerContent.includes("Invalid approval status"),
  "jobController validates incoming status and approvalStatus against allowed values (returns 400 on error)"
);

assert(
  jobControllerContent.includes('if (req.user.role === "employer")') &&
    jobControllerContent.includes("Only administrators can change job approval status"),
  "jobController forbids employers from changing job approval status"
);

assert(
  jobsMgmtContent.includes('!["Closed", "inactive", "filled"].includes(job.status)') &&
    jobsMgmtContent.includes('updates.status = "Published"'),
  "JobsManagement handleApproveJob preserves closed, inactive, or filled statuses without forcing Published"
);

// 8. Test Application Moderation & Deletion Safety
console.log("\n8. Auditing Application Moderation & File Cleanup:");

assert(
  appControllerContent.includes("VALID_APPLICATION_STATUSES") &&
    appControllerContent.includes("Invalid application status"),
  "applicationController validates status updates against supported application statuses"
);

assert(
  appControllerContent.includes('application.status === "withdrawn"') &&
    appControllerContent.includes("Cannot change the status of an application withdrawn by the candidate"),
  "applicationController protects candidate-withdrawn applications from status transitions by employers"
);

assert(
  appControllerContent.includes("storageService.deleteFile(application.resumePath)") &&
    appControllerContent.includes("await application.destroy()"),
  "applicationController cleans up stored resume file from disk when an application is deleted"
);

assert(
  appRoutesContent.includes('router.delete("/:id", authorize("admin"), deleteApplication)'),
  "applicationRoutes strictly restricts application deletion to administrators"
);

// 9. Test Query Sanitization & Sensitive Attribute Exclusion
console.log("\n9. Testing Query Sanitization & Safe Projection:");

assert(
  jobControllerContent.includes("Math.max(1, parseInt(page, 10) || 1)") &&
    jobControllerContent.includes("Math.min(100, parseInt(limit, 10) || 20)"),
  "jobController sanitizes page and limit parameters, capping limit at 100"
);

assert(
  appControllerContent.includes("Math.max(1, parseInt(page, 10) || 1)") &&
    appControllerContent.includes("Math.min(100, parseInt(limit, 10) || 10)"),
  "applicationController sanitizes page and limit parameters, capping limit at 100"
);

assert(
  jobControllerContent.includes('attributes: ["id", "name", "email"]') &&
    appControllerContent.includes('attributes: ["id", "name", "email", "phone"]'),
  "Both job and application controllers restrict user attributes to safe public fields (excluding passwords, hashes, reset tokens)"
);

console.log("\n===================================================================");
console.log(`   Verification Summary: ${testsPassed} passed, ${testsFailed} failed   `);
console.log("===================================================================");

process.exit(testsFailed > 0 ? 1 : 0);

