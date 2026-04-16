const Vehicle = require("../models/Vehicle");

// Obtener todos los vehículos
const getVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener vehículos",
      error: error.message,
    });
  }
};

// Crear vehículo
const createVehicle = async (req, res) => {
  try {
    const { patente, tipo, marca, modelo, capacidad } = req.body;

    const existingVehicle = await Vehicle.findOne({
      patente: patente.toUpperCase(),
    });

    if (existingVehicle) {
      return res.status(400).json({
        message: "Ya existe un vehículo con esa patente",
      });
    }

    const newVehicle = new Vehicle({
      patente: patente.toUpperCase(),
      tipo,
      marca,
      modelo,
      capacidad,
      activo: true,
    });

    const savedVehicle = await newVehicle.save();
    res.status(201).json(savedVehicle);
  } catch (error) {
    res.status(500).json({
      message: "Error al crear vehículo",
      error: error.message,
    });
  }
};

// Editar vehículo
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { patente, tipo, marca, modelo, capacidad } = req.body;

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      {
        patente: patente.toUpperCase(),
        tipo,
        marca,
        modelo,
        capacidad,
      },
      { new: true, runValidators: true }
    );

    if (!updatedVehicle) {
      return res.status(404).json({
        message: "Vehículo no encontrado",
      });
    }

    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar vehículo",
      error: error.message,
    });
  }
};

// Cambiar estado activo/inactivo
const updateVehicleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      { activo },
      { new: true }
    );

    if (!updatedVehicle) {
      return res.status(404).json({
        message: "Vehículo no encontrado",
      });
    }

    res.json(updatedVehicle);
  } catch (error) {
    res.status(500).json({
      message: "Error al cambiar estado del vehículo",
      error: error.message,
    });
  }
};

module.exports = {
  getVehicles,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
};