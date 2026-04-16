const mongoose = require("mongoose");
const Delivery = require("../models/Delivery");

// GET - obtener todas las entregas
const getDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find().sort({ createdAt: -1 });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las entregas",
      error: error.message,
    });
  }
};

// GET - obtener una entrega por ID
const getDeliveryById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "ID de entrega inválido",
      });
    }

    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        message: "Entrega no encontrada",
      });
    }

    res.json(delivery);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener la entrega",
      error: error.message,
    });
  }
};

// POST - crear una nueva entrega
const createDelivery = async (req, res) => {
  try {
    const {
      cliente,
      bodega,
      fecha,
      comuna,
      direccion,
      chofer,
      vehiculo,
      horaCitacion,
      horaCarga,
      horaSalida,
      estado,
      prioridad,
      origenProblema,
      tipoIncidencia,
      observacion,
    } = req.body;

    const newDelivery = new Delivery({
      cliente,
      bodega,
      fecha,
      comuna,
      direccion,
      chofer,
      vehiculo,
      horaCitacion,
      horaCarga,
      horaSalida,
      estado,
      prioridad,
      origenProblema,
      tipoIncidencia,
      observacion,
    });

    const savedDelivery = await newDelivery.save();

    res.status(201).json({
      message: "Entrega creada correctamente",
      delivery: savedDelivery,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error al crear la entrega",
      error: error.message,
    });
  }
};

// PUT - actualizar una entrega
const updateDelivery = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "ID de entrega inválido",
      });
    }

    const updatedDelivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedDelivery) {
      return res.status(404).json({
        message: "Entrega no encontrada",
      });
    }

    res.json({
      message: "Entrega actualizada correctamente",
      delivery: updatedDelivery,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar la entrega",
      error: error.message,
    });
  }
};

// DELETE - eliminar una entrega
const deleteDelivery = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "ID de entrega inválido",
      });
    }

    const deletedDelivery = await Delivery.findByIdAndDelete(req.params.id);

    if (!deletedDelivery) {
      return res.status(404).json({
        message: "Entrega no encontrada",
      });
    }

    res.json({
      message: "Entrega eliminada correctamente",
      delivery: deletedDelivery,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar la entrega",
      error: error.message,
    });
  }
};

module.exports = {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery,
};