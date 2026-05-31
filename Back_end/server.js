const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const http       = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);  // Serveur HTTP natif pour Socket.io

// ── Socket.io ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 [Socket.io] Client connecté : ${socket.id}`);

  // Permettre au client de rejoindre une room spécifique à un patient
  // Le client envoie : socket.emit('join:patient', patientId)
  socket.on('join:patient', (patientId) => {
    socket.join(`patient:${patientId}`);
    console.log(`👤 [Socket.io] Socket ${socket.id} rejoint la room patient:${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.io] Client déconnecté : ${socket.id}`);
  });
});



// ── Middlewares globaux ────────────────────────────────────────────────────
app.use(
  cors({
    origin: '*', //process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true,
  })
);

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

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const consultationRoutes = require('./routes/consultations');
const rendezvousRoutes   = require('./routes/rendezvous');
const dossiersRoutes     = require('./routes/dossiers');
const paiementsRoutes    = require('./routes/paiements');
const ordonnancesRoutes  = require('./routes/ordonnances');
const familyRoutes       = require('./routes/family');
const patientsRoutes     = require('./routes/patients');

app.use('/api/auth',          authRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/rdv',           rendezvousRoutes);  // Changé de /api/rendezvous pour correspondre au frontend
app.use('/api/rendezvous',    rendezvousRoutes);  // Alias pour compatibilité
app.use('/api/dossiers',      dossiersRoutes);
app.use('/api/paiements',     paiementsRoutes);
app.use('/api/ordonnances',   ordonnancesRoutes);
app.use('/api/patients',      patientsRoutes);
app.use('/api/family',        familyRoutes);

// ── Route de contact publique ──────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { nom, email, message } = req.body;
  if (!nom || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Veuillez remplir tous les champs (nom, email, message).'
    });
  }

  try {
    const { sendContactEmail, sendContactConfirmationEmail } = require('./utils/mailer');
    
    // Envoyer l'email à l'administration
    await sendContactEmail(email, nom, message);
    
    // Envoyer l'accusé de réception en arrière-plan
    sendContactConfirmationEmail(email, nom).catch(err => {
      console.error('⚠️ Erreur lors de l\'envoi de l\'accusé de réception:', err);
    });

    return res.status(200).json({
      success: true,
      message: 'Votre message a été envoyé avec succès ! Un email de confirmation vous a été envoyé.'
    });
  } catch (error) {
    console.error('❌ Erreur lors du traitement du formulaire de contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur interne est survenue lors de l\'envoi du message. Veuillez réessayer plus tard.'
    });
  }
});

// ── Route de test ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API CareTrack',
    version: '1.0.0',
    endpoints: {
      auth:          '/api/auth',
      consultations: '/api/consultations',
      rendezvous:    '/api/rendezvous',
      dossiers:      '/api/dossiers',
      paiements:     '/api/paiements',
    },
  });
});

// Route de santé pour vérifier que le serveur fonctionne
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// ── Gestion des erreurs 404 ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

// ── Gestion des erreurs globales ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Démarrage du serveur ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🏥  Serveur CareTrack démarré avec succès   ║
  ║                                               ║
  ║   📍 Port: ${PORT}                              ║
  ║   🌍 Environnement: ${process.env.NODE_ENV || 'development'}               ║
  ║   📡 API:    http://localhost:${PORT}/api      ║
  ║   🔌 WS:     http://localhost:${PORT}          ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);


});

// ── Gestion propre de l'arrêt ──────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

module.exports = app;
