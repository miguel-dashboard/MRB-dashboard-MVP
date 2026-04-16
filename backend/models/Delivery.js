const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    cliente: {
      type: String,
      required: true,
      trim: true,
    },
    bodega: {
      type: String,
      default: "",
      trim: true,
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
    comuna: {
      type: String,
      required: true,
      trim: true,
    },
    direccion: {
      type: String,
      required: true,
      trim: true,
    },
    chofer: {
      type: String,
      default: "",
      trim: true,
    },
    vehiculo: {
      type: String,
      default: "",
      trim: true,
    },
    horaCitacion: {
      type: String,
      default: "",
      trim: true,
    },
    horaCarga: {
      type: String,
      default: "",
      trim: true,
    },
    horaSalida: {
      type: String,
      default: "",
      trim: true,
    },
    estado: {
      type: String,
      required: true,
      enum: ["Pendiente", "En ruta", "Entregada", "Incidencia"],
      default: "Pendiente",
      trim: true,
    },
    prioridad: {
      type: String,
      enum: ["Baja", "Media", "Alta", "Crítica"],
      default: "Media",
      trim: true,
    },
    origenProblema: {
      type: String,
      enum: [
        "",
        "Bodega",
        "Cliente",
        "Dirección",
        "Tráfico",
        "Chofer",
        "Sistema",
        "Otro",
      ],
      default: "",
      trim: true,
    },
    tipoIncidencia: {
      type: String,
      enum: [
        "",
        "Cliente no responde",
        "Dirección errónea",
        "Ausente",
        "Rechazo",
        "Demora en bodega",
        "Falla vehicular",
        "Saturación",
        "Problema de carga",
        "Otro",
      ],
      default: "",
      trim: true,
    },
    observacion: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Delivery", deliverySchema);