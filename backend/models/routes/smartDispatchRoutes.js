const express = require("express");
const controller = require("../../controllers/smartDispatchController");
const router = express.Router();

router.get("/days", controller.listDays);
router.post("/days", controller.createDay);
router.get("/days/:id", controller.getDay);
router.patch("/days/:id", controller.updateDay);
router.post("/days/:id/orders", controller.addOrder);
router.patch("/days/:id/orders/:orderId", controller.updateOrder);
router.post("/days/:id/scans", controller.scanPackage);

module.exports = router;
