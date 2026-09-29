const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    operacion: {
      type: String,
      required: true,
      trim: true,
    },
    fecha: {
      type: Date,
      required: true,
      default: Date.now,
    },
    vehiculo: {
      type: String,
      default: "",
      trim: true,
    },
    chofer: {
      type: String,
      default: "",
      trim: true,
    },
    tipo: {
      type: String,
      required: true,
      trim: true,
    },
    origen: {
      type: String,
      enum: [
        "Bodega",
        "Planificación",
        "Cliente",
        "Chofer",
        "Transportista",
        "Vehículo",
        "Sistema",
        "MR&B",
        "No determinado",
      ],
      default: "No determinado",
      trim: true,
    },
    severidad: {
      type: String,
      enum: ["Baja", "Media", "Alta", "Crítica"],
      default: "Media",
      trim: true,
    },
    impactoMinutos: {
      type: Number,
      default: 0,
      min: 0,
    },
    paquetesAfectados: {
      type: Number,
      default: 0,
      min: 0,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    estado: {
      type: String,
      enum: ["Abierta", "En análisis", "Resuelta"],
      default: "Abierta",
      trim: true,
    },
    causaRaiz: {
      type: String,
      default: "",
      trim: true,
    },
    accionCorrectiva: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Incident", incidentSchema);
