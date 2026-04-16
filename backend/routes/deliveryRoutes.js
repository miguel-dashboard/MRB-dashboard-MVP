const express = require("express");
const router = express.Router();

const {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} = require("../controllers/deliveryController");

// Obtener todas las entregas
router.get("/", getDeliveries);

// Obtener una entrega por ID
router.get("/:id", getDeliveryById);

// Crear una nueva entrega
router.post("/", createDelivery);

// Actualizar una entrega
router.put("/:id", updateDelivery);

// Eliminar una entrega
router.delete("/:id", deleteDelivery);

module.exports = router;