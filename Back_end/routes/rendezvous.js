const express = require('express');
const router = express.Router();
const {
  getMedecins,
  getDisponibilites,
  createRendezVous,
  getRendezVousPatient,
  getRendezVousMedecin,
  cancelRendezVous
} = require('../controllers/rdvController');
const { validateRendezVous } = require('../middleware/validation');
const {
  authenticateToken,
  authenticatePatient,
  authenticateMedecin
} = require('../middleware/auth');

// Routes pour tous les utilisateurs authentifiés
router.get('/medecins', authenticateToken, getMedecins);
router.get('/medecins/:medecin_id/disponibilites', authenticateToken, getDisponibilites);

// Routes pour les patients
router.post('/', authenticatePatient, validateRendezVous, createRendezVous);
router.get('/patient', authenticatePatient, getRendezVousPatient);
router.delete('/:id', authenticatePatient, cancelRendezVous);

// Routes pour les médecins
router.get('/medecin', authenticateMedecin, getRendezVousMedecin);

module.exports = router;
