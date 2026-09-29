const mongoose = require("mongoose");

const operationDaySchema = new mongoose.Schema(
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
      required: true,
      trim: true,
    },
    chofer: {
      type: String,
      default: "",
      trim: true,
    },
    citado: {
      type: Boolean,
      default: true,
    },
    opero: {
      type: Boolean,
      default: true,
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
    paquetesAsignados: {
      type: Number,
      default: 0,
      min: 0,
    },
    paquetesEntregados: {
      type: Number,
      default: 0,
      min: 0,
    },
    paquetesNoEntregados: {
      type: Number,
      default: 0,
      min: 0,
    },
    problemaPrincipal: {
      type: String,
      default: "",
      trim: true,
    },
    observacion: {
      type: String,
      default: "",
      trim: true,
    },
    estado: {
      type: String,
      enum: ["Planificada", "Operando", "Cerrada", "Incidencia"],
      default: "Cerrada",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OperationDay", operationDaySchema);
