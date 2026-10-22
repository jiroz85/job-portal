// Debug script to check authentication status
// Run this in browser console to check your login status

console.log("=== Authentication Debug ===");
console.log("Token:", localStorage.getItem("token"));
console.log("User:", localStorage.getItem("user"));

try {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  console.log("User Role:", user.role);
  console.log("User Email:", user.email);
  console.log("Is Admin:", user.role === "admin");
  console.log("Is Employer:", user.role === "employer");
} catch (e) {
  console.log("Error parsing user data:", e);
}

// Check current page
console.log("Current URL:", window.location.href);

// Check if you should be able to see employer features
if (window.location.href.includes("/employer")) {
  console.log("📍 You're on an employer page");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role === "employer" || user.role === "admin") {
    console.log("✅ You should have access to employer features");
  } else {
    console.log("❌ You need to be logged in as employer or admin");
  }
}
