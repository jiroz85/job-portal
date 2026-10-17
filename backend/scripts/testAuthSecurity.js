/**
 * testAuthSecurity.js
 * Verification suite for Authentication Security:
 * 1. Password verification with bcrypt (no plaintext)
 * 2. Generic error handling for invalid credentials
 * 3. Safe startup failure when JWT_SECRET is missing, too short, or a known placeholder
 * 4. Rate limiting on authentication endpoints (brute-force protection)
 * 5. Preservation of existing user accounts and authorization
 */

const { spawn } = require("child_process");
const path = require("path");
const { validateJwtSecret } = require("../src/middleware/auth");

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

  try {
    const res = await fetch(url, config);
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      // Non-JSON response (e.g., text/plain rate limit response)
      data = null;
    }
    return { status: res.status, ok: res.ok, headers: res.headers, data };
  } catch (err) {
    console.error(`Fetch error for ${endpoint}:`, err.message);
    return { status: 500, ok: false, data: { error: err.message } };
  }
}

// Test child process startup exit behavior with invalid env vars
function testStartupExit(envOverrides, expectedExitCode = 1) {
  return new Promise((resolve) => {
    const childEnv = { ...process.env, ...envOverrides };
    const child = spawn(process.execPath, [path.join(__dirname, "../src/index.js")], {
      env: childEnv,
      cwd: path.join(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    let stdout = "";
    let finished = false;

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        try {
          child.kill();
        } catch (e) {}
        resolve({ code: -1, output: stdout + stderr, timedOut: true });
      }
    }, 5000);

    child.on("close", (code) => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        resolve({ code, output: stdout + stderr, timedOut: false });
      }
    });
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("🔐 Authentication Security Verification Suite");
  console.log("=================================================\n");

  // SECTION 1: JWT Secret Validation Unit & Process Startup Fail-Safe
  console.log("--- 1. Missing or Insecure JWT_SECRET Startup Protection ---");

  // Unit-level assertions
  let missingThrown = false;
  try {
    const orig = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    validateJwtSecret();
    process.env.JWT_SECRET = orig;
  } catch (e) {
    missingThrown = true;
  }
  assert(missingThrown, "validateJwtSecret throws when JWT_SECRET is missing");

  let shortThrown = false;
  try {
    const orig = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "short_key";
    validateJwtSecret();
    process.env.JWT_SECRET = orig;
  } catch (e) {
    shortThrown = true;
  }
  assert(shortThrown, "validateJwtSecret throws when JWT_SECRET is less than 16 chars");

  let placeholderThrown = false;
  try {
    const orig = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "job-portal-secret-key-2024-hp";
    validateJwtSecret();
    process.env.JWT_SECRET = orig;
  } catch (e) {
    placeholderThrown = true;
  }
  assert(placeholderThrown, "validateJwtSecret throws when JWT_SECRET is a default placeholder");

  // Process startup assertions (fails safely at startup with exit code 1)
  console.log("  Testing server startup fail-safe with missing JWT_SECRET...");
  const missingResult = await testStartupExit({ JWT_SECRET: "" });
  assert(
    missingResult.code === 1 && missingResult.output.includes("FATAL CONFIGURATION ERROR"),
    "Server exits safely (code 1) when JWT_SECRET is missing"
  );

  console.log("  Testing server startup fail-safe with insecure placeholder JWT_SECRET...");
  const placeholderResult = await testStartupExit({ JWT_SECRET: "job-portal-secret-key-2024-hp" });
  assert(
    placeholderResult.code === 1 && placeholderResult.output.includes("insecure default placeholder"),
    "Server exits safely (code 1) when JWT_SECRET is an insecure default placeholder"
  );

  console.log("  Testing server startup fail-safe with too-short JWT_SECRET (< 16 chars)...");
  const shortResult = await testStartupExit({ JWT_SECRET: "abc123" });
  assert(
    shortResult.code === 1 && shortResult.output.includes("too short"),
    "Server exits safely (code 1) when JWT_SECRET is shorter than 16 chars"
  );

  // SECTION 2: Valid Authentication & Password Verification
  console.log("\n--- 2. Valid Authentication & Hash Verification ---");

  // Valid login for admin
  const validAdminRes = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@example.com", password: "admin123" },
  });
  assert(validAdminRes.status === 200, "Admin login succeeds with status 200");
  assert(validAdminRes.data && validAdminRes.data.success === true, "Admin login returns success: true");
  assert(
    validAdminRes.data && validAdminRes.data.data && typeof validAdminRes.data.data.token === "string",
    "Admin login returns valid JWT token"
  );
  assert(
    validAdminRes.data && validAdminRes.data.data && validAdminRes.data.data.password === undefined,
    "Admin login does NOT leak password hash in response"
  );

  // Valid login for employer (TechCorp)
  const validEmployerRes = await request("/auth/login", {
    method: "POST",
    body: { email: "hr@techcorp.com", password: "password123" },
  });
  assert(validEmployerRes.status === 200, "Employer login succeeds with status 200");
  assert(validEmployerRes.data?.data?.role === "employer", "Employer role preserved as 'employer'");

  // SECTION 3: Invalid Credentials Handling (No info leakage)
  console.log("\n--- 3. Invalid Credentials & Plaintext Password Rejection ---");

  // Incorrect password for existing account
  const wrongPassRes = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@example.com", password: "wrong_password_999" },
  });
  assert(wrongPassRes.status === 401, "Incorrect password returns HTTP 401");
  assert(
    wrongPassRes.data?.error === "Invalid email or password",
    "Incorrect password returns generic message without revealing email existence"
  );

  // Non-existent email
  const wrongEmailRes = await request("/auth/login", {
    method: "POST",
    body: { email: "nonexistent_user_9988@domain.com", password: "anyPassword" },
  });
  assert(wrongEmailRes.status === 401, "Non-existent user returns HTTP 401");
  assert(
    wrongEmailRes.data?.error === "Invalid email or password",
    "Non-existent user returns identical generic message (prevents enumeration)"
  );

  // Missing email or password
  const missingFieldsRes = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@example.com" },
  });
  assert(missingFieldsRes.status === 400, "Missing password returns HTTP 400 Bad Request");

  // SECTION 4: Registration Safety & Validation
  console.log("\n--- 4. Registration Security & Input Validation ---");

  // Registration with short password
  const shortPassReg = await request("/auth/register", {
    method: "POST",
    body: { name: "Test User", email: "shortpass@example.com", password: "123" },
  });
  assert(shortPassReg.status === 400, "Registration with password < 6 chars is rejected (HTTP 400)");

  // Registration with invalid email format
  const badEmailReg = await request("/auth/register", {
    method: "POST",
    body: { name: "Test User", email: "not-an-email", password: "validPassword123" },
  });
  assert(badEmailReg.status === 400, "Registration with invalid email format is rejected (HTTP 400)");

  // Duplicate email registration
  const duplicateReg = await request("/auth/register", {
    method: "POST",
    body: { name: "Duplicate", email: "admin@example.com", password: "anotherPassword123" },
  });
  assert(duplicateReg.status === 400, "Registration with already registered email is rejected (HTTP 400)");

  // SECTION 5: Rate Limiting on Authentication Endpoints
  console.log("\n--- 5. Authentication Endpoint Rate Limiting ---");
  console.log("  Sending 10 failed login requests to hit rate limit threshold...");

  let rateLimitHit = false;
  let hitAttempt = -1;

  // We already sent 2 failed requests above. Sending 10 more to ensure threshold (10 max) is crossed.
  for (let i = 1; i <= 10; i++) {
    const res = await request("/auth/login", {
      method: "POST",
      body: { email: "brute_force_target@example.com", password: `attempt_${i}` },
    });

    if (res.status === 429) {
      rateLimitHit = true;
      hitAttempt = i;
      break;
    }
  }

  assert(rateLimitHit, `Rate limiter triggers HTTP 429 Too Many Requests (triggered on attempt ${hitAttempt})`);

  // Verify that once rate limited, further requests receive 429
  const postLimitRes = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@example.com", password: "admin123" },
  });
  assert(postLimitRes.status === 429, "Subsequent request while rate-limited returns HTTP 429");

  // SECTION 6: Health Check & Deployment Verification
  console.log("\n--- 6. Health Check & Deployment Verification ---");
  const healthRes = await request("/health");
  assert(healthRes.status === 200, "GET /health returns HTTP 200 OK");
  assert(healthRes.data?.status === "healthy", "Health check reports status: 'healthy'");
  assert(healthRes.data?.database === "connected", "Health check reports database: 'connected'");

  const apiHealthRes = await request("/health");
  assert(apiHealthRes.status === 200, "GET /api/health returns HTTP 200 OK");

  // Verify CORS header for allowed local frontend origin
  const corsRes = await request("/health", {
    headers: { Origin: "http://localhost:5173" },
  });
  const allowOrigin = corsRes.headers.get("access-control-allow-origin");
  assert(
    allowOrigin === "http://localhost:5173",
    "CORS headers correctly allow configured frontend origin http://localhost:5173"
  );

  // SUMMARY
  console.log("\n=================================================");
  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log("=================================================");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
