const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { authenticatePatient } = require('../middleware/auth');

// Configuration de Multer pour le stockage local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/profiles');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Renommer avec ID patient et Date
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
      cb(null, true);
    } else {
      cb(new Error("Seuls les formats JPG et PNG sont autorisés !"), false);
    }
  }
});

// POST - Uploader la photo de profil
router.post('/upload-photo', authenticatePatient, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier sélectionné ou format non supporté.' });
    }

    const photoUrl = req.file.filename;

    // Mettre à jour la base de données
    await query(
      'UPDATE patients SET photo_url = $1 WHERE id_patient = $2',
      [photoUrl, req.user.id]
    );

    res.json({ 
      success: true, 
      message: 'Photo uploadée avec succès',
      photoUrl: photoUrl
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ success: false, message: 'Erreur lors du traitement de la photo.' });
  }
});

// GET - Récupérer la photo de profil de l'utilisateur
router.get('/profile-photo/:filename', authenticatePatient, (req, res) => {
  const filename = req.params.filename;
  // Optionnellement, vérifier que le filename appartient bien à req.user.id
  // if (!filename.startsWith(req.user.id + '-')) return res.status(403).send('Accès interdit');

  const filePath = path.join(__dirname, '../uploads/profiles', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, message: 'Photo non trouvée' });
  }
});

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
  res.json({ message: `Patient ${id} modifi\u00E9` });
});

// DELETE - Supprimer un patient
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  // TODO: Supprimer le patient
  res.json({ message: `Patient ${id} supprim\u00E9` });
});

module.exports = router;