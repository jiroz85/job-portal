const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret } = require("../middleware/auth");

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, role = "jobseeker" } = req.body;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : email;

    // Validate input
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address",
      });
    }

    // Role safety check (only allow self-registering as jobseeker or employer)
    const allowedRoles = ["jobseeker", "employer"];
    const assignedRole = allowedRoles.includes(role) ? role : "jobseeker";

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
      status: "active",
    });

    // Generate JWT token using validated secret
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRE || "30d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during registration",
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : email;

    // Validate input
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Check if account is blocked
    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        error: "Your account has been blocked. Please contact support.",
      });
    }

    // Verify password using bcrypt only - NO plaintext passwords accepted
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (compareError) {
      isMatch = false;
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Update last login timestamp
    await user.update({ lastLogin: new Date() });

    // Generate JWT token using validated secret
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: process.env.JWT_EXPIRE || "30d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Server error during login",
    });
  }
};

// Get current user (protected route)
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
