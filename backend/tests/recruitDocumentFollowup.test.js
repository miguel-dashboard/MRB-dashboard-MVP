const assert = require("node:assert/strict");
const { test } = require("node:test");
const RecruitApplicant = require("../models/RecruitApplicant");
const {
  updateRecruitApplicantDocuments,
} = require("../controllers/recruitApplicantController");

const applicantId = "000000000000000000000001";

async function updateDocuments(t, applicant, documentacion) {
  let updatePayload;
  t.mock.method(RecruitApplicant, "findById", async () => applicant);
  t.mock.method(RecruitApplicant, "findByIdAndUpdate", async (_id, payload) => {
    updatePayload = payload;
    return { ...applicant, ...payload };
  });

  const response = { statusCode: 200, body: null };
  const res = {
    status(code) { response.statusCode = code; return this; },
    json(body) { response.body = body; return this; },
  };

  await updateRecruitApplicantDocuments(
    { params: { id: applicantId }, body: { documentacion } },
    res
  );

  return { ...response, updatePayload };
}

const manualFollowup = {
  estado: "interesado",
  proximaAccion: "Llamar nuevamente el viernes",
  fechaProximaAccion: new Date("2026-11-13T14:00:00.000Z"),
};

test("documentos parciales conservan acción y fecha definidas manualmente", async (t) => {
  const { statusCode, updatePayload } = await updateDocuments(
    t,
    manualFollowup,
    { cedula: true }
  );

  assert.equal(statusCode, 200);
  assert.equal(updatePayload.estado, "documentacion_pendiente");
  assert.equal(updatePayload.documentacion.cedula, true);
  assert.equal(Object.hasOwn(updatePayload, "proximaAccion"), false);
  assert.equal(Object.hasOwn(updatePayload, "fechaProximaAccion"), false);
});

test("documentación 6/6 cambia a revisión pero conserva seguimiento manual", async (t) => {
  const complete = {
    cedula: true,
    licenciaConducir: true,
    padronVehiculo: true,
    permisoCirculacion: true,
    revisionTecnica: true,
    soap: true,
  };
  const { statusCode, body, updatePayload } = await updateDocuments(
    t,
    { ...manualFollowup, estado: "documentacion_pendiente" },
    complete
  );

  assert.equal(statusCode, 200);
  assert.equal(body.progress.complete, true);
  assert.equal(updatePayload.estado, "en_revision");
  assert.equal(Object.hasOwn(updatePayload, "proximaAccion"), false);
  assert.equal(Object.hasOwn(updatePayload, "fechaProximaAccion"), false);
});

test("documentos parciales sí reemplazan una acción automática", async (t) => {
  const { statusCode, updatePayload } = await updateDocuments(
    t,
    {
      estado: "interesado",
      proximaAccion: "Solicitar documentos",
      fechaProximaAccion: new Date("2026-11-11T14:00:00.000Z"),
    },
    { cedula: true }
  );

  assert.equal(statusCode, 200);
  assert.equal(updatePayload.estado, "documentacion_pendiente");
  assert.equal(updatePayload.proximaAccion, "Completar documentos");
  assert.ok(updatePayload.fechaProximaAccion instanceof Date);
});

test("documentos completos no reabren estados finales", async (t) => {
  const complete = {
    cedula: true,
    licenciaConducir: true,
    padronVehiculo: true,
    permisoCirculacion: true,
    revisionTecnica: true,
    soap: true,
  };
  const { statusCode, updatePayload } = await updateDocuments(
    t,
    { ...manualFollowup, estado: "rechazado" },
    complete
  );

  assert.equal(statusCode, 200);
  assert.equal(Object.hasOwn(updatePayload, "estado"), false);
  assert.equal(Object.hasOwn(updatePayload, "proximaAccion"), false);
  assert.equal(Object.hasOwn(updatePayload, "fechaProximaAccion"), false);
});
