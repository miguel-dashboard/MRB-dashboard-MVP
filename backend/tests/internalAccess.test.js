const assert = require("node:assert/strict");
const { test } = require("node:test");
const app = require("../server");
const Applicant = require("../models/RecruitApplicant");
const internalAccess = require("../middleware/internalAccess");
const normalizePhone = require("../utils/normalizePhone");

test("protección HTTP de producción, token y desarrollo local", async (t) => {
  const oldEnv = process.env.NODE_ENV;
  const oldToken = process.env.INTERNAL_API_TOKEN;
  process.env.NODE_ENV = "production";
  delete process.env.INTERNAL_API_TOKEN;
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => {
    server.close();
    if (oldEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = oldEnv;
    if (oldToken === undefined) delete process.env.INTERNAL_API_TOKEN; else process.env.INTERNAL_API_TOKEN = oldToken;
  });
  const base = "http://127.0.0.1:" + server.address().port;
  const request = (path, options) => fetch(base + path, options);
  t.mock.method(Applicant.prototype, "save", async function () { await this.validate(); return this; });
  t.mock.method(Applicant, "find", () => ({ sort: async () => [] }));
  t.mock.method(Applicant, "findByIdAndUpdate", async (_id, update) => ({ _id, ...update }));
  const id = "000000000000000000000001";
  const privateRoutes = [
    ["GET", "/api/recruit/applicants"], ["HEAD", "/api/recruit/applicants"],
    ["GET", "/api/recruit/applicants/" + id], ["PUT", "/api/recruit/applicants/" + id],
    ["PATCH", "/api/recruit/applicants/" + id + "/status"],
    ["GET", "/api/drivers"], ["POST", "/api/drivers"],
    ["GET", "/api/vehicles"], ["PUT", "/api/vehicles/" + id],
    ["GET", "/api/dashboard/summary"], ["GET", "/api/deliveries"],
    ["DELETE", "/api/deliveries/" + id], ["GET", "/api/future-route"],
    ["POST", "/api/recruit/applicants/" + id],
  ];
  for (const [method, path] of privateRoutes) {
    assert.equal((await request(path, { method })).status, 401, method + " " + path);
  }
  assert.equal((await request("/")).status, 200);
  const post = await request("/api/recruit/applicants", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre: "PRUEBA EN MEMORIA", telefono: "912345678", estado: "aprobado", prioridad: "alta" }),
  });
  assert.equal(post.status, 201);
  const { applicant } = await post.json();
  assert.equal(applicant.telefono, "+56912345678");
  assert.equal(applicant.estado, "nuevo");
  assert.equal(applicant.prioridad, "media");
  assert.equal((await request("/api/recruit/applicants", { method: "OPTIONS", headers: {
    Origin: "https://landing.example", "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type",
  } })).status, 204);
  assert.equal((await request("/api/recruit/applicants", { method: "OPTIONS", headers: {
    "Access-Control-Request-Method": "GET",
  } })).status, 401);
  assert.equal((await request("/api/recruit/applicants", { method: "POST", headers: {
    "Content-Type": "application/json",
  }, body: JSON.stringify({ observacion: "x".repeat(17000) }) })).status, 413);
  process.env.INTERNAL_API_TOKEN = "test-only-internal-token";
  for (const [method, path] of privateRoutes) {
    assert.equal((await request(path, { method })).status, 401);
    assert.equal((await request(path, { method, headers: { Authorization: "Bearer incorrecto" } })).status, 401);
  }
  const headers = { Authorization: "Bearer test-only-internal-token", "Content-Type": "application/json" };
  assert.equal((await request("/api/recruit/applicants", { headers })).status, 200);
  for (const method of ["PUT", "PATCH"]) {
    const path = "/api/recruit/applicants/" + id + (method === "PATCH" ? "/status" : "");
    assert.equal((await request(path, { method, headers, body: JSON.stringify({ estado: "contactado" }) })).status, 200);
  }
  process.env.NODE_ENV = "development";
  assert.equal((await request("/api/recruit/applicants")).status, 401);
  delete process.env.INTERNAL_API_TOKEN;
  assert.equal((await request("/api/recruit/applicants")).status, 200);
  assert.equal((await request("/api/recruit/applicants/" + id + "/status", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "contactado" }),
  })).status, 200);
  let denied;
  internalAccess({ path: "/api/recruit/applicants", method: "GET", socket: { remoteAddress: "203.0.113.10" },
    get: (name) => name === "X-Forwarded-For" ? "127.0.0.1" : undefined,
  }, { set() {}, status(code) { denied = code; return this; }, json() {} }, () => assert.fail("Bypass remoto"));
  assert.equal(denied, 401);
});

test("normaliza móviles chilenos sin inventar prefijos internacionales", () => {
  for (const input of ["+56 9 1234 5678", "56912345678", "912345678"]) {
    assert.equal(normalizePhone(input), "+56912345678");
  }
  for (const input of ["+14155552671", "223456789", "12345678"]) {
    assert.equal(normalizePhone(input), input);
  }
});
