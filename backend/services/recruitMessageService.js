function firstName(applicant) {
  return String(applicant?.nombre || "").trim().split(/\s+/)[0] || "";
}

function operationLabel(applicant) {
  return applicant?.operacion || "una operación de MR&B";
}

function buildRecruitMessage(applicant = {}) {
  const name = firstName(applicant);
  const greeting = name ? `Hola ${name},` : "Hola,";
  const operation = operationLabel(applicant);

  switch (applicant.estado) {
    case "nuevo":
      return `${greeting} te contactamos desde MR&B Recruit por tu postulación para ${operation}. Queremos confirmar si sigues interesado/a y disponible para avanzar en el proceso.`;
    case "contactado":
      return `${greeting} gracias por conversar con MR&B Recruit. Queremos confirmar tu interés para continuar con el proceso de ${operation}. Si sigues disponible, respóndenos por este medio.`;
    case "interesado":
      return `${greeting} para continuar con tu postulación a ${operation}, necesitamos validar tu documentación. Por favor ten disponible: cédula, licencia de conducir, padrón del vehículo, permiso de circulación, revisión técnica y SOAP vigente.`;
    case "documentacion_pendiente":
      return `${greeting} aún tenemos documentación pendiente para tu postulación a ${operation}. Por favor envía los antecedentes faltantes por este medio para completar la validación.`;
    case "en_revision":
      return `${greeting} recibimos tu documentación para ${operation} y está en revisión. Te contactaremos cuando terminemos la validación.`;
    case "aprobado":
      return `${greeting} tu postulación fue aprobada para continuar en el proceso de ${operation}. El equipo MR&B se contactará contigo para coordinar asignación e inicio operacional.`;
    case "convertido_a_chofer":
      return `${greeting} tu incorporación a ${operation} quedó registrada. Bienvenido/a a MR&B. Te contactaremos por este medio para coordinaciones operacionales.`;
    case "rechazado":
      return `${greeting} gracias por postular a MR&B Recruit. En esta oportunidad no podremos continuar con tu incorporación a ${operation}. Conservaremos tus antecedentes para futuras oportunidades compatibles.`;
    default:
      return `${greeting} te contactamos desde MR&B Recruit para dar seguimiento a tu postulación para ${operation}.`;
  }
}

module.exports = { buildRecruitMessage };
