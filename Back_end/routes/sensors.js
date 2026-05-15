const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/sensorController');

// ── État & status MQTT ─────────────────────────────────────────────────────
// GET /api/sensors/status
router.get('/status', ctrl.getMqttStatus);

// ── Données en temps réel (cache MQTT mémoire) ────────────────────────────
// GET /api/sensors/latest
router.get('/latest', ctrl.getLatestAll);

// GET /api/sensors/latest/:patientId
router.get('/latest/:patientId', ctrl.getLatestByPatient);

// ── Historique depuis la base de données ──────────────────────────────────
// GET /api/sensors/history/:patientId
router.get('/history/:patientId', ctrl.getHistory);

// GET /api/sensors/history/:patientId/consultation/:consultationId
router.get('/history/:patientId/consultation/:consultationId', ctrl.getByConsultation);

// ── Saisie manuelle (tests / backup) ─────────────────────────────────────
// POST /api/sensors/manual
router.post('/manual', ctrl.insertManual);

module.exports = router;
