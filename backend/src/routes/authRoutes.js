const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");
const {
  register,
  login,
  getCurrentUser,
} = require("../controllers/authController");

// Public routes with brute-force rate limiting
router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);

// Protected routes
router.get("/me", authenticateToken, getCurrentUser);

module.exports = router;
