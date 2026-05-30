const express = require("express");
const {
  getRecruitApplicants,
  getRecruitApplicantById,
  createRecruitApplicant,
  updateRecruitApplicant,
  updateRecruitApplicantStatus,
} = require("../../controllers/recruitApplicantController");

const router = express.Router();

// Obtener todos los postulantes Recruit
router.get("/", getRecruitApplicants);

// Obtener un postulante Recruit por ID
router.get("/:id", getRecruitApplicantById);

// Crear un postulante Recruit
router.post("/", createRecruitApplicant);

// Actualizar un postulante Recruit
router.put("/:id", updateRecruitApplicant);

// Actualizar estado de un postulante Recruit
router.patch("/:id/status", updateRecruitApplicantStatus);

module.exports = router;
