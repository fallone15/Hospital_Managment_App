const express = require('express');
const router = express.Router();

// GET - Tous les patients
router.get('/', (req, res) => {
  res.json({ message: 'Liste des patients' });
});

// GET - Patient par id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `Détails du patient ${id}` });
});

// POST - Créer un patient
router.post('/', (req, res) => {
  const { nom, prenom, email, telephone, dateNaissance } = req.body;
  // TODO: Enregistrer le patient
  res.json({ message: 'Patient créé avec succès' });
});

// PUT - Modifier un patient
router.put('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Mettre à jour le patient
  res.json({ message: `Patient ${id} modifié` });
});

// DELETE - Supprimer un patient
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Supprimer le patient
  res.json({ message: `Patient ${id} supprimé` });
});

module.exports = router;