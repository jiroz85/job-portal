const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Target recipient user ID",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "info",
        "success",
        "warning",
        "error",
        "job_alert",
        "application_status",
        "system"
      ),
      allowNull: false,
      defaultValue: "info",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
      defaultValue: "medium",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue("metadata");
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      },
      set(val) {
        if (typeof val === "object" && val !== null) {
          this.setDataValue("metadata", JSON.stringify(val));
        } else {
          this.setDataValue("metadata", val);
        }
      },
    },
  },
  {
    timestamps: true,
    tableName: "notifications",
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["userId", "isRead"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

Notification.associate = (models) => {
  if (models.User) {
    Notification.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
      onDelete: "CASCADE",
    });
  }
};

module.exports = Notification;
