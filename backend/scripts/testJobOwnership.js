/**
 * testJobOwnership.js
 * Verification suite for Secure Job Ownership & Access Isolation
 */
const BASE_URL = "http://localhost:3001/api";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  const config = {
    method: options.method || "GET",
    headers,
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // text response
  }
  return { status: res.status, data };
}

async function login(email, password) {
  const res = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (res.status === 200 && res.data && res.data.data) {
    return {
      token: res.data.data.token,
      user: res.data.data,
    };
  }
  throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
}

async function runTests() {
  console.log("=================================================");
  console.log("  Running Job Ownership & Security Test Suite   ");
  console.log("=================================================\n");

  try {
    // 1. Authenticate Users
    console.log("1. Authenticating test users...");
    const emp1 = await login("hr@techcorp.com", "password123");
    const emp2 = await login("sarah.w@example.com", "password123");
    const admin = await login("admin@example.com", "admin123");
    const jobseeker = await login("jane.smith@example.com", "password123");
    console.log("  Users logged in: Employer 1 (id:", emp1.user.id, "), Employer 2 (id:", emp2.user.id, "), Admin (id:", admin.user.id, ")\n");

    // 2. Requirement 1: Job created by Employer 1 is automatically linked to Employer 1
    console.log("2. Requirement 1: Automatic Association with Authenticated Employer");
    const createJob1Res = await request("/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${emp1.token}` },
      body: {
        title: "Test Ownership Engineer - Emp1",
        company: "Tech Corp",
        location: "Remote",
        description: "Test job for ownership validation",
        requirements: "Node.js & Testing",
        type: "Full-time",
        experience: "Mid Level",
        status: "active",
      },
    });

    assert(createJob1Res.status === 201, "Employer 1 creates Job 1 with 201 Created");
    const job1Id = createJob1Res.data?.data?.id;
    const job1EmployerId = createJob1Res.data?.data?.employerId;
    assert(job1EmployerId === emp1.user.id, `Job 1 employerId (${job1EmployerId}) matches Employer 1 id (${emp1.user.id})`);

    // 3. Requirement 3: Prevent employer from spoofing another employer's ID
    console.log("\n3. Requirement 3: Prevent Ownership Spoofing");
    const createJob2Res = await request("/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${emp2.token}` },
      body: {
        title: "Test Spoofing Attempt - Emp2",
        company: "Global Solutions Inc",
        location: "Chicago, USA",
        description: "Trying to assign to Emp1",
        requirements: "Security testing",
        type: "Full-time",
        experience: "Senior Level",
        status: "active",
        employerId: emp1.user.id, // Malicious spoof attempt!
      },
    });

    assert(createJob2Res.status === 201, "Employer 2 creates Job 2 with 201 Created");
    const job2Id = createJob2Res.data?.data?.id;
    const job2EmployerId = createJob2Res.data?.data?.employerId;
    assert(job2EmployerId === emp2.user.id, `Job 2 employerId (${job2EmployerId}) assigned to Employer 2 (${emp2.user.id}) ignoring spoofed ID`);

    // 4. Requirement 2: Employer 2 CANNOT update, close, or delete Job 1
    console.log("\n4. Requirement 2: Employer Cross-Tenant Access Protection");
    const emp2UpdateJob1 = await request(`/jobs/${job1Id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${emp2.token}` },
      body: { title: "Hacked Job Title" },
    });
    assert(emp2UpdateJob1.status === 403, "Employer 2 cannot update Job 1 (returns 403 Forbidden)");

    const emp2StatusJob1 = await request(`/jobs/${job1Id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${emp2.token}` },
      body: { status: "Closed" },
    });
    assert(emp2StatusJob1.status === 403, "Employer 2 cannot change Job 1 status (returns 403 Forbidden)");

    const emp2DeleteJob1 = await request(`/jobs/${job1Id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${emp2.token}` },
    });
    assert(emp2DeleteJob1.status === 403, "Employer 2 cannot delete Job 1 (returns 403 Forbidden)");

    // 5. Requirement 2: Employer can view their own jobs on /my-jobs
    console.log("\n5. Requirement 2: Viewing Own Jobs via /api/jobs/my-jobs");
    const emp1MyJobs = await request("/jobs/my-jobs", {
      headers: { Authorization: `Bearer ${emp1.token}` },
    });
    assert(emp1MyJobs.status === 200, "Employer 1 fetches /jobs/my-jobs successfully");
    const emp1HasJob1 = emp1MyJobs.data?.data?.some((j) => j.id === job1Id);
    const emp1HasJob2 = emp1MyJobs.data?.data?.some((j) => j.id === job2Id);
    assert(emp1HasJob1 === true, "Employer 1's list contains Job 1");
    assert(emp1HasJob2 === false, "Employer 1's list does NOT contain Employer 2's Job 2");

    // 6. Requirement 6: Restrict application access to owning employer
    console.log("\n6. Requirement 6: Application Access Isolation");
    // Jobseeker submits application to Job 1
    const applyRes = await request("/applications", {
      method: "POST",
      headers: { Authorization: `Bearer ${jobseeker.token}` },
      body: {
        jobId: job1Id,
        applicantPhone: "+15551234567",
        coverLetter: "I would love to work on Job 1",
        experience: "5 years",
        education: "B.S. in CS",
        skills: "React, Node.js",
        expectedSalary: "$100k",
        availability: "Immediate",
      },
    });
    assert(applyRes.status === 200 || applyRes.status === 201, "Jobseeker submits application for Job 1");
    const appId = applyRes.data?.data?.id;

    // Employer 1 fetches applications for Job 1 -> should succeed
    const emp1AppRes = await request(`/applications?jobId=${job1Id}`, {
      headers: { Authorization: `Bearer ${emp1.token}` },
    });
    assert(emp1AppRes.status === 200, "Employer 1 can view applications for their own Job 1");
    const emp1FoundApp = emp1AppRes.data?.data?.some((a) => a.id === appId);
    assert(emp1FoundApp === true, "Employer 1 finds the submitted application in Job 1");

    // Employer 2 fetches applications for Job 1 -> must be forbidden
    const emp2AppRes = await request(`/applications?jobId=${job1Id}`, {
      headers: { Authorization: `Bearer ${emp2.token}` },
    });
    assert(emp2AppRes.status === 403, "Employer 2 cannot view applications for Job 1 (returns 403 Forbidden)");

    // Employer 2 fetches single application by ID -> must be forbidden
    if (appId) {
      const emp2SingleApp = await request(`/applications/${appId}`, {
        headers: { Authorization: `Bearer ${emp2.token}` },
      });
      assert(emp2SingleApp.status === 403, "Employer 2 cannot view single application for Job 1 (returns 403 Forbidden)");

      // Employer 2 tries to update status of application -> must be forbidden
      const emp2UpdateStatus = await request(`/applications/${appId}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${emp2.token}` },
        body: { status: "rejected" },
      });
      assert(emp2UpdateStatus.status === 403, "Employer 2 cannot update application status for Job 1 (returns 403 Forbidden)");

      // Employer 1 updates status of application -> should succeed
      const emp1UpdateStatus = await request(`/applications/${appId}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${emp1.token}` },
        body: { status: "under_review" },
      });
      assert(emp1UpdateStatus.status === 200, "Employer 1 can update application status for Job 1 (returns 200 OK)");
    }

    // 7. Requirement 4: Administrator Permissions
    console.log("\n7. Requirement 4: Administrator Permissions");
    const adminGetJob = await request(`/jobs/${job1Id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(adminGetJob.status === 200, "Admin can view Job 1");

    const adminUpdateJob = await request(`/jobs/${job1Id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { title: "Admin Modified Title" },
    });
    assert(adminUpdateJob.status === 200, "Admin can update Job 1");

    const adminStatusJob = await request(`/jobs/${job1Id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${admin.token}` },
      body: { approvalStatus: "approved" },
    });
    assert(adminStatusJob.status === 200, "Admin can update approval status on Job 1");

    const adminViewApps = await request(`/applications?jobId=${job1Id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert(adminViewApps.status === 200, "Admin can view applications for any job");

    // 8. Requirement 5: Public Job Listings
    console.log("\n8. Requirement 5: Public Accessibility of Job Listings");
    const publicJobs = await request("/jobs");
    assert(publicJobs.status === 200, "Public /api/jobs endpoint is accessible without authentication");
    const publicSingleJob = await request(`/jobs/${job1Id}`);
    assert(publicSingleJob.status === 200, "Public /api/jobs/:id is accessible for active jobs without auth");

    // 9. Requirement 8: Safe Handling of Existing Data (Legacy jobs without employerId)
    console.log("\n9. Requirement 8: Legacy Jobs with NULL employerId");
    const legacyJob = await request("/jobs/1");
    assert(legacyJob.status === 200, "Legacy Job 1 is still accessible");
    assert(legacyJob.data?.data?.employerId === null, "Legacy Job 1 employerId is null (not assigned arbitrarily)");

    const emp2TryUpdateLegacy = await request("/jobs/1", {
      method: "PUT",
      headers: { Authorization: `Bearer ${emp2.token}` },
      body: { title: "Unauthorized Overwrite" },
    });
    assert(emp2TryUpdateLegacy.status === 403, "Employer 2 cannot modify legacy unowned job (returns 403 Forbidden)");

    // 10. Clean Operations: Employer 1 can update, close, and delete their own job
    console.log("\n10. Employer Lifecycle: Update, Close, and Delete Own Job");
    const emp1Update = await request(`/jobs/${job1Id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${emp1.token}` },
      body: { title: "Valid Employer 1 Title" },
    });
    assert(emp1Update.status === 200, "Employer 1 can update their own Job 1");

    const emp1Close = await request(`/jobs/${job1Id}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${emp1.token}` },
      body: { status: "Closed" },
    });
    assert(emp1Close.status === 200, "Employer 1 can close their own Job 1");

    const emp1Delete = await request(`/jobs/${job1Id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${emp1.token}` },
    });
    assert(emp1Delete.status === 200, "Employer 1 can delete their own Job 1");

    // Clean up Job 2 by Admin
    await request(`/jobs/${job2Id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${admin.token}` },
    });

    console.log("\n=================================================");
    console.log(`  Tests Completed: ${testsPassed} Passed, ${testsFailed} Failed`);
    console.log("=================================================");

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  }
}

runTests();
