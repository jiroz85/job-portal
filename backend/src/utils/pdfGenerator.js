/**
 * pdfGenerator.js
 * Pure Node.js Standard PDF (PDF 1.4) Generator for Candidate Resumes & Application Profiles.
 * Zero external dependencies, fully compatible with all PDF viewers.
 */

function escapePdfText(str) {
  if (!str) return "";
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

/**
 * Generates a clean, professional, standardized PDF buffer representing
 * the candidate's verified application resume and profile credentials.
 *
 * @param {Object} data Application & Candidate credentials
 * @returns {Buffer} Valid PDF 1.4 binary buffer
 */
function generateResumePdf(data = {}) {
  const {
    name = "Candidate",
    email = "",
    phone = "",
    jobTitle = "",
    company = "",
    appliedDate = "",
    skills = "",
    experience = "",
    education = "",
    coverLetter = "",
    expectedSalary = "",
    availability = "",
  } = data;

  const lines = [];
  let y = 730;

  // Title / Applicant Name
  lines.push(`BT /F2 22 Tf 50 ${y} Td (${escapePdfText(name)}) Tj ET`);
  y -= 22;

  // Contact & Availability Info Bar
  const contactParts = [
    email,
    phone,
    availability ? `Availability: ${availability}` : "",
    expectedSalary ? `Expected: ${expectedSalary}` : "",
  ].filter(Boolean);

  if (contactParts.length > 0) {
    lines.push(
      `BT /F1 10 Tf 50 ${y} Td (${escapePdfText(contactParts.join("  |  "))}) Tj ET`
    );
    y -= 14;
  }

  // Header separator line
  lines.push(`0.3 w 50 ${y} m 562 ${y} l S`);
  y -= 24;

  // Target Position & Application Meta
  if (jobTitle || company) {
    lines.push(`BT /F2 11 Tf 50 ${y} Td (POSITION APPLIED:) Tj ET`);
    y -= 15;
    const target = `${jobTitle || "Role"}${company ? ` at ${company}` : ""}${
      appliedDate ? `  [Submitted: ${appliedDate}]` : ""
    }`;
    lines.push(`BT /F1 10 Tf 50 ${y} Td (${escapePdfText(target)}) Tj ET`);
    y -= 22;
  }

  // Key Skills & Competencies
  if (skills) {
    lines.push(`BT /F2 11 Tf 50 ${y} Td (KEY SKILLS & COMPETENCIES:) Tj ET`);
    y -= 15;
    lines.push(`BT /F1 10 Tf 50 ${y} Td (${escapePdfText(skills)}) Tj ET`);
    y -= 22;
  }

  // Professional Experience
  if (experience) {
    lines.push(`BT /F2 11 Tf 50 ${y} Td (PROFESSIONAL EXPERIENCE:) Tj ET`);
    y -= 15;
    const expLines = String(experience).split("\n").filter(Boolean);
    for (const el of expLines) {
      lines.push(
        `BT /F1 9.5 Tf 50 ${y} Td (${escapePdfText(el.substring(0, 95))}) Tj ET`
      );
      y -= 13;
      if (y < 90) break;
    }
    y -= 10;
  }

  // Education & Credentials
  if (education && y > 100) {
    lines.push(`BT /F2 11 Tf 50 ${y} Td (EDUCATION & CREDENTIALS:) Tj ET`);
    y -= 15;
    lines.push(
      `BT /F1 9.5 Tf 50 ${y} Td (${escapePdfText(education.substring(0, 95))}) Tj ET`
    );
    y -= 22;
  }

  // Cover Letter / Candidate Statement
  if (coverLetter && y > 120) {
    lines.push(`BT /F2 11 Tf 50 ${y} Td (CANDIDATE STATEMENT / COVER LETTER:) Tj ET`);
    y -= 15;
    const clLines = String(coverLetter).split("\n").filter(Boolean);
    for (const cl of clLines) {
      lines.push(
        `BT /F1 9 Tf 50 ${y} Td (${escapePdfText(cl.substring(0, 105))}) Tj ET`
      );
      y -= 12;
      if (y < 65) break;
    }
  }

  // Standard Footer
  lines.push(
    `BT /F1 8 Tf 50 32 Td (Candidate Verified Application Profile & Resume - JobPortal Platform) Tj ET`
  );

  const streamContent = lines.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf8");

  let pdf = "%PDF-1.4\n";
  const offsets = [];

  function addObj(str) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += str + "\n";
  }

  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj");
  addObj(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> >>\nendobj"
  );
  addObj("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj");
  addObj(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj"
  );
  addObj(
    `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`
  );

  const startxref = Buffer.byteLength(pdf, "utf8");
  pdf += "xref\n0 7\n0000000000 65535 f \n";
  for (const o of offsets) {
    pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

module.exports = {
  generateResumePdf,
};
