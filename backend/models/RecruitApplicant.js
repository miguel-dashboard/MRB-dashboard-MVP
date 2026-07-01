const mongoose = require("mongoose");

const applicantStatuses = [
  "nuevo",
  "contactado",
  "interesado",
  "documentacion_pendiente",
  "en_revision",
  "aprobado",
  "rechazado",
  "convertido_a_chofer",
];

const recruitApplicantSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    apellido: {
      type: String,
      default: "",
      trim: true,
    },
    rut: {
      type: String,
      default: "",
      trim: true,
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
    },
    whatsapp: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    fuente: {
      type: String,
      enum: [
        "facebook_ads",
        "instagram_ads",
        "google_ads",
        "whatsapp",
        "referido",
        "manual",
        "otro",
      ],
      default: "manual",
      trim: true,
    },
    tipoPostulante: {
      type: String,
      enum: ["chofer", "transportista", "flota", "empresa"],
      default: "transportista",
      trim: true,
    },
    tipoLicencia: {
      type: String,
      default: "",
      trim: true,
    },
    anosExperiencia: {
      type: Number,
      min: 0,
      default: 0,
    },
    tieneVehiculo: {
      type: Boolean,
      default: false,
    },
    tipoVehiculo: {
      type: String,
      default: "",
      trim: true,
    },
    operacion: {
    type: String,
    default: "",
    trim: true,
    },
    patente: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    capacidadCarga: {
      type: String,
      default: "",
      trim: true,
    },
    comuna: {
      type: String,
      default: "",
      trim: true,
    },
    region: {
      type: String,
      default: "",
      trim: true,
    },
    zonasDisponibles: {
      type: [String],
      default: [],
    },
    disponibilidad: {
      type: String,
      enum: ["", "inmediata", "esta_semana", "este_mes", "a_convenir"],
      default: "",
      trim: true,
    },
    estado: {
      type: String,
      enum: applicantStatuses,
      default: "nuevo",
      trim: true,
    },
    prioridad: {
      type: String,
      enum: ["baja", "media", "alta"],
      default: "media",
      trim: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    asignadoA: {
      type: String,
      default: "",
      trim: true,
    },
    fechaPrimerContacto: {
      type: Date,
      default: null,
    },
    fechaUltimoContacto: {
      type: Date,
      default: null,
    },
    proximaAccion: {
      type: String,
      default: "",
      trim: true,
    },
    fechaProximaAccion: {
      type: Date,
      default: null,
    },
    notas: {
      type: String,
      default: "",
      trim: true,
    },
    whatsappOptIn: {
      type: Boolean,
      default: false,
    },
    whatsappStatus: {
      type: String,
      enum: ["pendiente", "enviado", "respondio", "fallido", "bloqueado"],
      default: "pendiente",
      trim: true,
    },
    lastWhatsappMessageAt: {
      type: Date,
      default: null,
    },
    campaignId: {
      type: String,
      default: "",
      trim: true,
    },
    campaignName: {
      type: String,
      default: "",
      trim: true,
    },
    utmSource: {
      type: String,
      default: "",
      trim: true,
    },
    utmMedium: {
      type: String,
      default: "",
      trim: true,
    },
    utmCampaign: {
      type: String,
      default: "",
      trim: true,
    },
    utmContent: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RecruitApplicant", recruitApplicantSchema);
module.exports.applicantStatuses = applicantStatuses;