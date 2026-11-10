const assert = require("node:assert/strict");
const { test } = require("node:test");
const RecruitApplicant = require("../models/RecruitApplicant");

test("Recruit inicializa checklist documental vacío", async () => {
  const applicant = new RecruitApplicant({
    nombre: "Prueba documentos",
    telefono: "+56912345678",
  });

  await applicant.validate();

  assert.deepEqual(applicant.documentacion.toObject(), {
    cedula: false,
    licenciaConducir: false,
    padronVehiculo: false,
    permisoCirculacion: false,
    revisionTecnica: false,
    soap: false,
  });
});

test("Recruit conserva documentos marcados", async () => {
  const applicant = new RecruitApplicant({
    nombre: "Prueba documentos",
    telefono: "+56912345678",
    documentacion: {
      cedula: true,
      licenciaConducir: true,
      padronVehiculo: false,
      permisoCirculacion: false,
      revisionTecnica: false,
      soap: true,
    },
  });

  await applicant.validate();

  assert.equal(applicant.documentacion.cedula, true);
  assert.equal(applicant.documentacion.licenciaConducir, true);
  assert.equal(applicant.documentacion.soap, true);
  assert.equal(applicant.documentacion.padronVehiculo, false);
});
