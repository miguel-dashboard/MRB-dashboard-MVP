const LIMITS = Object.freeze({ orders: 1000, packages: 1000, code: 128 });

class DispatchError extends Error {
  constructor(status, message, day) {
    super(message);
    this.status = status;
    if (day) this.day = day;
  }
}

function isDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function bodyFields(body, allowed) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new DispatchError(400, "El cuerpo debe ser un objeto JSON.");
  }
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    throw new DispatchError(400, "La solicitud contiene campos no permitidos.");
  }
  if (!Object.keys(body).length) throw new DispatchError(400, "Faltan datos para guardar.");
}

function textField(value, name, max, required = false) {
  if (typeof value !== "string") throw new DispatchError(400, `${name} debe ser texto.`);
  const result = value.trim();
  if ((required && !result) || result.length > max || /[\u0000-\u001f\u007f]/.test(result)) {
    throw new DispatchError(400, `${name} debe contener ${required ? "entre 1 y" : "hasta"} ${max} caracteres sin controles.`);
  }
  return result;
}

function integerField(value, name, min, max) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new DispatchError(400, `${name} debe ser un número entero entre ${min} y ${max}.`);
  }
  return value;
}

function validId(value) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    throw new DispatchError(400, "Identificador inválido.");
  }
  return value;
}

module.exports = { LIMITS, DispatchError, isDateKey, bodyFields, textField, integerField, validId };
