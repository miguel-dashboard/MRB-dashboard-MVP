const mongoose = require("mongoose");
const normalizePhone = require("../utils/normalizePhone");
const RecruitApplicant = require("../models/RecruitApplicant");

const { applicantStatuses } = RecruitApplicant;

const buildApplicantFilters = (query) => {
  const filters = {};

  if (query.estado) {
    filters.estado = query.estado;
  }

  if (query.fuente) {
    filters.fuente = query.fuente;
  }

  if (query.prioridad) {
    filters.prioridad = query.prioridad;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search, "i");
    filters.$or = [
      { nombre: searchRegex },
      { apellido: searchRegex },
      { telefono: searchRegex },
      { whatsapp: searchRegex },
      { email: searchRegex },
      { comuna: searchRegex },
    ];
  }

  return filters;
};

const validateApplicantId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET - obtener todos los postulantes Recruit
const getRecruitApplicants = async (req, res) => {
  try {
    const filters = buildApplicantFilters(req.query);
    const applicants = await RecruitApplicant.find(filters).sort({ createdAt: -1 });

    res.json(applicants);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener postulantes Recruit",
      error: error.message,
    });
  }
};

// GET - obtener un postulante Recruit por ID
const getRecruitApplicantById = async (req, res) => {
  try {
    if (!validateApplicantId(req.params.id)) {
      return res.status(400).json({
        message: "ID de postulante inválido",
      });
    }

    const applicant = await RecruitApplicant.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        message: "Postulante no encontrado",
      });
    }

    res.json(applicant);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener el postulante",
      error: error.message,
    });
  }
};

// POST - crear un postulante Recruit
const createRecruitApplicant = async (req, res) => {
  try {
    const telefono = normalizePhone(req.body?.telefono);

    if (!/^\+?\d{8,15}$/.test(telefono) || /^(\d)\1+$/.test(telefono.replace(/^\+/, ""))) {
      return res.status(400).json({
        message: "Ingresa un teléfono válido, por ejemplo +56912345678.",
      });
    }

    // Solo datos de postulación usados por la landing y el formulario del dashboard.
    // Los campos de gestión no se copian: sus valores iniciales pertenecen al modelo.
    const applicantData = {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      telefono,
      whatsapp: normalizePhone(req.body.whatsapp),
      comuna: req.body.comuna,
      region: req.body.region,
      tipoPostulante: req.body.tipoPostulante,
      tipoVehiculo: req.body.tipoVehiculo,
      patente: req.body.patente,
      capacidadCarga: req.body.capacidadCarga,
      anosExperiencia: req.body.anosExperiencia,
      operacion: req.body.operacion,
      campaignName: req.body.campaignName,
      disponibilidad: req.body.disponibilidad,
      experiencia: req.body.experiencia,
      observacion: req.body.observacion,
      // Comentario del postulante en PublicRecruitForm; no son notas internas.
      notas: req.body.notas,
      fuente: req.body.fuente,
    };

    const newApplicant = new RecruitApplicant(applicantData);
    const savedApplicant = await newApplicant.save();

    res.status(201).json({
      message: "Postulante Recruit creado correctamente",
      applicant: savedApplicant,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error al crear postulante Recruit",
      error: error.message,
    });
  }
};

// PUT - actualizar un postulante Recruit
const updateRecruitApplicant = async (req, res) => {
  try {
    if (!validateApplicantId(req.params.id)) {
      return res.status(400).json({
        message: "ID de postulante inválido",
      });
    }

    const updatedApplicant = await RecruitApplicant.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedApplicant) {
      return res.status(404).json({
        message: "Postulante no encontrado",
      });
    }

    res.json({
      message: "Postulante Recruit actualizado correctamente",
      applicant: updatedApplicant,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar postulante Recruit",
      error: error.message,
    });
  }
};

// PATCH - actualizar estado de un postulante Recruit
const updateRecruitApplicantStatus = async (req, res) => {
  try {
    if (!validateApplicantId(req.params.id)) {
      return res.status(400).json({
        message: "ID de postulante inválido",
      });
    }

    const { estado } = req.body;

    if (!applicantStatuses.includes(estado)) {
      return res.status(400).json({
        message: "Estado de postulante inválido",
        validStatuses: applicantStatuses,
      });
    }

    const updatedApplicant = await RecruitApplicant.findByIdAndUpdate(
      req.params.id,
      { estado },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedApplicant) {
      return res.status(404).json({
        message: "Postulante no encontrado",
      });
    }

    res.json({
      message: "Estado de postulante Recruit actualizado correctamente",
      applicant: updatedApplicant,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error al actualizar estado de postulante Recruit",
      error: error.message,
    });
  }
};

module.exports = {
  getRecruitApplicants,
  getRecruitApplicantById,
  createRecruitApplicant,
  updateRecruitApplicant,
  updateRecruitApplicantStatus,
};