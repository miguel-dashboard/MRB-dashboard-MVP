const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  buildRecruitAutomation,
  buildStatusAutomation,
  isAutomatedAction,
} = require("../services/recruitAutomationService");

test("Starken asigna Ricardo, prioridad alta y plazo de 2 horas", () => {
  const now = new Date("2026-11-09T12:00:00.000Z");
  const result = buildRecruitAutomation("Starken - Hub Las Condes", now);

  assert.equal(result.asignadoA, "Ricardo");
  assert.equal(result.prioridad, "alta");
  assert.equal(result.proximaAccion, "Contactar postulante");
  assert.equal(
    result.fechaProximaAccion.toISOString(),
    "2026-11-09T14:00:00.000Z"
  );
});

test("Chilexpress asigna coordinación y plazo de 4 horas", () => {
  const now = new Date("2026-11-09T12:00:00.000Z");
  const result = buildRecruitAutomation("Chilexpress", now);

  assert.equal(result.asignadoA, "Coordinación Chilexpress");
  assert.equal(result.prioridad, "media");
  assert.equal(result.proximaAccion, "Contactar postulante");
  assert.equal(
    result.fechaProximaAccion.toISOString(),
    "2026-11-09T16:00:00.000Z"
  );
});

test("otras operaciones quedan pendientes de revisión", () => {
  const now = new Date("2026-11-09T12:00:00.000Z");
  const result = buildRecruitAutomation("", now);

  assert.equal(result.asignadoA, "");
  assert.equal(result.prioridad, "media");
  assert.equal(result.proximaAccion, "Revisar postulación");
  assert.equal(
    result.fechaProximaAccion.toISOString(),
    "2026-11-09T20:00:00.000Z"
  );
});


test("pipeline crea la siguiente acción según estado", () => {
  const now = new Date("2026-11-09T12:00:00.000Z");

  const contacted = buildStatusAutomation("contactado", now);
  assert.equal(contacted.proximaAccion, "Confirmar interés");
  assert.equal(contacted.fechaProximaAccion.toISOString(), "2026-11-09T16:00:00.000Z");

  const interested = buildStatusAutomation("interesado", now);
  assert.equal(interested.proximaAccion, "Solicitar documentos");
  assert.equal(interested.fechaProximaAccion.toISOString(), "2026-11-09T14:00:00.000Z");

  const documents = buildStatusAutomation("documentacion_pendiente", now);
  assert.equal(documents.proximaAccion, "Revisar documentos");
  assert.equal(documents.fechaProximaAccion.toISOString(), "2026-11-10T12:00:00.000Z");

  const approved = buildStatusAutomation("aprobado", now);
  assert.equal(approved.proximaAccion, "Asignar a operación");
  assert.equal(approved.fechaProximaAccion.toISOString(), "2026-11-09T20:00:00.000Z");
});

test("estados finales cierran seguimiento", () => {
  const now = new Date("2026-11-09T12:00:00.000Z");

  for (const status of ["convertido_a_chofer", "rechazado"]) {
    const result = buildStatusAutomation(status, now);
    assert.equal(result.proximaAccion, "");
    assert.equal(result.fechaProximaAccion, null);
  }
});

test("reconoce solo acciones generadas por automatización", () => {
  assert.equal(isAutomatedAction("Contactar postulante"), true);
  assert.equal(isAutomatedAction("Confirmar interés"), true);
  assert.equal(isAutomatedAction("Llamar nuevamente el viernes"), false);
});
