const assert = require("node:assert/strict");
const { test } = require("node:test");
const { buildRecruitMessage } = require("../services/recruitMessageService");

const base = {
  nombre: "Arturo Bracho",
  operacion: "Starken - Hub Las Condes",
};

test("mensaje nuevo confirma interés y operación", () => {
  const message = buildRecruitMessage({ ...base, estado: "nuevo" });
  assert.match(message, /Hola Arturo/);
  assert.match(message, /Starken - Hub Las Condes/);
  assert.match(message, /confirmar/i);
});

test("mensaje interesado solicita checklist documental", () => {
  const message = buildRecruitMessage({ ...base, estado: "interesado" });
  for (const term of ["cédula", "licencia", "padrón", "permiso", "revisión", "SOAP"]) {
    assert.match(message, new RegExp(term, "i"));
  }
});

test("mensaje aprobado comunica siguiente coordinación", () => {
  const message = buildRecruitMessage({ ...base, estado: "aprobado" });
  assert.match(message, /aprobada/i);
  assert.match(message, /asignación/i);
});

test("mensaje rechazado es neutral y conserva futuras oportunidades", () => {
  const message = buildRecruitMessage({ ...base, estado: "rechazado" });
  assert.match(message, /gracias por postular/i);
  assert.match(message, /futuras oportunidades/i);
});
