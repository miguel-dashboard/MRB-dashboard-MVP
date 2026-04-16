const Driver = require("../models/Driver");

// Obtener todos los choferes
const getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener choferes",
      error: error.message,
    });
  }
};

// Crear chofer
const createDriver = async (req, res) => {
  try {
    const { nombre, rut, telefono, email, tipoLicencia } = req.body;

    const existingDriver = await Driver.findOne({ rut });

    if (existingDriver) {
      return res.status(400).json({
        message: "Ya existe un chofer con ese RUT",
      });
    }

    const newDriver = new Driver({
      nombre,
      rut,
      telefono,
      email,
      tipoLicencia,
      activo: true,
    });

    const savedDriver = await newDriver.save();
    res.status(201).json(savedDriver);
  } catch (error) {
    res.status(500).json({
      message: "Error al crear chofer",
      error: error.message,
    });
  }
};

// Editar chofer
const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, rut, telefono, email, tipoLicencia } = req.body;

    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      { nombre, rut, telefono, email, tipoLicencia },
      { new: true, runValidators: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({
        message: "Chofer no encontrado",
      });
    }

    res.json(updatedDriver);
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar chofer",
      error: error.message,
    });
  }
};

// Cambiar estado activo/inactivo
const updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const updatedDriver = await Driver.findByIdAndUpdate(
      id,
      { activo },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({
        message: "Chofer no encontrado",
      });
    }

    res.json(updatedDriver);
  } catch (error) {
    res.status(500).json({
      message: "Error al cambiar estado del chofer",
      error: error.message,
    });
  }
};

module.exports = {
  getDrivers,
  createDriver,
  updateDriver,
  updateDriverStatus,
};