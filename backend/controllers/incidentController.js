const Incident = require("../models/Incident");

const normalizeNumbers = (body = {}) => ({
  ...body,
  impactoMinutos: Number(body.impactoMinutos || 0),
  paquetesAfectados: Number(body.paquetesAfectados || 0),
});

const getIncidents = async (req, res) => {
  try {
    const filter = {};

    if (req.query.operacion) filter.operacion = req.query.operacion;
    if (req.query.estado) filter.estado = req.query.estado;

    const incidents = await Incident.find(filter).sort({
      fecha: -1,
      createdAt: -1,
    });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener incidencias",
      error: error.message,
    });
  }
};

const createIncident = async (req, res) => {
  try {
    const incident = await Incident.create(normalizeNumbers(req.body));
    res.status(201).json(incident);
  } catch (error) {
    res.status(400).json({
      message: "Error al registrar incidencia",
      error: error.message,
    });
  }
};

const updateIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      normalizeNumbers(req.body),
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ message: "Incidencia no encontrada" });
    }

    res.json(incident);
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar incidencia",
      error: error.message,
    });
  }
};

module.exports = {
  getIncidents,
  createIncident,
  updateIncident,
};
