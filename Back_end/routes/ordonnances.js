const express = require('express');
const router = express.Router();
const {
  getOrdonnancePDFInfo,
  downloadOrdonnancePDF,
  getOrdonnancePDFStatus
} = require('../controllers/ordonnanceController');
const { authenticatePatient } = require('../middleware/auth');

// Routes protégées pour les patients
router.get('/:ordonnance_id/info', authenticatePatient, getOrdonnancePDFInfo);
router.get('/:ordonnance_id/download', authenticatePatient, downloadOrdonnancePDF);
router.get('/:ordonnance_id/status', authenticatePatient, getOrdonnancePDFStatus);

module.exports = router;
