const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares globaux
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  credentials: true
}));

// Parser JSON sauf pour le webhook Stripe
app.use((req, res, next) => {
  if (req.originalUrl === '/api/paiements/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du frontend
const frontendPath = path.join(__dirname, '../Front_end');
app.use(express.static(frontendPath));

// Routes
const authRoutes = require('./routes/auth');
const consultationRoutes = require('./routes/consultations');
const rendezvousRoutes = require('./routes/rendezvous');
const dossiersRoutes = require('./routes/dossiers');
const paiementsRoutes = require('./routes/paiements');

const familyRoutes = require('./routes/family');
const patientsRoutes = require('./routes/patients');


app.use('/api/auth', authRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/rdv', rendezvousRoutes); // Changé de /api/rendezvous pour correspondre au frontend
app.use('/api/rendezvous', rendezvousRoutes); // Alias pour compatibilité
app.use('/api/dossiers', dossiersRoutes);
app.use('/api/paiements', paiementsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/family', familyRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API CareTrack',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      consultations: '/api/consultations',
      rendezvous: '/api/rendezvous',
      dossiers: '/api/dossiers',
      paiements: '/api/paiements'
    }
  });
});

// Route de santé pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🏥  Serveur CareTrack démarré avec succès   ║
  ║                                               ║
  ║   📍 Port: ${PORT}                              ║
  ║   🌍 Environnement: ${process.env.NODE_ENV || 'development'}               ║
  ║   📡 API: http://localhost:${PORT}/api         ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

module.exports = app;
