const express = require("express");
const router = express.Router();
const { registerRobot, updateTelemetry } = require("../controllers/robotController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").post(protect, authorize("admin"), registerRobot);
router.route("/telemetry").post(updateTelemetry);

module.exports = router;