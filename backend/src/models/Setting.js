const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: "Category identifier (general, email, security, subscriptions, notifications, featuredJobs)",
    },
    value: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      comment: "JSON serialized configuration for the category",
      get() {
        const raw = this.getDataValue("value");
        if (!raw) return {};
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      },
      set(val) {
        if (typeof val === "object" && val !== null) {
          this.setDataValue("value", JSON.stringify(val));
        } else if (typeof val === "string") {
          this.setDataValue("value", val);
        } else {
          this.setDataValue("value", JSON.stringify({}));
        }
      },
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "User ID of the administrator who last updated this setting",
    },
  },
  {
    timestamps: true,
    tableName: "system_settings",
    indexes: [
      {
        unique: true,
        fields: ["category"],
      },
    ],
  }
);

Setting.associate = (models) => {
  if (models.User) {
    Setting.belongsTo(models.User, {
      foreignKey: "updatedBy",
      as: "updater",
    });
  }
};

module.exports = Setting;
