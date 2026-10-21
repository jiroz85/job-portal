const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Job = sequelize.define(
  "Job",
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    responsibilities: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    education: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    applicationDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    salary: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(
        "Full-time",
        "Part-time",
        "Contract",
        "Internship",
        "Temporary"
      ),
      allowNull: false,
    },
    experience: {
      type: DataTypes.ENUM(
        "Entry Level",
        "Mid Level",
        "Senior Level",
        "Lead",
        "Manager"
      ),
      allowNull: false,
    },
    skills: {
      type: DataTypes.STRING, // Will store as comma-separated values
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "active",
        "inactive",
        "filled",
        "Draft",
        "Published",
        "Closed"
      ),
      defaultValue: "active",
    },
    approvalStatus: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "approved",
    },
    employerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      comment: "ID of the employer who created the job",
    },
  },
    {
    timestamps: true,
    tableName: "jobs",
    indexes: [
      { fields: ["status"] },
      { fields: ["employerId"] },
      { fields: ["approvalStatus"] },
      { fields: ["createdAt"] },
      { fields: ["type"] },
      { fields: ["status", "approvalStatus"] },
    ],
  }
);

// Define associations
Job.associate = (models) => {
  Job.hasMany(models.Application, {
    foreignKey: "jobId",
    as: "applications",
  });
  Job.belongsTo(models.User, {
    foreignKey: "employerId",
    as: "employer",
  });
};

module.exports = Job;
