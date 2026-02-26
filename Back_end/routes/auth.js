const express = require('express');
const router = express.Router();
const {
  registerPatient,
  verifyEmail,
  loginPatient,
  loginMedecin,
  getProfile,
  requestResetPin,
  resetPin
} = require('../controllers/authController');
const {
  validatePatientRegistration,
  validateLogin
} = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// Routes publiques
router.post('/register/patient', validatePatientRegistration, registerPatient);
router.post('/verify-email', verifyEmail);
router.post('/login/patient', validateLogin, loginPatient);
router.post('/login/medecin', validateLogin, loginMedecin);
router.post('/request-reset-pin', requestResetPin);
router.post('/reset-pin', resetPin);

// Routes protégées
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
