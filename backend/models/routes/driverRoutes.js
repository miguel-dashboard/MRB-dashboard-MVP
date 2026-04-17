const express = require("express");
const {
  getDrivers,
  createDriver,
  updateDriver,
  updateDriverStatus,
} = require("../controllers/driverController");

const router = express.Router();

router.get("/", getDrivers);
router.post("/", createDriver);
router.put("/:id", updateDriver);
router.patch("/:id/status", updateDriverStatus);

module.exports = router;