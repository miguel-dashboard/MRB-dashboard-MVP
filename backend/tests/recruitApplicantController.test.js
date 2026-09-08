const assert = require("node:assert/strict");
const { test } = require("node:test");
const RecruitApplicant = require("../models/RecruitApplicant");
const { createRecruitApplicant } = require("../controllers/recruitApplicantController");

async function submit(t, body) {
  let saved;
  // Validar el modelo real sin conectar ni escribir a MongoDB.
  const save = t.mock.method(RecruitApplicant.prototype, "save", async function () {
    await this.validate();
    saved = this.toObject();
    return this;
  });
  const response = { statusCode: 200 };
  const res = {
    status(code) { response.statusCode = code; return this; },
    json(data) { response.body = data; return this; },
  };
  try {
    await createRecruitApplicant({ body }, res);
    return { ...response, saved };
  } finally {
    save.mock.restore();
  }
}

const landing = {
  nombre: "Prueba landing", telefono: "+56 9 1234 5678", comuna: "Santiago",
  tipoVehiculo: "Furgones", operacion: "Chilexpress", disponibilidad: "inmediata",
  experiencia: "Reparto urbano", observacion: "Disponible en la mañana",
};

test("conserva el payload de la landing y normaliza el teléfono", async (t) => {
  const { statusCode, saved } = await submit(t, landing);
  assert.equal(statusCode, 201);
  for (const [key, value] of Object.entries(landing)) {
    assert.equal(saved[key], key === "telefono" ? "+56912345678" : value);
  }
  assert.equal(saved.fuente, "manual");
});

test("conserva los datos del formulario actual del dashboard", async (t) => {
  const body = {
    nombre: "Prueba", apellido: "Dashboard", telefono: "912345678",
    whatsapp: "+56987654321", comuna: "Santiago", region: "Metropolitana",
    tipoPostulante: "flota", tipoVehiculo: "Furgón", patente: "ABCD12",
    capacidadCarga: "1000 kg", anosExperiencia: 3, disponibilidad: "esta_semana",
    campaignName: "Brightcell", notas: "Tengo dos vehículos", fuente: "manual",
    estado: "nuevo", prioridad: "media",
  };
  const { statusCode, saved } = await submit(t, body);
  assert.equal(statusCode, 201);
  for (const [key, value] of Object.entries(body)) assert.equal(saved[key], key === "telefono" ? "+56912345678" : value);
});

test("ignora campos internos, desconocidos y otros atributos del modelo", async (t) => {
  const baseline = (await submit(t, landing)).saved;
  const injected = {
    estado: "aprobado", status: "approved", prioridad: "alta", priority: "high",
    aprobado: true, rejected: true, notasInternas: "privado", assignedTo: "admin",
    createdBy: "admin", updatedBy: "admin", historial: ["aprobado"], fechaContacto: "2026-01-01",
    score: 100, asignadoA: "admin", fechaPrimerContacto: "2026-01-01",
    fechaUltimoContacto: "2026-01-01", proximaAccion: "activar",
    fechaProximaAccion: "2026-01-01", whatsappOptIn: true, whatsappStatus: "enviado",
    lastWhatsappMessageAt: "2026-01-01", campaignId: "interno", createdAt: "2000-01-01",
    updatedAt: "2000-01-01", _id: "000000000000000000000001", __v: 99,
    rut: "no solicitado", email: "no-solicitado@example.test", tieneVehiculo: true,
    tipoLicencia: "A5", zonasDisponibles: ["otra"], utmSource: "inyectado",
    utmMedium: "inyectado", utmCampaign: "inyectado", utmContent: "inyectado",
  };
  const { statusCode, saved } = await submit(t, { ...landing, ...injected });
  assert.equal(statusCode, 201);
  assert.notEqual(String(saved._id), injected._id);
  for (const key of Object.keys(injected).filter((key) => key !== "_id")) {
    assert.deepEqual(saved[key], baseline[key], key);
  }
  assert.equal(saved.estado, "nuevo");
  assert.equal(saved.prioridad, "media");
});

test("mantiene las validaciones de teléfono y fuente del modelo", async (t) => {
  for (const telefono of ["", "   ", "abc", "123", "000000000", null, {}]) {
    const result = await submit(t, { ...landing, telefono });
    assert.equal(result.statusCode, 400);
    assert.equal(result.saved, undefined);
  }
  assert.equal((await submit(t, { ...landing, fuente: "facebook_ads" })).statusCode, 201);
  const invalid = await submit(t, { ...landing, fuente: "fuente_invalida" });
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.saved, undefined);
});
