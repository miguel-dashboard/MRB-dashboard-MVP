const STARKEN_OPERATION = "Starken - Hub Las Condes";
const CHILEXPRESS_OPERATION = "Chilexpress";

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

module.exports = {
  STARKEN_OPERATION,
  CHILEXPRESS_OPERATION,
  buildRecruitAutomation,
};
