const express = require("express");
const router = express.Router();
const { createTable, getTables, updateTableStatus } = require("../controllers/tableController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").post(protect, createTable).get(protect, getTables);
router.route("/:id/status").put(protect, updateTableStatus);

module.exports = router;