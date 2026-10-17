const { Sequelize } = require("sequelize");

const isProduction = process.env.NODE_ENV === "production";

// Configure SSL for managed MySQL providers (Aiven, Render, AWS RDS, TiDB, etc.)
const getSslConfig = () => {
  const sslMode = process.env.DB_SSL;
  // If explicitly disabled
  if (sslMode === "false") {
    return false;
  }

  // If explicitly enabled or in production with a remote database host
  const isRemoteHost =
    process.env.DB_HOST &&
    !["localhost", "127.0.0.1"].includes(process.env.DB_HOST);

  if (
    sslMode === "true" ||
    sslMode === "require" ||
    (isProduction && isRemoteHost)
  ) {
    const ssl = {
      require: true,
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true",
    };

    if (process.env.DB_SSL_CA) {
      ssl.ca = process.env.DB_SSL_CA;
    }

    return ssl;
  }

  return false;
};

const sslConfig = getSslConfig();
const dialectOptions = sslConfig ? { ssl: sslConfig } : {};
const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;

// Create database connection (supports DATABASE_URL or individual credentials)
let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "mysql",
    logging: false,
    dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || "job_portal",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
      host: process.env.DB_HOST || "localhost",
      port: dbPort,
      dialect: "mysql",
      logging: false,
      dialectOptions,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

// Function to create database if it doesn't exist (DEVELOPMENT ONLY)
// Never run in production or against managed databases where administrator privileges are unavailable
const createDatabaseIfNotExists = async () => {
  if (
    isProduction ||
    process.env.DB_AUTO_CREATE === "false" ||
    process.env.DB_SKIP_CREATE === "true"
  ) {
    return;
  }

  // Do not attempt against remote hosts or connection strings without admin privileges
  if (
    process.env.DATABASE_URL ||
    (process.env.DB_HOST &&
      !["localhost", "127.0.0.1"].includes(process.env.DB_HOST))
  ) {
    return;
  }

  try {
    const connection = new Sequelize(
      null,
      process.env.DB_USER || "root",
      process.env.DB_PASSWORD || "",
      {
        host: process.env.DB_HOST || "localhost",
        port: dbPort,
        dialect: "mysql",
        logging: false,
      }
    );

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${
        process.env.DB_NAME || "job_portal"
      }\`;`
    );
    await connection.close();
    console.log("Database created or already exists");
  } catch (error) {
    console.warn("Notice: Database auto-creation bypassed:", error.message);
  }
};

module.exports = { sequelize, createDatabaseIfNotExists };
