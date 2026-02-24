const express = require('express');
const router = express.Router();
const {
  createConsultation,
  getFileAttente,
  getConsultationsPatient,
  updateConsultation,
  cancelConsultation,
  getConsultationsMedecin,
  getServices,
  getSallesDisponibles
} = require('../controllers/consultationController');
const {
  authenticateToken,
  authenticatePatient,
  authenticateMedecin
} = require('../middleware/auth');

// Routes publiques/authentifiées
router.get('/services', authenticateToken, getServices);
router.get('/salles', authenticateMedecin, getSallesDisponibles);

// Routes pour les patients
router.post('/', authenticatePatient, createConsultation);
router.get('/patient', authenticatePatient, getConsultationsPatient);
router.delete('/:id_consultation', authenticatePatient, cancelConsultation);

// Routes pour les médecins
router.get('/medecin', authenticateMedecin, getConsultationsMedecin);
router.get('/file-attente/:id_service', authenticateMedecin, getFileAttente);
router.put('/:id_consultation', authenticateMedecin, updateConsultation);

module.exports = router;
