const assert = require("node:assert/strict");
const { test } = require("node:test");
const mongoose = require("mongoose");
const app = require("../server");

const uri = process.env.DISPATCH_TEST_MONGODB_URI;

test("Smart Dispatch: HTTP y persistencia real en MongoDB aislado", {
  skip: !uri && "Configurar DISPATCH_TEST_MONGODB_URI para ejecutar integración real",
  timeout: 60000,
}, async (t) => {
  // Solo bases temporales locales, nunca la base operacional indicada en MONGODB_URI.
  const parsed = new URL(uri);
  assert.equal(parsed.protocol, "mongodb:");
  assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname));
  const dbName = `smart_dispatch_test_${process.pid}_${Date.now()}`;
  const previousEnv = process.env.NODE_ENV;
  const previousToken = process.env.INTERNAL_API_TOKEN;
  process.env.NODE_ENV = "development";
  delete process.env.INTERNAL_API_TOKEN;
  let server;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) {
      assert.equal(mongoose.connection.name, dbName);
      await mongoose.connection.dropDatabase();
    }
    await mongoose.disconnect();
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    if (previousToken === undefined) delete process.env.INTERNAL_API_TOKEN;
    else process.env.INTERNAL_API_TOKEN = previousToken;
  });
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/smart-dispatch/days`;
  const request = async (method, path = "", body) => {
    const response = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    // El parser JSON global de Express rechaza primitivas antes del controlador.
    const bodyResult = response.headers.get("content-type")?.includes("application/json")
      ? await response.json() : await response.text();
    return { status: response.status, body: bodyResult };
  };
  let day;
  let secondDay;
  const header = {
    fecha: "2026-10-22", operacion: "Starken", hub: "Las Condes",
    movil: "PRUEBA01", chofer: "Chofer de prueba", ofEsperadas: 3,
  };
  const order = {
    of: "0001", codigoBarras: "BARRA-001", direccion: "Calle de prueba 100",
    comuna: "Las Condes", bultos: 2, estadoDireccion: "ok", parada: 1,
  };

  await t.test("crea jornada y OF conservando ceros; datos persisten al releer", async () => {
    const created = await request("POST", "", header);
    assert.equal(created.status, 201);
    day = created.body;
    assert.equal(day.fecha, header.fecha);
    assert.equal(day.kpis.ofEsperadas, 3);
    assert.equal(day.kpis.faltantes, 3);
    const added = await request("POST", `/${day._id}/orders`, order);
    assert.equal(added.status, 201);
    day = added.body;
    assert.equal(day.ordenes[0].of, "0001");
    assert.equal(day.ordenes[0].estadoCarga, "pendiente");
    assert.equal(day.kpis.direccionesOk, 1);
    assert.equal(day.kpis.ofSinDigitalizar, 2);
    const read = await request("GET", `/${day._id}`);
    assert.deepEqual(read.body, day);
    const list = await request("GET");
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].kpis.ofDigitalizadas, 1);
    secondDay = (await request("POST", "", { ...header, movil: "PRUEBA02" })).body;
    assert.equal((await request("POST", `/${secondDay._id}/orders`, order)).status, 201);
  });

  await t.test("registra bultos parciales; duplicados no inflan OF ni carga", async () => {
    const scanned = await request("POST", `/${day._id}/scans`, { codigo: "BARRA-001", bulto: 1 });
    assert.equal(scanned.status, 200);
    assert.equal(scanned.body.ordenes[0].estadoCarga, "parcial");
    assert.equal(scanned.body.kpis.paquetesEscaneados, 1);
    assert.equal(scanned.body.kpis.faltantes, 3);
    const duplicate = await request("POST", `/${day._id}/scans`, { codigo: "0001", bulto: 1 });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.day.kpis.duplicados, 1);
    const repeatedOrder = await request("POST", `/${day._id}/orders`, { ...order, of: "0002" });
    assert.equal(repeatedOrder.status, 409);
    assert.equal(repeatedOrder.body.day.kpis.ofDigitalizadas, 1);
    assert.equal(repeatedOrder.body.day.kpis.duplicados, 2);
    for (const of of ["0002", "0003"]) {
      assert.equal((await request("POST", `/${day._id}/orders`, {
        ...order, of, codigoBarras: "BARRA-" + of, bultos: 1, parada: null,
      })).status, 201);
    }
  });

  await t.test("escrituras simultáneas no pierden carga ni aceptan un bulto dos veces", async () => {
    const same = await Promise.all([
      request("POST", `/${day._id}/scans`, { codigo: "0001", bulto: 2 }),
      request("POST", `/${day._id}/scans`, { codigo: "0001", bulto: 2 }),
    ]);
    assert.deepEqual(same.map(result => result.status).sort(), [200, 409]);
    const different = await Promise.all([
      request("POST", `/${day._id}/scans`, { codigo: "0002", bulto: 1 }),
      request("POST", `/${day._id}/scans`, { codigo: "0003", bulto: 1 }),
    ]);
    assert.ok(different.every(result => result.status === 200));
    day = (await request("GET", `/${day._id}`)).body;
    assert.equal(day.kpis.paquetesEscaneados, 4);
    assert.equal(day.kpis.ofEscaneadas, 3);
    assert.equal(day.kpis.faltantes, 0);
    assert.equal(day.kpis.bultosPendientes, 0);
    assert.equal(day.kpis.duplicados, 3);
    assert.equal((await request("GET", `/${secondDay._id}`)).body.kpis.paquetesEscaneados, 0);
  });

  await t.test("valida identificadores, tipos, fechas, rangos y campos administrados", async () => {
    for (const body of [null, [], { ...header, fecha: "2026-02-30" },
      { ...header, ofEsperadas: 1.5 }, { ...header, ofEsperadas: "3" },
      { ...header, ofEsperadas: -1 }, { ...header, ordenes: [] }]) {
      assert.equal((await request("POST", "", body)).status, 400);
    }
    assert.equal((await request("GET", "/no-es-id")).status, 400);
    assert.equal((await request("GET", "/000000000000000000000000")).status, 404);
    assert.equal((await request("POST", `/${day._id}/scans`, { codigo: "DESCONOCIDO", bulto: 1 })).status, 404);
    for (const bulto of [0, 1.5, 3, "1"]) {
      assert.equal((await request("POST", `/${day._id}/scans`, { codigo: "0001", bulto })).status, 400);
    }
    assert.equal((await request("POST", `/${day._id}/orders`, {
      ...order, of: "0004", codigoBarras: "UNICO", estadoCarga: "escaneado",
    })).status, 400);
    const original = day.ordenes.find(item => item.of === "0001");
    assert.equal((await request("PATCH", `/${day._id}/orders/${original._id}`, { bultos: 1 })).status, 400);
    assert.equal((await request("PATCH", `/${secondDay._id}/orders/${original._id}`, { parada: 2 })).status, 404);
    assert.equal((await request("GET", `/${day._id}`)).body.kpis.paquetesEscaneados, 4);
  });

  await t.test("dirección editada requiere revisión; excedentes siguen pendientes", async () => {
    const original = day.ordenes.find(item => item.of === "0001");
    const updated = await request("PATCH", `/${day._id}/orders/${original._id}`, {
      direccion: "Otra calle de prueba 200", parada: 5,
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.ordenes.find(item => item.of === "0001").estadoDireccion, "por_revisar");
    assert.equal(updated.body.kpis.porRevisar, 1);
    assert.equal((await request("PATCH", `/${day._id}/orders/${original._id}`, { estadoDireccion: "ok" })).status, 200);
    const extra = await request("POST", `/${day._id}/orders`, {
      of: "0004", codigoBarras: "", direccion: "", comuna: "", bultos: 1,
    });
    assert.equal(extra.status, 201);
    assert.equal(extra.body.kpis.ofExcedentes, 1);
    assert.equal(extra.body.kpis.faltantes, 1);
    assert.equal(extra.body.kpis.porRevisar, 1);
    const patched = await request("PATCH", `/${day._id}`, { ofEsperadas: 4 });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.kpis.ofExcedentes, 0);
    assert.equal(patched.body.kpis.faltantes, 1);
  });

  await t.test("Smart Dispatch conserva la protección interna de producción", async () => {
    process.env.NODE_ENV = "production";
    for (const [method, path, body] of [
      ["GET", ""], ["POST", "", header], ["GET", `/${day._id}`],
      ["PATCH", `/${day._id}`, { chofer: "No autorizado" }],
      ["POST", `/${day._id}/orders`, order],
      ["POST", `/${day._id}/scans`, { codigo: "0004", bulto: 1 }],
    ]) assert.equal((await request(method, path, body)).status, 401);
    process.env.NODE_ENV = "development";
    assert.equal((await request("GET", `/${day._id}`)).body.chofer, header.chofer);
  });
});
