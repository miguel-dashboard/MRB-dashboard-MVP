const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    patente: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    tipo: {
      type: String,
      required: true,
      trim: true,
    },
    marca: {
      type: String,
      required: true,
      trim: true,
    },
    modelo: {
      type: String,
      required: true,
      trim: true,
    },
    capacidad: {
      type: String,
      required: true,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);