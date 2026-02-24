const { body, validationResult } = require('express-validator');
const { calculateAge } = require('../utils/helpers');

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Validations pour l'inscription patient
const validatePatientRegistration = [
  body('nom')
    .trim()
    .notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),

  body('prenom')
    .trim()
    .notEmpty().withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),

  body('date_naissance')
    .notEmpty().withMessage('La date de naissance est requise')
    .isDate().withMessage('Format de date invalide'),

  // body('age')
  //   .isInt({ min: 0, max: 120 }).withMessage('Âge invalide'),

  body('cin')
    .trim()
    .custom((value, { req }) => {
      const age = calculateAge(req.body.date_naissance);

      if (age >= 16) {
        // Age > 16 ans → CIN obligatoire
        if (!value) {
          throw new Error('La CNI est obligatoire pour un patient majeur');
        }
        if (value.length < 5 || value.length > 50) {
          throw new Error('CNI invalide');
        }
      } else {
        if (value) {
          throw new Error('La CNI ne doit pas être fournie pour un patient dpnt l’âge est inférieur à 16 ans');
        }
      }

      return true;
    }),

  body('sexe')
    .isIn(['homme', 'femme', 'autre']).withMessage('Sexe invalide'),

  body('adresse')
    .trim()
    .notEmpty().withMessage('L\'adresse est requise'),

  body('email')
    .trim()
    .notEmpty().withMessage('L\'email est requis')
    .isEmail().withMessage('Format d\'email invalide')
    .matches(/@gmail\.com$/).withMessage('Seuls les emails Gmail sont acceptés'),

  body('telephone')
    .trim()
    .notEmpty().withMessage('Le téléphone est requis')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Format de téléphone invalide'),

  body('numero_secu')
    .trim()
    .optional(),

  body('mutuelle')
    .trim()
    .optional(),

  body('allergies')
    .optional()
    .isArray().withMessage('Les allergies doivent être un tableau'),

  body('groupe_sanguin')
    .trim()
    .optional(),

  body('code_postal')
    .trim()
    .notEmpty().withMessage('Le code postal est requis'),

  body('ville')
    .trim()
    .notEmpty().withMessage('La ville est requise'),

  body('code_pin')
    .isLength({ min: 4, max: 4 }).withMessage('Le PIN doit contenir 4 chiffres')
    .isNumeric().withMessage('Le PIN doit contenir uniquement des chiffres'),

  handleValidationErrors
];

// Validations pour la connexion
const validateLogin = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('L\'identifiant est requis'),

  body('code_pin')
    .notEmpty().withMessage('Le code PIN est requis')
    .isLength({ min: 4, max: 4 }).withMessage('Le PIN doit contenir 4 chiffres'),

  handleValidationErrors
];

// Validations pour la création de rendez-vous
const validateRendezVous = [
  body('medecin_id')
    .isInt().withMessage('ID médecin invalide'),

  body('date_rdv')
    .notEmpty().withMessage('La date est requise')
    .isDate().withMessage('Format de date invalide')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('La date ne peut pas être dans le passé');
      }
      return true;
    }),

  body('heure_rdv')
    .notEmpty().withMessage('L\'heure est requise')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Format d\'heure invalide (HH:MM)'),

  body('motif')
    .trim()
    .notEmpty().withMessage('Le motif est requis')
    .isLength({ min: 10, max: 500 }).withMessage('Le motif doit contenir entre 10 et 500 caractères'),

  handleValidationErrors
];

// Validations pour l'ajout d'un dossier médical
const validateDossierMedical = [
  body('patient_id')
    .isInt().withMessage('ID patient invalide'),

  body('date_consultation')
    .notEmpty().withMessage('La date de consultation est requise')
    .isDate().withMessage('Format de date invalide'),

  body('diagnostic')
    .trim()
    .notEmpty().withMessage('Le diagnostic est requis')
    .isLength({ min: 10 }).withMessage('Le diagnostic doit contenir au moins 10 caractères'),

  body('prescription')
    .optional()
    .trim(),

  body('notes')
    .optional()
    .trim(),

  handleValidationErrors
];

// Validations pour le paiement
const validatePaiement = [
  body('montant')
    .isFloat({ min: 0.01 }).withMessage('Montant invalide'),

  body('methode_paiement')
    .isIn(['carte', 'especes', 'virement', 'stripe']).withMessage('Méthode de paiement invalide'),

  body('description')
    .optional()
    .trim(),

  handleValidationErrors
];

module.exports = {
  validatePatientRegistration,
  validateLogin,
  validateRendezVous,
  validateDossierMedical,
  validatePaiement,
  handleValidationErrors
};
