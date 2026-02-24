const express = require('express');
const router = express.Router();
const {
  createPaiement,
  confirmPaiement,
  getHistoriquePaiements,
  getPaiement,
  stripeWebhook,
  getTarifs
} = require('../controllers/paiementController');
const { validatePaiement } = require('../middleware/validation');
const { authenticatePatient } = require('../middleware/auth');

// Route publique pour les webhooks Stripe (pas d'authentification)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Route publique pour les tarifs
router.get('/tarifs', getTarifs);

// Routes protégées pour les patients
router.post('/', authenticatePatient, validatePaiement, createPaiement);
router.post('/confirm', authenticatePatient, confirmPaiement);
router.get('/historique', authenticatePatient, getHistoriquePaiements);
router.get('/:id', authenticatePatient, getPaiement);

module.exports = router;
