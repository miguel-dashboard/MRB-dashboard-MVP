const express = require("express");
const {
  getRecruitApplicants,
  getRecruitApplicantById,
  getRecruitApplicantMessage,
  createRecruitApplicant,
  updateRecruitApplicant,
  updateRecruitApplicantDocuments,
  updateRecruitApplicantStatus,
} = require("../../controllers/recruitApplicantController");

const router = express.Router();

// Obtener todos los postulantes Recruit
router.get("/", getRecruitApplicants);

// Obtener mensaje sugerido para WhatsApp según etapa Recruit
router.get("/:id/message", getRecruitApplicantMessage);

// Obtener un postulante Recruit por ID
router.get("/:id", getRecruitApplicantById);

// Crear un postulante Recruit
router.post("/", createRecruitApplicant);

// Actualizar un postulante Recruit
router.put("/:id", updateRecruitApplicant);

// Actualizar checklist documental de un postulante Recruit
router.patch("/:id/documents", updateRecruitApplicantDocuments);

// Actualizar estado de un postulante Recruit
router.patch("/:id/status", updateRecruitApplicantStatus);

module.exports = router;
