const express = require("express");
const {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
} = require("../../controllers/starkenHubController");

const router = express.Router();

router.get("/", getRecords);
router.post("/", createRecord);
router.put("/:id", updateRecord);
router.delete("/:id", deleteRecord);

module.exports = router;
