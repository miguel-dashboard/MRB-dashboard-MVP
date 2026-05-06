const express = require("express");
const {
  getVehicles,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
} = require("../../controllers/vehicleController");

const router = express.Router();

router.get("/", getVehicles);
router.post("/", createVehicle);
router.put("/:id", updateVehicle);
router.patch("/:id/status", updateVehicleStatus);

module.exports = router;
