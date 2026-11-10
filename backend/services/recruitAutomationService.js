const STARKEN_OPERATION = "Starken - Hub Las Condes";
const CHILEXPRESS_OPERATION = "Chilexpress";

const AUTOMATED_ACTIONS = new Set([
  "Contactar postulante",
  "Confirmar interés",
  "Solicitar documentos",
  "Revisar documentos",
  "Completar documentos",
  "Asignar a operación",
  "Revisar postulación",
]);

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function buildRecruitAutomation(operation, now = new Date()) {
  const normalizedOperation = String(operation || "").trim().toLowerCase();

  if (normalizedOperation.includes("starken")) {
    return {
      asignadoA: "Ricardo",
      prioridad: "alta",
      proximaAccion: "Contactar postulante",
      fechaProximaAccion: addHours(now, 2),
    };
  }

  if (normalizedOperation.includes("chilexpress")) {
    return {
      asignadoA: "Coordinación Chilexpress",
      prioridad: "media",
      proximaAccion: "Contactar postulante",
      fechaProximaAccion: addHours(now, 4),
    };
  }

  return {
    asignadoA: "",
    prioridad: "media",
    proximaAccion: "Revisar postulación",
    fechaProximaAccion: addHours(now, 8),
  };
}

function buildStatusAutomation(status, now = new Date()) {
  switch (status) {
    case "contactado":
      return {
        proximaAccion: "Confirmar interés",
        fechaProximaAccion: addHours(now, 4),
      };
    case "interesado":
      return {
        proximaAccion: "Solicitar documentos",
        fechaProximaAccion: addHours(now, 2),
      };
    case "documentacion_pendiente":
      return {
        proximaAccion: "Revisar documentos",
        fechaProximaAccion: addHours(now, 24),
      };
    case "aprobado":
      return {
        proximaAccion: "Asignar a operación",
        fechaProximaAccion: addHours(now, 8),
      };
    case "convertido_a_chofer":
    case "rechazado":
      return {
        proximaAccion: "",
        fechaProximaAccion: null,
      };
    default:
      return null;
  }
}

function isAutomatedAction(action) {
  return AUTOMATED_ACTIONS.has(String(action || "").trim());
}

const DOCUMENT_FIELDS = [
  "cedula",
  "licenciaConducir",
  "padronVehiculo",
  "permisoCirculacion",
  "revisionTecnica",
  "soap",
];

function getDocumentProgress(documentacion = {}) {
  const received = DOCUMENT_FIELDS.filter(
    (key) => Boolean(documentacion?.[key])
  ).length;

  return {
    received,
    total: DOCUMENT_FIELDS.length,
    complete: received === DOCUMENT_FIELDS.length,
  };
}

function buildDocumentAutomation(currentStatus, documentacion, now = new Date()) {
  const progress = getDocumentProgress(documentacion);

  if (
    progress.complete &&
    !["aprobado", "convertido_a_chofer", "rechazado"].includes(currentStatus)
  ) {
    return {
      estado: "en_revision",
      proximaAccion: "Revisar documentos",
      fechaProximaAccion: addHours(now, 24),
      progress,
    };
  }

  if (
    progress.received > 0 &&
    ["interesado", "documentacion_pendiente"].includes(currentStatus)
  ) {
    return {
      estado: "documentacion_pendiente",
      proximaAccion: "Completar documentos",
      fechaProximaAccion: addHours(now, 24),
      progress,
    };
  }

  return { progress };
}

module.exports = {
  STARKEN_OPERATION,
  CHILEXPRESS_OPERATION,
  AUTOMATED_ACTIONS,
  buildRecruitAutomation,
  buildStatusAutomation,
  isAutomatedAction,
  DOCUMENT_FIELDS,
  getDocumentProgress,
  buildDocumentAutomation,
};
