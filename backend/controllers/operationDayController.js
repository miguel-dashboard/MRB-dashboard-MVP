const OperationDay = require("../models/OperationDay");

const normalizePayload = (body = {}) => {
  const paquetesAsignados = Number(body.paquetesAsignados || 0);
  const paquetesEntregados = Number(body.paquetesEntregados || 0);

  return {
    ...body,
    paquetesAsignados,
    paquetesEntregados,
    paquetesNoEntregados: Math.max(paquetesAsignados - paquetesEntregados, 0),
  };
};

const getOperationDays = async (req, res) => {
  try {
    const filter = {};

    if (req.query.operacion) {
      filter.operacion = req.query.operacion;
    }

    const records = await OperationDay.find(filter).sort({ fecha: -1, createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener la operación diaria",
      error: error.message,
    });
  }
};

const createOperationDay = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);

    if (payload.paquetesEntregados > payload.paquetesAsignados) {
      return res.status(400).json({
        message: "Los paquetes entregados no pueden superar los paquetes asignados",
      });
    }

    const record = await OperationDay.create(payload);
    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({
      message: "Error al registrar la operación diaria",
      error: error.message,
    });
  }
};

const updateOperationDay = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);

    if (payload.paquetesEntregados > payload.paquetesAsignados) {
      return res.status(400).json({
        message: "Los paquetes entregados no pueden superar los paquetes asignados",
      });
    }

    const record = await OperationDay.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!record) {
      return res.status(404).json({ message: "Registro operacional no encontrado" });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar la operación diaria",
      error: error.message,
    });
  }
};

module.exports = {
  getOperationDays,
  createOperationDay,
  updateOperationDay,
};
