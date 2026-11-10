const assert = require("node:assert/strict");
const { test } = require("node:test");
const RecruitApplicant = require("../models/RecruitApplicant");
const {
  updateRecruitApplicantStatus,
} = require("../controllers/recruitApplicantController");

const VALID_ID = "507f1f77bcf86cd799439011";

async function changeStatus(t, currentApplicant, estado) {
  let updatePayload = null;

  const findById = t.mock.method(
    RecruitApplicant,
    "findById",
    async () => currentApplicant
  );

  const findByIdAndUpdate = t.mock.method(
    RecruitApplicant,
    "findByIdAndUpdate",
    async (_id, update) => {
      updatePayload = update;
      return { ...currentApplicant, ...update, _id: VALID_ID };
    }
  );

  const response = { statusCode: 200 };
  const res = {
    status(code) {
      response.statusCode = code;
      return this;
    },
    json(data) {
      response.body = data;
      return this;
    },
  };

  try {
    await updateRecruitApplicantStatus(
      { params: { id: VALID_ID }, body: { estado } },
      res
    );
    return { ...response, updatePayload };
  } finally {
    findById.mock.restore();
    findByIdAndUpdate.mock.restore();
  }
}

test("contactado reemplaza la acción automática inicial", async (t) => {
  const result = await changeStatus(
    t,
    {
      estado: "nuevo",
      proximaAccion: "Contactar postulante",
      fechaProximaAccion: new Date(),
      fechaPrimerContacto: null,
    },
    "contactado"
  );

  assert.equal(result.statusCode, 200);
  assert.equal(result.updatePayload.proximaAccion, "Confirmar interés");
  assert.ok(result.updatePayload.fechaProximaAccion instanceof Date);
  assert.ok(result.updatePayload.fechaPrimerContacto instanceof Date);
  assert.ok(result.updatePayload.fechaUltimoContacto instanceof Date);
});

test("respeta una próxima acción escrita manualmente", async (t) => {
  const result = await changeStatus(
    t,
    {
      estado: "contactado",
      proximaAccion: "Llamar nuevamente el viernes",
      fechaProximaAccion: new Date("2026-11-13T15:00:00.000Z"),
      fechaPrimerContacto: new Date("2026-11-09T12:00:00.000Z"),
    },
    "interesado"
  );

  assert.equal(result.statusCode, 200);
  assert.equal(Object.hasOwn(result.updatePayload, "proximaAccion"), false);
  assert.equal(Object.hasOwn(result.updatePayload, "fechaProximaAccion"), false);
});

test("rechazado cierra el seguimiento aunque hubiera una acción manual", async (t) => {
  const result = await changeStatus(
    t,
    {
      estado: "interesado",
      proximaAccion: "Llamar nuevamente el viernes",
      fechaProximaAccion: new Date("2026-11-13T15:00:00.000Z"),
    },
    "rechazado"
  );

  assert.equal(result.statusCode, 200);
  assert.equal(result.updatePayload.proximaAccion, "");
  assert.equal(result.updatePayload.fechaProximaAccion, null);
});
