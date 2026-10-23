const mongoose = require("mongoose");

const starkenHubRecordSchema = new mongoose.Schema(
  {
    hub: {
      type: String,
      default: "Las Condes",
      trim: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    movil: {
      type: String,
      required: true,
      trim: true,
    },
    chofer: {
      type: String,
      default: "",
      trim: true,
    },
    tipoMovimiento: {
      type: String,
      enum: ["rendicion", "retiro"],
      required: true,
      trim: true,
    },
    horaRegistro: {
      type: String,
      default: "",
      trim: true,
    },
    numeroDocumento: {
      type: String,
      default: "",
      trim: true,
    },

    entregadas: {
      type: Number,
      default: 0,
      min: 0,
    },
    entregadasParciales: {
      type: Number,
      default: 0,
      min: 0,
    },
    devoluciones: {
      type: Number,
      default: 0,
      min: 0,
    },
    extraviados: {
      type: Number,
      default: 0,
      min: 0,
    },
    dineroRendir: {
      type: Number,
      default: 0,
      min: 0,
    },
    vouchersDevolver: {
      type: Number,
      default: 0,
      min: 0,
    },
    nominasRendidas: {
      type: Number,
      default: 0,
      min: 0,
    },

    horaEmision: {
      type: String,
      default: "",
      trim: true,
    },
    horaDespacho: {
      type: String,
      default: "",
      trim: true,
    },
    origen: {
      type: String,
      default: "",
      trim: true,
    },
    destino: {
      type: String,
      default: "",
      trim: true,
    },
    encargosRetiro: {
      type: Number,
      default: 0,
      min: 0,
    },
    bultosRetiro: {
      type: Number,
      default: 0,
      min: 0,
    },
    pesoKg: {
      type: Number,
      default: 0,
      min: 0,
    },

    observacion: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StarkenHubRecord", starkenHubRecordSchema);
