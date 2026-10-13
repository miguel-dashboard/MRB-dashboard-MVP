const Delivery = require("../models/Delivery");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const OperationDay = require("../models/OperationDay");
const Incident = require("../models/Incident");
const RecruitApplicant = require("../models/RecruitApplicant");

const dateKey = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("sv-SE");
};

const waitMinutes = (start, end) => {
  if (!start || !end) return 0;
  const [startHour, startMinute] = String(start).split(":").map(Number);
  const [endHour, endMinute] = String(end).split(":").map(Number);

  if (
    [startHour, startMinute, endHour, endMinute].some((value) =>
      Number.isNaN(value)
    )
  ) {
    return 0;
  }

  const diff =
    endHour * 60 + endMinute - (startHour * 60 + startMinute);

  return diff > 0 ? diff : 0;
};

const getDashboardSummary = async (req, res) => {
  try {
    const [
      deliveries,
      drivers,
      vehicles,
      operationDays,
      incidents,
      applicants,
    ] = await Promise.all([
      Delivery.find().lean(),
      Driver.find().lean(),
      Vehicle.find().lean(),
      OperationDay.find().sort({ fecha: -1, createdAt: -1 }).lean(),
      Incident.find().sort({ fecha: -1, createdAt: -1 }).lean(),
      RecruitApplicant.find().sort({ createdAt: -1 }).lean(),
    ]);

    const today = new Date().toLocaleDateString("sv-SE");
    const todayOperations = operationDays.filter(
      (item) => dateKey(item.fecha || item.createdAt) === today
    );

    const totalAssigned = operationDays.reduce(
      (sum, item) => sum + Number(item.paquetesAsignados || 0),
      0
    );
    const totalDelivered = operationDays.reduce(
      (sum, item) => sum + Number(item.paquetesEntregados || 0),
      0
    );

    const compliance =
      totalAssigned > 0
        ? Math.round((totalDelivered / totalAssigned) * 100)
        : 0;

    const waits = operationDays
      .map((item) => waitMinutes(item.horaCitacion, item.horaCarga))
      .filter((value) => value > 0);

    const averageWait =
      waits.length > 0
        ? Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length)
        : 0;

    const operationMap = {};
    operationDays.forEach((item) => {
      const key = item.operacion || "Sin operación";

      if (!operationMap[key]) {
        operationMap[key] = {
          operacion: key,
          jornadas: 0,
          paquetesAsignados: 0,
          paquetesEntregados: 0,
          conProblema: 0,
        };
      }

      operationMap[key].jornadas += 1;
      operationMap[key].paquetesAsignados += Number(item.paquetesAsignados || 0);
      operationMap[key].paquetesEntregados += Number(item.paquetesEntregados || 0);

      if (item.estado === "Incidencia" || item.problemaPrincipal) {
        operationMap[key].conProblema += 1;
      }
    });

    const operations = Object.values(operationMap).map((item) => ({
      ...item,
      cumplimiento:
        item.paquetesAsignados > 0
          ? Math.round(
              (item.paquetesEntregados / item.paquetesAsignados) * 100
            )
          : 0,
    }));

    const openIncidents = incidents.filter(
      (item) => item.estado !== "Resuelta"
    );
    const criticalIncidents = incidents.filter(
      (item) => item.severidad === "Crítica"
    );
    const warehouseIncidents = incidents.filter(
      (item) => item.origen === "Bodega"
    );
    const incidentImpactMinutes = incidents.reduce(
      (sum, item) => sum + Number(item.impactoMinutos || 0),
      0
    );
    const incidentPackages = incidents.reduce(
      (sum, item) => sum + Number(item.paquetesAfectados || 0),
      0
    );

    const recruitCounts = applicants.reduce((acc, item) => {
      acc[item.estado] = (acc[item.estado] || 0) + 1;
      return acc;
    }, {});

    const recruitByOperationMap = {};
    applicants.forEach((item) => {
      const key = item.campaignName || item.operacion || "Sin asignar";
      recruitByOperationMap[key] = (recruitByOperationMap[key] || 0) + 1;
    });

    const legacyTodayDeliveries = deliveries.filter(
      (item) => dateKey(item.fecha || item.createdAt) === today
    ).length;

    res.json({
      system: {
        backend: "Online",
        generatedAt: new Date().toISOString(),
      },
      fleet: {
        activeVehicles: vehicles.filter((item) => item.activo !== false).length,
        activeDrivers: drivers.filter((item) => item.activo !== false).length,
      },
      operation: {
        todayJornadas: todayOperations.length,
        totalJornadas: operationDays.length,
        paquetesAsignados: totalAssigned,
        paquetesEntregados: totalDelivered,
        cumplimiento: compliance,
        averageWait,
        withProblems: operationDays.filter(
          (item) => item.estado === "Incidencia" || item.problemaPrincipal
        ).length,
        operations,
      },
      incidents: {
        total: incidents.length,
        open: openIncidents.length,
        critical: criticalIncidents.length,
        warehouse: warehouseIncidents.length,
        impactMinutes: incidentImpactMinutes,
        packagesAffected: incidentPackages,
        recent: incidents.slice(0, 5),
      },
      recruit: {
        total: applicants.length,
        new: recruitCounts.nuevo || 0,
        contacted: recruitCounts.contactado || 0,
        interested: recruitCounts.interesado || 0,
        documentationPending: recruitCounts.documentacion_pendiente || 0,
        review: recruitCounts.en_revision || 0,
        approved: recruitCounts.aprobado || 0,
        converted: recruitCounts.convertido_a_chofer || 0,
        rejected: recruitCounts.rechazado || 0,
        byOperation: Object.entries(recruitByOperationMap)
          .map(([operacion, total]) => ({ operacion, total }))
          .sort((a, b) => b.total - a.total),
      },
      legacyDeliveries: {
        today: legacyTodayDeliveries,
        delivered: deliveries.filter((item) => item.estado === "Entregada").length,
        pending: deliveries.filter((item) =>
          ["Pendiente", "En ruta"].includes(item.estado)
        ).length,
      },
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
