const express = require("express");
const {
  getOperationDays,
  createOperationDay,
  updateOperationDay,
} = require("../../controllers/operationDayController");

const router = express.Router();

router.get("/", getOperationDays);
router.post("/", createOperationDay);
router.put("/:id", updateOperationDay);

module.exports = router;
