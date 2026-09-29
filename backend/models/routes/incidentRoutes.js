const express = require("express");
const {
  getIncidents,
  createIncident,
  updateIncident,
} = require("../../controllers/incidentController");

const router = express.Router();

router.get("/", getIncidents);
router.post("/", createIncident);
router.put("/:id", updateIncident);

module.exports = router;
