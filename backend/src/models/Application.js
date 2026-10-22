const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "jobs",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    applicantName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    applicantEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    applicantPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resumePath: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to uploaded resume file",
    },
    fileData: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      comment: "Base64 encoded file data for permanent cloud container persistence",
    },
    originalResumeName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Original file name uploaded by candidate",
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "MIME type of uploaded resume",
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    experience: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Applicant's relevant experience",
    },
    education: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Applicant's education background",
    },
    skills: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Applicant's skills (comma-separated)",
    },
    expectedSalary: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    availability: {
      type: DataTypes.ENUM(
        "Immediate",
        "1-2 weeks",
        "2-4 weeks",
        "1 month notice",
        "2 months notice"
      ),
      allowNull: false,
      defaultValue: "Immediate",
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "under_review",
        "shortlisted",
        "interview_scheduled",
        "interviewed",
        "offered",
        "accepted",
        "rejected",
        "withdrawn"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Internal notes by employer",
    },
    applicationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // Verification fields for applicant legitimacy
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether the applicant has been verified as legitimate",
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Token for email verification",
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether the applicant's email has been verified",
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "IP address of the applicant for fraud detection",
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Browser user agent for application tracking",
    },
    riskScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Risk assessment score (0-100, higher = more suspicious)",
    },
    flagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Whether this application has been flagged as suspicious",
    },
  },
  {
    timestamps: true,
    tableName: "applications",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["jobId"],
      },
      {
        fields: ["applicantEmail"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["applicationDate"],
      },
    ],
  }
);

// Define associations
Application.associate = (models) => {
  Application.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });

  Application.belongsTo(models.Job, {
    foreignKey: "jobId",
    as: "job",
  });
};

module.exports = Application;
