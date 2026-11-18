const assert = require("node:assert/strict");
const { test } = require("node:test");
const { randomUUID } = require("node:crypto");
const mongoose = require("mongoose");
const app = require("../server");
const RecruitApplicant = require("../models/RecruitApplicant");

const uri = process.env.RECRUIT_TEST_MONGODB_URI;

test("Recruit V3: HTTP, automatización y persistencia real en MongoDB aislado", {
  skip: !uri && "Configurar RECRUIT_TEST_MONGODB_URI para integración real",
  timeout: 60000,
}, async (t) => {
  // Exclusivamente una base temporal en un MongoDB local de pruebas.
  // No usar MONGODB_URI ni eliminar una base preexistente.
  const parsed = new URL(uri);
  assert.equal(parsed.protocol, "mongodb:");
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname));
  const dbName = `recruit_test_${randomUUID().replaceAll("-", "")}`;
  const previousEnv = process.env.NODE_ENV;
  const previousToken = process.env.INTERNAL_API_TOKEN;
  const token = randomUUID();
  process.env.NODE_ENV = "production";
  process.env.INTERNAL_API_TOKEN = token;

  let server;
  t.after(async () => {
    try {
      if (server) await new Promise(resolve => server.close(resolve));
      if (mongoose.connection.readyState === 1) {
        assert.equal(mongoose.connection.name, dbName);
        await mongoose.connection.dropDatabase();
      }
    } finally {
      await mongoose.disconnect();
      if (previousEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousEnv;
      if (previousToken === undefined) delete process.env.INTERNAL_API_TOKEN;
      else process.env.INTERNAL_API_TOKEN = previousToken;
    }
  });

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  assert.equal(mongoose.connection.name, dbName);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/recruit/applicants`;
  async function request(method, path = "", body, authorized = true) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authorized ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  }

  const complete = {
    cedula: true, licenciaConducir: true, padronVehiculo: true,
    permisoCirculacion: true, revisionTecnica: true, soap: true,
  };
  let manualId;
  let automaticId;

  await t.test("postulación pública guarda operación y genera responsable y tarea", async () => {
    for (const [operacion, responsable] of [
      ["Starken - Hub Las Condes", "Ricardo"],
      ["Chilexpress", "Coordinación Chilexpress"],
    ]) {
      const result = await request("POST", "", {
        nombre: "Postulante ficticio", telefono: "912345678",
        operacion, estado: "aprobado", asignadoA: "no autorizado",
      }, false);
      assert.equal(result.status, 201);
      const saved = await RecruitApplicant.findById(result.body.applicant._id).lean();
      assert.equal(saved.operacion, operacion);
      assert.equal(saved.asignadoA, responsable);
      assert.equal(saved.estado, "nuevo");
      assert.equal(saved.proximaAccion, "Contactar postulante");
      assert.ok(saved.fechaProximaAccion instanceof Date);
      if (operacion.startsWith("Starken")) manualId = String(saved._id);
      else automaticId = String(saved._id);
    }
    assert.equal(await RecruitApplicant.countDocuments(), 2);
  });

  await t.test("rutas internas requieren autorización en producción", async () => {
    assert.equal((await request("GET", "", undefined, false)).status, 401);
    assert.equal((await request("GET", `/${manualId}`, undefined, false)).status, 401);
    assert.equal((await request("PATCH", `/${manualId}/documents`,
      { documentacion: complete }, false)).status, 401);
    const saved = await RecruitApplicant.findById(manualId).lean();
    assert.equal(saved.documentacion.cedula, false);
    assert.equal((await request("GET", "")).status, 200);
  });

  await t.test("checklist parcial y completo preservan tarea manual y vencimiento", async () => {
    const due = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const action = "Llamar nuevamente el viernes";
    assert.equal((await request("PATCH", `/${manualId}/status`,
      { estado: "interesado" })).status, 200);
    assert.equal((await request("PUT", `/${manualId}`,
      { proximaAccion: action, fechaProximaAccion: due })).status, 200);
    for (const [documentacion, expectedStatus, expectedCount] of [
      [{ cedula: true }, "documentacion_pendiente", 1],
      [complete, "en_revision", 6],
    ]) {
      const result = await request("PATCH", `/${manualId}/documents`, { documentacion });
      assert.equal(result.status, 200);
      assert.equal(result.body.progress.received, expectedCount);
      const saved = await RecruitApplicant.findById(manualId).lean();
      assert.equal(saved.estado, expectedStatus);
      assert.equal(saved.proximaAccion, action);
      assert.equal(saved.fechaProximaAccion.toISOString(), due);
      assert.equal(Object.values(saved.documentacion).filter(Boolean).length, expectedCount);
    }
  });

  await t.test("seguimiento automático continúa y prepara mensaje sin enviar", async () => {
    assert.equal((await request("PATCH", `/${automaticId}/status`,
      { estado: "interesado" })).status, 200);
    const partial = await request("PATCH", `/${automaticId}/documents`,
      { documentacion: { cedula: true } });
    assert.equal(partial.status, 200);
    assert.equal(partial.body.applicant.proximaAccion, "Completar documentos");
    const result = await request("PATCH", `/${automaticId}/documents`, { documentacion: complete });
    assert.equal(result.status, 200);
    const saved = await RecruitApplicant.findById(automaticId).lean();
    assert.equal(saved.estado, "en_revision");
    assert.equal(saved.proximaAccion, "Revisar documentos");
    assert.ok(saved.fechaProximaAccion.getTime() > Date.now());
    const message = await request("GET", `/${automaticId}/message`);
    assert.equal(message.status, 200);
    assert.match(message.body.message, /en revisión/i);
    assert.equal((await RecruitApplicant.findById(automaticId).lean()).whatsappStatus, "pendiente");
  });

  await t.test("un postulante rechazado no se reabre al guardar documentos", async () => {
    assert.equal((await request("PATCH", `/${manualId}/status`,
      { estado: "rechazado" })).status, 200);
    assert.equal((await request("PATCH", `/${manualId}/documents`,
      { documentacion: complete })).status, 200);
    const saved = await RecruitApplicant.findById(manualId).lean();
    assert.equal(saved.estado, "rechazado");
    assert.equal(saved.proximaAccion, "");
    assert.equal(saved.fechaProximaAccion, null);
  });
});
