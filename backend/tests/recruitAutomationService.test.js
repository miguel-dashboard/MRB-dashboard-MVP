const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  buildRecruitAutomation,
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
