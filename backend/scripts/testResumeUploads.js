/**
 * testResumeUploads.js
 * Verification suite for Real Resume Uploads, Validation, Authorization & Storage
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
  throw new Error(`Login failed for ${email}`);
}

async function runTests() {
  console.log("=================================================");
  console.log("  Running Real Resume Uploads & Security Suite   ");
  console.log("=================================================\n");

  try {
    // 1. Authenticate users
    console.log("1. Authenticating test users...");
    const jobseekerA = await login("jane.smith@example.com", "password123");
    const jobseekerB = await login("mike.j@example.com", "password123");
    const employer1 = await login("hr@techcorp.com", "password123");
    const employer2 = await login("sarah.w@example.com", "password123");
    const admin = await login("admin@example.com", "admin123");
    console.log("  Authenticated Jobseeker A, Jobseeker B, Employer 1, Employer 2, Admin\n");

    // 2. Test valid PDF upload
    console.log("2. Valid PDF Upload");
    const pdfBlob = new Blob(["%PDF-1.4 Mock valid PDF binary content for testing"], {
      type: "application/pdf",
    });
    const pdfFormData = new FormData();
    pdfFormData.append("resume", pdfBlob, "Jane_Smith_Resume.pdf");

    const uploadPdfRes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jobseekerA.token}` },
      body: pdfFormData,
    });
    const uploadPdfData = await uploadPdfRes.json();
    assert(uploadPdfRes.status === 201, "PDF upload returns 201 Created");
    assert(uploadPdfData.success === true, "PDF upload response indicates success");
    assert(uploadPdfData.data.name === "Jane_Smith_Resume.pdf", "Preserves original filename in metadata");
    const resumeAId = uploadPdfData.data.id;
    assert(typeof resumeAId === "number", "Returns database ID for uploaded resume");

    // 3. Test valid DOCX upload
    console.log("\n3. Valid DOCX Upload");
    const docxBlob = new Blob(["PK\x03\x04Mock DOCX binary content for testing"], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const docxFormData = new FormData();
    docxFormData.append("resume", docxBlob, "Jane_Smith_Tech_CV.docx");

    const uploadDocxRes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jobseekerA.token}` },
      body: docxFormData,
    });
    const uploadDocxData = await uploadDocxRes.json();
    assert(uploadDocxRes.status === 201, "DOCX upload returns 201 Created");
    assert(uploadDocxData.success === true, "DOCX upload response indicates success");
    const resumeDocxId = uploadDocxData.data.id;

    // 4. Test invalid file type (Executable or Image)
    console.log("\n4. Invalid File Type Rejection");
    const exeBlob = new Blob(["MZ\x90Executable binary"], {
      type: "application/x-msdownload",
    });
    const exeFormData = new FormData();
    exeFormData.append("resume", exeBlob, "malicious_script.exe");

    const uploadExeRes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jobseekerA.token}` },
      body: exeFormData,
    });
    const uploadExeData = await uploadExeRes.json();
    assert(uploadExeRes.status === 400, "Executable file upload rejected with 400 Bad Request");
    assert(
      uploadExeData.error.includes("Invalid file type") || uploadExeData.error.includes("Only PDF"),
      "Returns clear file type validation error message"
    );

    // 5. Test oversized file (> 5 MB)
    console.log("\n5. Oversized File Rejection (> 5 MB)");
    // Create a buffer of 5.5 MB
    const largeBuffer = new Uint8Array(5.5 * 1024 * 1024);
    const largeBlob = new Blob([largeBuffer], { type: "application/pdf" });
    const largeFormData = new FormData();
    largeFormData.append("resume", largeBlob, "Too_Large_Resume.pdf");

    const uploadLargeRes = await fetch(`${BASE_URL}/resumes/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jobseekerA.token}` },
      body: largeFormData,
    });
    const uploadLargeData = await uploadLargeRes.json();
    assert(uploadLargeRes.status === 400, "Oversized file rejected with 400 Bad Request");
    assert(
      uploadLargeData.error.includes("5 MB"),
      "Error specifies maximum 5 MB limit"
    );

    // 6. Test unauthorized access between job seekers
    console.log("\n6. Unauthorized Access Between Job Seekers");
    const userBDownload = await fetch(
      `${BASE_URL}/resumes/${resumeAId}/download`,
      {
        headers: { Authorization: `Bearer ${jobseekerB.token}` },
      }
    );
    assert(userBDownload.status === 403, "Jobseeker B cannot download Jobseeker A's resume (returns 403)");

    const userBSetDefault = await fetch(
      `${BASE_URL}/resumes/${resumeAId}/default`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${jobseekerB.token}` },
      }
    );
    assert(userBSetDefault.status === 403, "Jobseeker B cannot set Jobseeker A's resume as default (returns 403)");

    const userBDelete = await fetch(`${BASE_URL}/resumes/${resumeAId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jobseekerB.token}` },
    });
    assert(userBDelete.status === 403, "Jobseeker B cannot delete Jobseeker A's resume (returns 403)");

    // 7. Test application submission with attached resume file
    console.log("\n7. Job Application Submission with Resume");
    // Employer 1 creates a job first
    const createJobRes = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${employer1.token}`,
      },
      body: JSON.stringify({
        title: "Resume Uploads Test Job",
        company: "Tech Corp",
        location: "New York, NY",
        description: "Testing application with resume attachment",
        requirements: "Fullstack",
        type: "Full-time",
        experience: "Mid Level",
        status: "active",
      }),
    });
    const jobData = await createJobRes.json();
    const testJobId = jobData.data.id;

    // Jobseeker A submits application with attached resume file via multipart/form-data
    const appResumeBlob = new Blob(["%PDF-1.4 Application custom resume document"], {
      type: "application/pdf",
    });
    const appFormData = new FormData();
    appFormData.append("jobId", testJobId);
    appFormData.append("applicantPhone", "+1234567890");
    appFormData.append("coverLetter", "I am applying with an attached resume file for this position.");
    appFormData.append("experience", "4 years in web development");
    appFormData.append("education", "Computer Science Degree");
    appFormData.append("skills", "Node.js, React, Express");
    appFormData.append("expectedSalary", "$95,000");
    appFormData.append("availability", "Immediate");
    appFormData.append("resume", appResumeBlob, "Application_Jane_CV.pdf");

    const submitAppRes = await fetch(`${BASE_URL}/applications`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jobseekerA.token}` },
      body: appFormData,
    });
    const submitAppData = await submitAppRes.json();
    assert(submitAppRes.status === 201 || submitAppRes.status === 200, "Application with resume submitted successfully");
    const applicationId = submitAppData.data.id;
    assert(submitAppData.data.resumePath !== null, "Application record has resumePath populated");

    // 8. Test Employer Resume Access Restrictions (Requirement 7)
    console.log("\n8. Employer Resume Access Restrictions");
    // Employer 1 (owns the job) downloads the resume -> should succeed
    const emp1DownloadRes = await fetch(
      `${BASE_URL}/applications/${applicationId}/resume`,
      {
        headers: { Authorization: `Bearer ${employer1.token}` },
      }
    );
    assert(emp1DownloadRes.status === 200, "Employer 1 (job owner) can download application resume (200 OK)");

    // Employer 2 (does NOT own the job) tries to download the resume -> must return 403 Forbidden
    const emp2DownloadRes = await fetch(
      `${BASE_URL}/applications/${applicationId}/resume`,
      {
        headers: { Authorization: `Bearer ${employer2.token}` },
      }
    );
    assert(emp2DownloadRes.status === 403, "Employer 2 (not job owner) is blocked from downloading resume (403 Forbidden)");

    // Applicant themselves can download their submitted resume
    const applicantDownloadRes = await fetch(
      `${BASE_URL}/applications/${applicationId}/resume`,
      {
        headers: { Authorization: `Bearer ${jobseekerA.token}` },
      }
    );
    assert(applicantDownloadRes.status === 200, "Applicant can download their own application resume (200 OK)");

    // Admin can download any application resume
    const adminDownloadRes = await fetch(
      `${BASE_URL}/applications/${applicationId}/resume`,
      {
        headers: { Authorization: `Bearer ${admin.token}` },
      }
    );
    assert(adminDownloadRes.status === 200, "Admin can download application resume (200 OK)");

    // Unauthenticated user cannot download application resume
    const unauthDownloadRes = await fetch(
      `${BASE_URL}/applications/${applicationId}/resume`
    );
    assert(unauthDownloadRes.status === 401, "Unauthenticated user blocked from downloading resume (401 Unauthorized)");

    // 9. Jobseeker Resume Management (List, Default, Download, Delete)
    console.log("\n9. Jobseeker Resume Management");
    const getResumesRes = await fetch(`${BASE_URL}/resumes`, {
      headers: { Authorization: `Bearer ${jobseekerA.token}` },
    });
    const getResumesData = await getResumesRes.json();
    assert(getResumesRes.status === 200, "Jobseeker A fetches their resume list");
    assert(getResumesData.data.length >= 2, "Resume list reflects uploaded resumes");

    const setDefaultRes = await fetch(
      `${BASE_URL}/resumes/${resumeDocxId}/default`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${jobseekerA.token}` },
      }
    );
    assert(setDefaultRes.status === 200, "Jobseeker A sets DOCX resume as default");

    const deleteResumeRes = await fetch(`${BASE_URL}/resumes/${resumeAId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jobseekerA.token}` },
    });
    assert(deleteResumeRes.status === 200, "Jobseeker A deletes their resume successfully");

    // Clean up test job
    await fetch(`${BASE_URL}/jobs/${testJobId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${employer1.token}` },
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
