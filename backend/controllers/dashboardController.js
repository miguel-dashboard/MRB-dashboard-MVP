const Delivery = require("../models/Delivery");

const getDashboardSummary = async (req, res) => {
  try {
    const deliveries = await Delivery.find();

    const totalDeliveries = deliveries.length;

    const delivered = deliveries.filter(
      (item) => item.estado === "Entregada"
    ).length;

    const pending = deliveries.filter(
      (item) => item.estado === "Pendiente"
    ).length;

    const inRoute = deliveries.filter(
      (item) => item.estado === "En ruta"
    ).length;

    const incidents = deliveries.filter(
      (item) => item.estado === "Incidencia"
    ).length;

    const critical = deliveries.filter(
      (item) => item.prioridad === "Crítica"
    ).length;

    const warehouseProblems = deliveries.filter(
      (item) => item.origenProblema === "Bodega"
    ).length;

    res.json({
      totalDeliveries,
      delivered,
      pending,
      inRoute,
      incidents,
      critical,
      warehouseProblems,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener el resumen del dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardSummary,
};