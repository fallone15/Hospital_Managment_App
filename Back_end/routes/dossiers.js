const express = require('express');
const router = express.Router();
const {
  getDossierMedical,
  addDossierEntry,
  updateDossierEntry,
  getDossierEntry,
  getConsultations,
  addConsultation
} = require('../controllers/dossierController');
const { validateDossierMedical } = require('../middleware/validation');
const {
  authenticateToken,
  authenticateMedecin
} = require('../middleware/auth');

// Routes accessibles par patients et médecins
router.get('/patient/:patient_id', authenticateToken, getDossierMedical);
router.get('/entry/:id', authenticateToken, getDossierEntry);
router.get('/consultations/:patient_id', authenticateToken, getConsultations);

// Routes réservées aux médecins
router.post('/', authenticateMedecin, validateDossierMedical, addDossierEntry);
router.put('/:id', authenticateMedecin, updateDossierEntry);
router.post('/consultations', authenticateMedecin, addConsultation);

module.exports = router;
