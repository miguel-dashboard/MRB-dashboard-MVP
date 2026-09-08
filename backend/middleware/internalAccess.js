const { createHash, timingSafeEqual } = require("node:crypto");

const loopbackAddresses = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const digest = (value) => createHash("sha256").update(value).digest();

module.exports = function internalAccess(req, res, next) {
  const publicRecruit = req.path === "/api/recruit/applicants";
  const publicPreflight = publicRecruit && req.method === "OPTIONS" &&
    req.get("Access-Control-Request-Method") === "POST";
  if ((req.method === "GET" && req.path === "/") ||
      (publicRecruit && req.method === "POST") || publicPreflight) return next();

  const token = process.env.INTERNAL_API_TOKEN || "";
  const development = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
  // Solo conexiones locales reales: no confiar en Origin ni X-Forwarded-For.
  if (!token && development && loopbackAddresses.has(req.socket.remoteAddress)) return next();

  const match = /^Bearer (\S+)$/i.exec(req.get("Authorization") || "");
  if (token && match && timingSafeEqual(digest(match[1]), digest(token))) return next();

  res.set("Cache-Control", "no-store");
  return res.status(401).json({ message: "Acceso interno no autorizado" });
};
