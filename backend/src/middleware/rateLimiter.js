const rateLimit = require("express-rate-limit");

// Rate limiter for login endpoint to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each IP to 10 failed login attempts per windowMs
  skipSuccessfulRequests: true, // Do not penalize successful authentications
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many login attempts from this IP, please try again after 15 minutes",
  },
});

// Rate limiter for registration endpoint
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Limit each IP to 20 registrations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many accounts created from this IP, please try again after an hour",
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
};
