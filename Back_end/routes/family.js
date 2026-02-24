const express = require('express');
const router = express.Router();
const { addFamilyMember, getFamilyMembers, deleteFamilyMember } = require('../controllers/familyController');
const { authenticatePatient } = require('../middleware/auth');

// Ajouter un membre familial (mineur)
router.post('/', authenticatePatient, addFamilyMember);
// Lister les membres familiaux du titulaire
router.get('/', authenticatePatient, getFamilyMembers);
// Supprimer un membre familial
router.delete('/:id_member', authenticatePatient, deleteFamilyMember);

module.exports = router;
