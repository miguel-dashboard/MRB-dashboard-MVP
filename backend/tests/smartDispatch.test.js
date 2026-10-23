const assert = require("node:assert/strict");
const { test } = require("node:test");
const DispatchDay = require("../models/DispatchDay");
const service = require("../services/smartDispatchService");
const controller = require("../controllers/smartDispatchController");

const dayFields = { fecha: "2026-10-22", movil: "TYXS13", chofer: "Chofer de prueba", ofEsperadas: 3 };
const orderFields = { of: "00279128020", codigoBarras: "B-00279128020", direccion: "Lira 245", comuna: "Santiago", bultos: 2 };
const id = "000000000000000000000001";

// Copias independientes y revisión de versión, sin conexiones ni escrituras reales.
function memoryDay(t, initial = {}) {
  let stored = new DispatchDay({ ...dayFields, _id: id, __v: 0, ...initial }).toObject();
  const stats = { saves: 0, conflicts: 0 };
  t.mock.method(DispatchDay, "findById", async (key) => key === id ? DispatchDay.hydrate(stored) : null);
  t.mock.method(DispatchDay.prototype, "save", async function () {
    await this.validate();
    if (this.__v !== stored.__v) {
      stats.conflicts += 1;
      const error = new Error("Version conflict");
      error.name = "VersionError";
      throw error;
    }
    this.__v += 1;
    stored = this.toObject();
    stats.saves += 1;
    return this;
  });
  return { read: () => stored, stats };
}

test("valida jornada, fechas reales y tipos sin conversiones silenciosas", () => {
  assert.deepEqual(service.dayInput(dayFields), { ...dayFields, operacion: "Starken", hub: "Las Condes" });
  assert.equal(service.dayInput({ ...dayFields, fecha: "2024-02-29" }).fecha, "2024-02-29");
  for (const change of [
    { fecha: "2026-02-29" }, { fecha: "2026-04-31" }, { fecha: "2026-10-22T00:00:00Z" },
    { ofEsperadas: "50" }, { ofEsperadas: 1.5 }, { ofEsperadas: -1 }, { ofEsperadas: 1001 },
    { movil: {} }, { chofer: " " }, { hub: "Otro" }, { operacion: "Otra" },
    { ordenes: [] }, { intentosDuplicados: 0 }, { __v: 12 },
  ]) assert.throws(() => service.dayInput({ ...dayFields, ...change }), { status: 400 });
  for (const body of [null, [], {}, "texto"]) assert.throws(() => service.dayInput(body), { status: 400 });
});

test("preserva ceros en OF y rechaza estado de carga o escaneos enviados como campos", () => {
  assert.equal(service.orderInput({ of: " 0000123 " }).of, "0000123");
  assert.equal(service.orderInput({ of: "0000123" }).estadoDireccion, "por_revisar");
  assert.equal(service.orderInput({ of: "0000123" }).parada, null);
  for (const change of [
    { of: 123 }, { of: "" }, { codigoBarras: {} }, { bultos: "2" }, { bultos: 0 },
    { bultos: 1.5 }, { bultos: 1001 }, { estadoDireccion: "validada" }, { parada: 0 },
    { parada: 1.5 }, { bultosEscaneados: [1] }, { estadoCarga: "escaneado" },
    { direccion: "a".repeat(301) }, { of: "ABC\u0000DEF" },
  ]) assert.throws(() => service.orderInput({ ...orderFields, ...change }), { status: 400 });
});

test("KPIs distinguen OF y bultos, incluyen OF aún desconocidas y excedentes", () => {
  const day = new DispatchDay({ ...dayFields, intentosDuplicados: 2, ordenes: [
    { ...orderFields, estadoDireccion: "ok", bultosEscaneados: [1] },
    { of: "0002", bultos: 1, bultosEscaneados: [1] },
  ] });
  assert.deepEqual(service.calculateKpis(day), {
    ofEsperadas: 3, ofDigitalizadas: 2, direccionesOk: 1, porRevisar: 1,
    paquetesEscaneados: 2, faltantes: 2, duplicados: 2, ofSinDigitalizar: 1,
    bultosPendientes: 1, ofEscaneadas: 1, ofExcedentes: 0,
  });
  day.ofEsperadas = 1;
  assert.equal(service.calculateKpis(day).faltantes, 1);
  assert.equal(service.calculateKpis(day).ofExcedentes, 1);
});

test("modelo protege invariantes incluso fuera del controlador", async () => {
  for (const ordenes of [
    [{ of: "A" }, { of: "A" }],
    [{ of: "A", codigoBarras: "B" }, { of: "B" }],
    [{ of: "A", bultos: 2, bultosEscaneados: [1, 1] }],
    [{ of: "A", bultos: 2, bultosEscaneados: [3] }],
    [{ of: "A", bultos: 1.5 }],
    [{ of: "A", estadoDireccion: "ok" }],
  ]) {
    const day = new DispatchDay({ ...dayFields, ordenes });
    await assert.rejects(day.validate(), { name: "ValidationError" });
  }
  const day = new DispatchDay({ ...dayFields, ordenes: [{ of: "A", codigoBarras: "A", bultos: 2, bultosEscaneados: [2] }] });
  await day.validate();
  assert.equal(day.ordenes[0].estadoCarga, "parcial");
  day.ordenes[0].bultosEscaneados.push(1);
  await day.validate();
  assert.equal(day.ordenes[0].estadoCarga, "escaneado");
  assert.equal(DispatchDay.schema.options.optimisticConcurrency, true);
});

