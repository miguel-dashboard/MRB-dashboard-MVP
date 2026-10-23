const DispatchDay = require("../models/DispatchDay");
const {
  LIMITS, DispatchError, isDateKey, bodyFields, textField, integerField, validId,
} = require("../utils/smartDispatchValidation");

const dayFields = ["fecha", "operacion", "hub", "movil", "chofer", "ofEsperadas"];
const orderFields = ["of", "codigoBarras", "direccion", "comuna", "bultos", "estadoDireccion", "parada"];
const owns = (body, key) => Object.prototype.hasOwnProperty.call(body, key);

function dayInput(body, partial = false) {
  bodyFields(body, dayFields);
  const result = {};
  for (const [key, max] of [["movil", 40], ["chofer", 120]]) {
    if (!partial || owns(body, key)) result[key] = textField(body[key], key, max, true);
  }
  if (!partial || owns(body, "fecha")) {
    if (!isDateKey(body.fecha)) throw new DispatchError(400, "Fecha inválida; use AAAA-MM-DD.");
    result.fecha = body.fecha;
  }
  if (!partial || owns(body, "ofEsperadas")) {
    result.ofEsperadas = integerField(body.ofEsperadas, "OF esperadas", 1, LIMITS.orders);
  }
  for (const [key, value] of [["operacion", "Starken"], ["hub", "Las Condes"]]) {
    if (owns(body, key) && body[key] !== value) {
      throw new DispatchError(400, `Smart Dispatch V1 corresponde a Starken, Hub Las Condes.`);
    }
    if (!partial || owns(body, key)) result[key] = value;
  }
  return result;
}

function orderInput(body, partial = false) {
  bodyFields(body, orderFields);
  const result = {};
  if (!partial || owns(body, "of")) result.of = textField(body.of, "OF", LIMITS.code, true);
  for (const [key, max] of [["codigoBarras", LIMITS.code], ["direccion", 300], ["comuna", 100]]) {
    if (owns(body, key)) result[key] = textField(body[key], key, max);
    else if (!partial) result[key] = "";
  }
  if (owns(body, "bultos")) result.bultos = integerField(body.bultos, "Bultos", 1, LIMITS.packages);
  else if (!partial) result.bultos = 1;
  if (owns(body, "estadoDireccion")) {
    if (!["por_revisar", "ok"].includes(body.estadoDireccion)) {
      throw new DispatchError(400, "Estado de dirección inválido.");
    }
    result.estadoDireccion = body.estadoDireccion;
  } else if (!partial) result.estadoDireccion = "por_revisar";
  if (owns(body, "parada")) {
    result.parada = body.parada === null ? null : integerField(body.parada, "Parada", 1, LIMITS.orders);
  } else if (!partial) result.parada = null;
  return result;
}

function confirmAddress(order) {
  if (order.estadoDireccion === "ok" && (!order.direccion || !order.comuna)) {
    throw new DispatchError(400, "Complete dirección y comuna antes de confirmar la dirección.");
  }
}

function loadStatus(order) {
  const count = order.bultosEscaneados.length;
  return count === 0 ? "pendiente" : count === order.bultos ? "escaneado" : "parcial";
}

function calculateKpis(day) {
  const orders = day.ordenes;
  const ofDigitalizadas = orders.length;
  const direccionesOk = orders.filter((order) => order.estadoDireccion === "ok").length;
  const paquetesEscaneados = orders.reduce((total, order) => total + order.bultosEscaneados.length, 0);
  const ofEscaneadas = orders.filter((order) => loadStatus(order) === "escaneado").length;
  return {
    ofEsperadas: day.ofEsperadas,
    ofDigitalizadas,
    direccionesOk,
    porRevisar: ofDigitalizadas - direccionesOk,
    paquetesEscaneados,
    faltantes: Math.max(day.ofEsperadas, ofDigitalizadas) - ofEscaneadas,
    duplicados: day.intentosDuplicados,
    ofSinDigitalizar: Math.max(0, day.ofEsperadas - ofDigitalizadas),
    bultosPendientes: orders.reduce((total, order) => total + order.bultos, 0) - paquetesEscaneados,
    ofEscaneadas,
    ofExcedentes: Math.max(0, ofDigitalizadas - day.ofEsperadas),
  };
}

function serializeDay(day, details = true) {
  const result = {
    _id: String(day._id), fecha: day.fecha, operacion: day.operacion, hub: day.hub,
    movil: day.movil, chofer: day.chofer, ofEsperadas: day.ofEsperadas,
    createdAt: day.createdAt, updatedAt: day.updatedAt, kpis: calculateKpis(day),
  };
  if (details) result.ordenes = day.ordenes.map((order) => ({
    _id: String(order._id), of: order.of, codigoBarras: order.codigoBarras,
    direccion: order.direccion, comuna: order.comuna, bultos: order.bultos,
    estadoDireccion: order.estadoDireccion, estadoCarga: loadStatus(order),
    bultosEscaneados: [...order.bultosEscaneados].sort((a, b) => a - b), parada: order.parada,
  }));
  return result;
}

