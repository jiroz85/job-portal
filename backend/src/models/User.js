const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("jobseeker", "admin", "employer"),
      allowNull: false,
      defaultValue: "jobseeker",
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "blocked"),
      allowNull: false,
      defaultValue: "active",
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to profile picture file",
    },
    resumePath: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path to resume file",
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "User skills (JSON string)",
    },
    experience: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "User experience (JSON string)",
    },
    education: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "User education (JSON string)",
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    github: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    applicationsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    savedJobsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    subscriptionPlan: {
      type: DataTypes.ENUM("free", "basic", "premium", "enterprise"),
      allowNull: false,
      defaultValue: "free",
    },
    subscriptionExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    employerDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Employer specific details (JSON string)",
    },
  },
  {
    timestamps: true,
    tableName: "users",
    indexes: [
      {
        fields: ["role"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["lastLogin"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

// Define associations
User.associate = (models) => {
  User.hasMany(models.Application, {
    foreignKey: "userId",
    as: "applications",
  });

  User.hasMany(models.Audit, {
    foreignKey: "performedBy",
    as: "performedAudits",
  });

  User.hasMany(models.Audit, {
    foreignKey: "targetUserId",
    as: "auditTargets",
  });

  User.hasMany(models.Job, {
    foreignKey: "employerId",
    as: "jobs",
  });

  User.hasMany(models.Resume, {
    foreignKey: "userId",
    as: "resumes",
  });

  if (models.Notification) {
    User.hasMany(models.Notification, {
      foreignKey: "userId",
      as: "notifications",
    });
  }

  if (models.Setting) {
    User.hasMany(models.Setting, {
      foreignKey: "updatedBy",
      as: "updatedSettings",
    });
  }
};

module.exports = User;