test("registra, escanea cada bulto y cuenta duplicados sin inflar paquetes", async (t) => {
  const db = memoryDay(t);
  let result = await service.addOrder(id, orderFields);
  assert.equal(result.ordenes[0].estadoCarga, "pendiente");
  result = await service.scanPackage(id, { codigo: orderFields.codigoBarras, bulto: 2 });
  assert.equal(result.ordenes[0].estadoCarga, "parcial");
  assert.equal(result.kpis.faltantes, 3);
  result = await service.scanPackage(id, { codigo: orderFields.of, bulto: 1 });
  assert.equal(result.ordenes[0].estadoCarga, "escaneado");
  assert.deepEqual(result.ordenes[0].bultosEscaneados, [1, 2]);
  assert.equal(result.kpis.faltantes, 2);
  await assert.rejects(service.scanPackage(id, { codigo: orderFields.of, bulto: 1 }), (error) => {
    assert.equal(error.status, 409);
    assert.equal(error.day.kpis.duplicados, 1);
    assert.equal(error.day.kpis.paquetesEscaneados, 2);
    return true;
  });
  await assert.rejects(service.addOrder(id, { of: orderFields.codigoBarras }), { status: 409 });
  assert.equal(db.read().intentosDuplicados, 2);
  assert.equal(db.read().ordenes.length, 1);
  const saves = db.stats.saves;
  await assert.rejects(service.scanPackage(id, { codigo: "desconocido", bulto: 1 }), { status: 404 });
  await assert.rejects(service.scanPackage(id, { codigo: orderFields.of, bulto: 3 }), { status: 400 });
  await assert.rejects(service.scanPackage(id, { codigo: orderFields.of }), { status: 400 });
  assert.equal(db.stats.saves, saves);
});

test("editar dirección invalida confirmación, y no permite eliminar bultos escaneados", async (t) => {
  memoryDay(t, { ordenes: [{ ...orderFields, estadoDireccion: "ok", bultosEscaneados: [2] }] });
  let result = await service.getDay(id);
  const orderId = result.ordenes[0]._id;
  result = await service.updateOrder(id, orderId, { direccion: "Otra calle 123" });
  assert.equal(result.ordenes[0].estadoDireccion, "por_revisar");
  result = await service.updateOrder(id, orderId, { estadoDireccion: "ok" });
  assert.equal(result.ordenes[0].estadoDireccion, "ok");
  result = await service.updateOrder(id, orderId, { comuna: "Providencia", estadoDireccion: "ok" });
  assert.equal(result.ordenes[0].estadoDireccion, "ok");
  await assert.rejects(service.updateOrder(id, orderId, { bultos: 1 }), { status: 400 });
  await assert.rejects(service.updateOrder(id, orderId, { of: "otra" }), { status: 400 });
  await assert.rejects(service.updateOrder(id, orderId, { codigoBarras: "otra" }), { status: 400 });
  await assert.rejects(service.updateOrder(id, orderId, { direccion: "", estadoDireccion: "ok" }), { status: 400 });
  result = await service.updateOrder(id, orderId, { direccion: "" });
  assert.equal(result.ordenes[0].estadoDireccion, "por_revisar");
  await assert.rejects(service.addOrder(id, { of: "otra", estadoDireccion: "ok" }), { status: 400 });
});

test("dos escaneos concurrentes conservan ambos bultos con relectura de versión", async (t) => {
  const db = memoryDay(t, { ordenes: [orderFields] });
  await Promise.all([1, 2].map((bulto) => service.scanPackage(id, { codigo: orderFields.of, bulto })));
  assert.deepEqual(db.read().ordenes[0].bultosEscaneados.sort(), [1, 2]);
  assert.equal(db.read().ordenes[0].estadoCarga, "escaneado");
  assert.equal(db.stats.conflicts, 1);
});

test("registro concurrente de la misma OF persiste una OF y un intento duplicado", async (t) => {
  const db = memoryDay(t);
  const results = await Promise.allSettled([service.addOrder(id, orderFields), service.addOrder(id, orderFields)]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.find((result) => result.status === "rejected").reason.status, 409);
  assert.equal(db.read().ordenes.length, 1);
  assert.equal(db.read().intentosDuplicados, 1);
});

test("acota reintentos ante conflictos persistentes", async (t) => {
  memoryDay(t);
  let attempts = 0;
  t.mock.method(DispatchDay.prototype, "save", async () => {
    attempts += 1;
    const error = new Error("version");
    error.name = "VersionError";
    throw error;
  });
  await assert.rejects(service.addOrder(id, orderFields), { status: 409 });
  assert.equal(attempts, 5);
});

test("controlador distingue ID inválido, ausencia y fallo interno sin filtrar MongoDB", async (t) => {
  const response = () => ({ code: 200, set() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
  const invalid = response();
  await controller.getDay({ params: { id: "no-valido" } }, invalid);
  assert.equal(invalid.code, 400);
  t.mock.method(DispatchDay, "findById", async () => null);
  const missing = response();
  await controller.getDay({ params: { id } }, missing);
  assert.equal(missing.code, 404);
  t.mock.method(DispatchDay, "findById", async () => { throw new Error("mongodb://secret.internal:27017/private"); });
  const failed = response();
  await controller.getDay({ params: { id } }, failed);
  assert.equal(failed.code, 500);
  assert.doesNotMatch(JSON.stringify(failed.body), /secret|mongodb|private/);
});
