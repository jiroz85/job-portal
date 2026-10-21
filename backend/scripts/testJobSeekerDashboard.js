/**
 * testJobSeekerDashboard.js
 * Comprehensive end-to-end audit verification suite for Job Seeker Dashboard
 */
const BASE_URL = "http://localhost:3001/api";
const fs = require("fs");
const path = require("path");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (res.status === 200 && data.success) {
    return { token: data.data.token, user: data.data };
  }
  throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
}

async function runTests() {
  console.log("===================================================================");
  console.log("     Job Seeker Dashboard: Purpose, Security & Quality Audit       ");
  console.log("===================================================================\n");

  try {
    // 1. Authenticate test accounts
    console.log("1. Authenticating test candidate accounts...");
    const candidateA = await login("jane.smith@example.com", "password123");
    const candidateB = await login("mike.j@example.com", "password123");
    const admin = await login("admin@example.com", "admin123");
    console.log("  Authenticated Candidate A (Jane), Candidate B (Mike), and Admin\n");

    // 2. Candidate Application Endpoint & Ownership Isolation
    console.log("2. Candidate Application Isolation & Access Controls:");
    
    // Candidate A fetches own applications
    const ownAppsRes = await fetch(`${BASE_URL}/applications/email/${candidateA.user.email}`, {
      headers: { Authorization: `Bearer ${candidateA.token}` },
    });
    const ownAppsData = await ownAppsRes.json();
    assert(ownAppsRes.status === 200, "Candidate A can fetch their own applications (200 OK)");
    assert(ownAppsData.success === true, "Response indicates success for own applications");
    assert(Array.isArray(ownAppsData.data), "Returns array of candidate applications");

    // Candidate B attempts to access Candidate A's applications
    const crossAppsRes = await fetch(`${BASE_URL}/applications/email/${candidateA.user.email}`, {
      headers: { Authorization: `Bearer ${candidateB.token}` },
    });
    const crossAppsData = await crossAppsRes.json();
    assert(crossAppsRes.status === 403, "Candidate B is strictly blocked from accessing Candidate A's applications (403 Forbidden)");
    assert(crossAppsData.success === false, "Cross-account response indicates error");
    assert(crossAppsData.error.includes("not authorized"), "Returns clear authorization error message");

    // Unauthenticated request to candidate applications
    const unauthAppsRes = await fetch(`${BASE_URL}/applications/email/${candidateA.user.email}`);
    assert(unauthAppsRes.status === 401, "Unauthenticated request is rejected (401 Unauthorized)");

    // Admin can access candidate applications
    const adminAppsRes = await fetch(`${BASE_URL}/applications/email/${candidateA.user.email}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(adminAppsRes.status === 200, "Administrator can inspect candidate applications for support (200 OK)");

    // 3. Application Submission & Candidate Withdrawal Flow
    console.log("\n3. Application Submission & Withdrawal Flow:");

    // Fetch published jobs to find a valid target job
    const jobsRes = await fetch(`${BASE_URL}/jobs`);
    const jobsData = await jobsRes.json();
    const availableJobs = jobsData.data || [];
    assert(availableJobs.length > 0, `Published jobs available for applications (${availableJobs.length} found)`);

    const targetJob = availableJobs[0];

    // Submit an application for Candidate B
    const appPayload = {
      jobId: targetJob.id,
      applicantName: candidateB.user.name,
      applicantEmail: candidateB.user.email,
      applicantPhone: "555-019-9876",
      coverLetter: "I am excited to apply for this opportunity and bring my technical skills to your team.",
      experience: "Over 5 years of software engineering experience.",
      skills: "JavaScript, React, Node.js",
      availability: "Immediate",
    };

    const submitRes = await fetch(`${BASE_URL}/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${candidateB.token}`,
      },
      body: JSON.stringify(appPayload),
    });
    const submitData = await submitRes.json();
    assert(submitRes.status === 200 || submitRes.status === 201, "Candidate application submitted or updated successfully");
    const testApp = submitData.data;
    assert(testApp && testApp.id, "Application record returned with valid ID");

    // Candidate A attempts to withdraw Candidate B's application
    const unauthorizedWithdrawRes = await fetch(`${BASE_URL}/applications/${testApp.id}/withdraw`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${candidateA.token}`,
      },
    });
    assert(unauthorizedWithdrawRes.status === 403, "Candidate A cannot withdraw Candidate B's application (403 Forbidden)");

    // Candidate B withdraws their own application
    const withdrawRes = await fetch(`${BASE_URL}/applications/${testApp.id}/withdraw`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${candidateB.token}`,
      },
    });
    const withdrawData = await withdrawRes.json();
    assert(withdrawRes.status === 200, "Candidate B successfully withdraws their own application (200 OK)");
    assert(withdrawData.success === true, "Withdrawal response reports success");
    assert(withdrawData.data.status === "withdrawn", "Application status transitioned to 'withdrawn'");

    // Re-attempting to withdraw already withdrawn application returns 400 Bad Request
    const reWithdrawRes = await fetch(`${BASE_URL}/applications/${testApp.id}/withdraw`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${candidateB.token}`,
      },
    });
    assert(reWithdrawRes.status === 400, "Attempting to re-withdraw an already withdrawn application returns 400 Bad Request");

    // 4. Candidate Resume Management
    console.log("\n4. Candidate Resume Management & Ownership:");
    const resumesRes = await fetch(`${BASE_URL}/resumes`, {
      headers: { Authorization: `Bearer ${candidateA.token}` },
    });
    const resumesData = await resumesRes.json();
    assert(resumesRes.status === 200, "Candidate fetches own resume list successfully (200 OK)");
    assert(Array.isArray(resumesData.data), "Resumes returned as array");

    // 5. Codebase Audit: Zero Browser alert() or confirm() Dialogs
    console.log("\n5. Codebase Audit: Accessible Feedback & Dialog Integrity:");
    const dashboardSrcPath = path.join(__dirname, "..", "..", "src", "pages", "UserDashboard.jsx");
    const appCardSrcPath = path.join(__dirname, "..", "..", "src", "components", "dashboard", "ApplicationCard.jsx");
    const resumeMgrSrcPath = path.join(__dirname, "..", "..", "src", "components", "dashboard", "ResumeManager.jsx");
    const savedJobsContextPath = path.join(__dirname, "..", "..", "src", "context", "SavedJobsContext.jsx");

    const dashboardCode = fs.readFileSync(dashboardSrcPath, "utf8");
    const appCardCode = fs.readFileSync(appCardSrcPath, "utf8");
    const resumeMgrCode = fs.readFileSync(resumeMgrSrcPath, "utf8");
    const savedJobsCode = fs.readFileSync(savedJobsContextPath, "utf8");

    // Check for native alert() calls (excluding comments)
    const hasDashboardAlert = /(?<!\/\/.*)\balert\s*\(/.test(dashboardCode);
    const hasAppCardAlert = /(?<!\/\/.*)\balert\s*\(/.test(appCardCode);
    const hasResumeMgrAlert = /(?<!\/\/.*)\balert\s*\(/.test(resumeMgrCode);

    assert(!hasDashboardAlert, "UserDashboard.jsx has zero native alert() calls");
    assert(!hasAppCardAlert, "ApplicationCard.jsx has zero native alert() calls");
    assert(!hasResumeMgrAlert, "ResumeManager.jsx has zero native alert() calls");

    // Check for native window.confirm calls
    const hasDashboardConfirm = /(?<!\/\/.*)\bconfirm\s*\(/.test(dashboardCode);
    assert(!hasDashboardConfirm, "UserDashboard.jsx has zero native confirm() calls");

    // Verify in-app confirmation modals exist
    assert(dashboardCode.includes("resumeToDelete"), "UserDashboard has in-app modal state for resume deletion");
    assert(dashboardCode.includes("applicationToWithdraw"), "UserDashboard has in-app modal state for application withdrawal");
    assert(dashboardCode.includes("role=\"alert\""), "UserDashboard includes non-blocking accessible notification banner");

    // Verify SavedJobsContext multi-user isolation
    assert(savedJobsCode.includes("savedJobs_user_"), "SavedJobsContext scopes localStorage keys per authenticated candidate");
    assert(savedJobsCode.includes("useAuth"), "SavedJobsContext is connected to authentication context");

    console.log("\n===================================================================");
    console.log(`  Job Seeker Dashboard Suite: ${passed} Passed, ${failed} Failed`);
    console.log("===================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runTests();