async function findDay(id) {
  validId(id);
  const day = await DispatchDay.findById(id);
  if (!day) throw new DispatchError(404, "Jornada no encontrada.");
  return day;
}

// La misma frontera valida captura manual y futuros adaptadores de importación/escáner.
// Cada intento de escritura recarga y revalida el documento para no perder escaneos concurrentes.
async function mutateDay(id, mutation) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const day = await findDay(id);
    const duplicateMessage = mutation(day);
    try {
      await day.save();
    } catch (error) {
      if (error.name === "VersionError") continue;
      throw error;
    }
    const result = serializeDay(day);
    if (duplicateMessage) throw new DispatchError(409, duplicateMessage, result);
    return result;
  }
  throw new DispatchError(409, "La jornada recibió otros cambios. Recargue e intente nuevamente.");
}

function isDuplicate(day, input, exceptId) {
  const codes = [input.of, input.codigoBarras].filter(Boolean);
  return day.ordenes.some((order) => String(order._id) !== exceptId &&
    codes.some((code) => code === order.of || code === order.codigoBarras));
}

function duplicate(day, message) {
  day.intentosDuplicados += 1;
  return message;
}

async function listDays() {
  const days = await DispatchDay.find().sort({ fecha: -1, createdAt: -1 });
  return days.map((day) => serializeDay(day, false));
}

async function createDay(body) {
  const day = new DispatchDay(dayInput(body));
  await day.save();
  return serializeDay(day);
}

async function getDay(id) { return serializeDay(await findDay(id)); }

async function updateDay(id, body) {
  const input = dayInput(body, true);
  return mutateDay(id, (day) => { Object.assign(day, input); });
}

async function addOrder(id, body) {
  const input = orderInput(body);
  confirmAddress(input);
  return mutateDay(id, (day) => {
    if (isDuplicate(day, input)) return duplicate(day, "OF o código de barras duplicado en esta jornada.");
    if (day.ordenes.length >= LIMITS.orders) throw new DispatchError(400, "La jornada ya tiene 1000 OF.");
    day.ordenes.push(input);
  });
}

async function updateOrder(id, orderId, body) {
  validId(orderId);
  const input = orderInput(body, true);
  return mutateDay(id, (day) => {
    const order = day.ordenes.id(orderId);
    if (!order) throw new DispatchError(404, "OF no encontrada en esta jornada.");
    const updated = { ...order.toObject(), ...input };
    if (order.bultosEscaneados.length && (updated.of !== order.of || updated.codigoBarras !== order.codigoBarras)) {
      throw new DispatchError(400, "No puede cambiar la OF ni su código de barras después de escanear un bulto.");
    }
    if ((owns(input, "direccion") && input.direccion !== order.direccion ||
         owns(input, "comuna") && input.comuna !== order.comuna) && !owns(input, "estadoDireccion")) {
      updated.estadoDireccion = "por_revisar";
    }
    confirmAddress(updated);
    if (order.bultosEscaneados.some((value) => value > updated.bultos)) {
      throw new DispatchError(400, "No puede reducir bultos por debajo de un bulto ya escaneado.");
    }
    if (isDuplicate(day, updated, String(order._id))) return duplicate(day, "OF o código de barras duplicado en esta jornada.");
    Object.assign(order, input, { estadoDireccion: updated.estadoDireccion });
  });
}

async function scanPackage(id, body) {
  bodyFields(body, ["codigo", "bulto"]);
  const code = textField(body.codigo, "Código", LIMITS.code, true);
  const packageNumber = integerField(body.bulto, "Bulto", 1, LIMITS.packages);
  return mutateDay(id, (day) => {
    const order = day.ordenes.find((item) => item.of === code || item.codigoBarras === code);
    if (!order) throw new DispatchError(404, "El código no pertenece a esta jornada. Registre primero la OF.");
    if (packageNumber > order.bultos) throw new DispatchError(400, `Esta OF tiene ${order.bultos} bultos.`);
    if (order.bultosEscaneados.includes(packageNumber)) return duplicate(day, "Este bulto ya fue escaneado.");
    order.bultosEscaneados.push(packageNumber);
  });
}

module.exports = {
  listDays, createDay, getDay, updateDay, addOrder, updateOrder, scanPackage,
  calculateKpis, dayInput, orderInput,
};
