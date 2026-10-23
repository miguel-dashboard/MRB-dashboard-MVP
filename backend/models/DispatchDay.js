const mongoose = require("mongoose");
const { LIMITS, isDateKey } = require("../utils/smartDispatchValidation");

const integer = { validator: Number.isInteger, message: "Debe ser un número entero." };
const orderSchema = new mongoose.Schema({
  of: { type: String, required: true, trim: true, maxlength: LIMITS.code },
  codigoBarras: { type: String, default: "", trim: true, maxlength: LIMITS.code },
  direccion: { type: String, default: "", trim: true, maxlength: 300 },
  comuna: { type: String, default: "", trim: true, maxlength: 100 },
  bultos: { type: Number, default: 1, min: 1, max: LIMITS.packages, validate: integer },
  estadoDireccion: { type: String, enum: ["por_revisar", "ok"], default: "por_revisar" },
  estadoCarga: { type: String, enum: ["pendiente", "parcial", "escaneado"], default: "pendiente" },
  bultosEscaneados: {
    type: [Number], default: [],
    validate: {
      validator(values) {
        return new Set(values).size === values.length &&
          values.every((value) => Number.isInteger(value) && value >= 1 && value <= this.bultos);
      },
      message: "Los bultos escaneados deben ser únicos y pertenecer a la OF.",
    },
  },
  parada: {
    type: Number, default: null, min: 1, max: LIMITS.orders,
    validate: { validator: (value) => value === null || Number.isInteger(value), message: "Parada inválida." },
  },
}, { strict: "throw" });

orderSchema.pre("validate", function () {
  if (this.estadoDireccion === "ok" && (!this.direccion || !this.comuna)) {
    this.invalidate("estadoDireccion", "Para confirmar la dirección se requieren dirección y comuna.");
  }
  const count = this.bultosEscaneados.length;
  this.estadoCarga = count === 0 ? "pendiente" : count === this.bultos ? "escaneado" : "parcial";
});

const dispatchDaySchema = new mongoose.Schema({
  fecha: { type: String, required: true, validate: { validator: isDateKey, message: "Fecha inválida." } },
  operacion: { type: String, enum: ["Starken"], default: "Starken", required: true },
  hub: { type: String, enum: ["Las Condes"], default: "Las Condes", required: true },
  movil: { type: String, required: true, trim: true, maxlength: 40 },
  chofer: { type: String, required: true, trim: true, maxlength: 120 },
  ofEsperadas: { type: Number, required: true, min: 1, max: LIMITS.orders, validate: integer },
  intentosDuplicados: { type: Number, default: 0, min: 0, max: Number.MAX_SAFE_INTEGER, validate: integer },
  ordenes: {
    type: [orderSchema], default: [],
    validate: {
      validator(orders) {
        if (orders.length > LIMITS.orders) return false;
        const identifiers = new Set();
        for (const order of orders) {
          // Un mismo código puede ser OF y barra de esa OF; nunca de otra.
          const codes = new Set([order.of, order.codigoBarras].filter(Boolean));
          for (const code of codes) {
            if (identifiers.has(code)) return false;
            identifiers.add(code);
          }
        }
        return true;
      },
      message: "La jornada admite hasta 1000 OF con identificadores únicos.",
    },
  },
}, { timestamps: true, optimisticConcurrency: true, strict: "throw" });

dispatchDaySchema.index({ fecha: -1, createdAt: -1 });

module.exports = mongoose.model("DispatchDay", dispatchDaySchema);
