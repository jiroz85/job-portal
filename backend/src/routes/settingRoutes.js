const express = require("express");
const router = express.Router();
const settingController = require("../controllers/settingController");
const { authenticateToken, authorize } = require("../middleware/auth");

// All settings routes are strictly restricted to authenticated Administrators
router.use(authenticateToken, authorize("admin"));

router.get("/", settingController.getSettings);
router.put("/", settingController.updateSettings);
router.post("/reset", settingController.resetSettings);
router.post("/reset/:category", settingController.resetSettings);

module.exports = router;
