const jwt = require("jsonwebtoken");

const INSECURE_JWT_SECRETS = [
  "your-secret-key-here",
  "job-portal-secret-key-2024-hp",
  "your_jwt_secret_key",
  "secret",
  "jwt_secret",
  "changeme",
  "12345678",
];

const validateJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === "") {
    throw new Error("JWT_SECRET environment variable is missing.");
  }
  if (secret.trim().length < 16) {
    throw new Error("JWT_SECRET is too short. It must be at least 16 characters long.");
  }
  if (INSECURE_JWT_SECRETS.includes(secret.trim().toLowerCase())) {
    throw new Error("JWT_SECRET is set to an insecure default placeholder.");
  }
  return secret.trim();
};

const getJwtSecret = () => {
  return validateJwtSecret();
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
    });
  }

  try {
    jwt.verify(token, getJwtSecret(), (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: "Invalid or expired token",
        });
      }

      req.user = user;
      next();
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Authentication service error",
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
    }

    next();
  };
};

// Token generation helper
const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || "24h",
  });
};

// Optional authentication middleware (sets req.user if valid token provided, but doesn't block if not)
const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    jwt.verify(token, getJwtSecret(), (err, user) => {
      if (!err && user) {
        req.user = user;
      }
      next();
    });
  } catch (err) {
    next();
  }
};

module.exports = {
  validateJwtSecret,
  getJwtSecret,
  authenticateToken,
  optionalAuthenticateToken,
  authorize,
  generateToken,
};
