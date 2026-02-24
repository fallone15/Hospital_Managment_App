const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware pour vérifier le token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Accès refusé. Token manquant.' 
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier si l'utilisateur existe toujours
    let user;
    if (decoded.type === 'patient') {
      const result = await query(
        'SELECT id_patient as id, carte_rfid, nom, prenom, email FROM patients WHERE id_patient = $1 AND actif = TRUE',
        [decoded.id]
      );
      user = result.rows[0];
    } else if (decoded.type === 'medecin') {
      const result = await query(
        'SELECT id_medecin as id, carte_rfid, nom, prenom, email, specialite FROM medecins WHERE id_medecin = $1 AND actif = TRUE',
        [decoded.id]
      );
      user = result.rows[0];
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utilisateur non trouvé.' 
      });
    }

    // Ajouter les infos de l'utilisateur à la requête
    req.user = {
      ...user,
      type: decoded.type
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expiré. Veuillez vous reconnecter.' 
      });
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Token invalide.' 
    });
  }
};

// Middleware pour vérifier que l'utilisateur est un patient
const authenticatePatient = async (req, res, next) => {
  await authenticateToken(req, res, () => {
    if (req.user.type !== 'patient') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès réservé aux patients.' 
      });
    }
    next();
  });
};

// Middleware pour vérifier que l'utilisateur est un médecin
const authenticateMedecin = async (req, res, next) => {
  await authenticateToken(req, res, () => {
    if (req.user.type !== 'medecin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès réservé aux médecins.' 
      });
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  authenticatePatient,
  authenticateMedecin
};
