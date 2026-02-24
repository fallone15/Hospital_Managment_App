const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/mailer');

// Générer un token JWT
const generateToken = (id, type) => {
  return jwt.sign(
    { id, type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Inscription d'un patient
const registerPatient = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      date_naissance,
      sexe,
      adresse,
      code_postal,
      ville,
      email,
      telephone,
      cin,
      numero_secu,
      mutuelle,
      allergies,
      groupe_sanguin,
      code_pin
    } = req.body;

    // Nouvelle règle : bloquer la création de compte pour les moins de 16 ans
    const today = new Date();
    const birthDate = new Date(date_naissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 16) {
      return res.status(400).json({
        success: false,
        message: "La création de compte nécessite d'avoir au moins 16 ans."
      });
    }

    // Nettoyer les enregistrements en attente expirés
    await query(
      'DELETE FROM pending_registrations WHERE verification_token_expires < NOW()',
      []
    );

    // Vérifier si l'email existe déjà (dans patients ou pending_registrations valides)
    const emailCheck = await query(
      'SELECT id_patient FROM patients WHERE email = $1 UNION SELECT id FROM pending_registrations WHERE email = $1 AND verification_token_expires > NOW()',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier si le CIN existe déjà (dans patients) - seulement si CIN fourni
    if (cin) {
      const cinCheck = await query(
        'SELECT id_patient FROM patients WHERE cin = $1',
        [cin]
      );

      if (cinCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ce CIN/Passeport est déjà enregistré'
        });
      }
    }

    // Hasher le code PIN
    const hashedPin = await bcrypt.hash(code_pin, 10);

    // Générer un numéro de carte RFID unique
    const carte_rfid = 'PAT' + Math.floor(1000 + Math.random() * 9000);

    // Générer un token de vérification Email (32 caractères hexadécimaux)
    const verificationToken = crypto.randomBytes(16).toString('hex');

    // Stocker les données d'inscription en attente dans pending_registrations
    const registrationData = {
      nom,
      prenom,
      date_naissance,
      sexe,
      adresse,
      code_postal,
      ville,
      telephone,
      cin: cin || null,
      numero_secu: numero_secu || null,
      mutuelle: mutuelle || null,
      allergies: allergies || [],
      groupe_sanguin: groupe_sanguin || null,
      code_pin_hashed: hashedPin,
      carte_rfid
    };

    const pendingResult = await query(
      `INSERT INTO pending_registrations 
       (email, verification_token, verification_token_expires, registration_data)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours', $3)
       RETURNING email`,
      [email, verificationToken, JSON.stringify(registrationData)]
    );

    // Envoyer l'email de vérification
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5500'}/Front_end/verify-email.html?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      await sendVerificationEmail(email, nom, prenom, verificationUrl);
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', emailError);
      // On continue même si l'email ne s'envoie pas
    }

    res.status(201).json({
      success: true,
      message: 'Inscription en attente. Vérifiez votre email pour confirmer votre inscription.',
      data: {
        email: email,
        carte_rfid: registrationData.carte_rfid,
        nom: nom,
        prenom: prenom,
        message: 'Un email a été envoyé. Veuillez cliquer sur le lien pour confirmer votre inscription.',
        emailVerificationRequired: true
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte'
    });
  }
};

// Vérifier l'email du patient
const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Token et email sont obligatoires'
      });
    }

    // Chercher dans les inscriptions en attente
    const pendingResult = await query(
      `SELECT * FROM pending_registrations 
       WHERE email = $1 AND verification_token = $2 AND verification_token_expires > NOW()`,
      [email, token]
    );

    if (pendingResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré. Veuillez vous réinscrire.'
      });
    }

    const pending = pendingResult.rows[0];
    const data = pending.registration_data;

    // Créer le patient avec les données stockées
    const patientResult = await query(
      `INSERT INTO patients 
       (carte_rfid, nom, prenom, date_naissance, sexe, adresse, code_postal, ville, 
        email, telephone, cin, numero_secu, mutuelle, allergies, groupe_sanguin, code_pin, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, TRUE)
       RETURNING id_patient, carte_rfid, nom, prenom, email`,
      [data.carte_rfid, data.nom, data.prenom, data.date_naissance, data.sexe,
      data.adresse, data.code_postal, data.ville, email, data.telephone,
      data.cin || null, data.numero_secu, data.mutuelle, data.allergies,
      data.groupe_sanguin, data.code_pin_hashed]
    );

    const patient = patientResult.rows[0];

    // Supprimer l'enregistrement temporaire
    await query(
      'DELETE FROM pending_registrations WHERE id = $1',
      [pending.id]
    );

    // Envoyer l'email de bienvenue
    try {
      await sendWelcomeEmail(email, patient.nom, patient.prenom, patient.carte_rfid);
    } catch (emailError) {
      console.error('⚠️ Erreur lors de l\'envoi de l\'email de bienvenue:', emailError);
    }

    res.json({
      success: true,
      message: 'Email vérifié avec succès! Vous pouvez maintenant vous connecter.',
      data: {
        patient: {
          id: patient.id_patient,
          carte_rfid: patient.carte_rfid,
          nom: patient.nom,
          prenom: patient.prenom,
          email: patient.email
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'email'
    });
  }
};

// Connexion d'un patient
const loginPatient = async (req, res) => {
  try {
    const { identifier, code_pin } = req.body;

    // Chercher le patient par email ou carte RFID
    const result = await query(
      'SELECT * FROM patients WHERE (email = $1 OR carte_rfid = $1) AND actif = TRUE',
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }

    const patient = result.rows[0];

    // Vérifier si l'email est confirmé
    if (!patient.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Veuillez d\'abord vérifier votre email. Consultez votre boîte de réception.',
        emailVerificationRequired: true
      });
    }

    // Vérifier le code PIN
    const isValidPin = await bcrypt.compare(code_pin, patient.code_pin);

    if (!isValidPin) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }

    // Générer le token
    const token = generateToken(patient.id_patient, 'patient');

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        patient: {
          id: patient.id_patient,
          carte_rfid: patient.carte_rfid,
          nom: patient.nom,
          prenom: patient.prenom,
          email: patient.email,
          telephone: patient.telephone
        },
        token
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

// Connexion d'un médecin
const loginMedecin = async (req, res) => {
  try {
    const { identifier, code_pin } = req.body;

    // Chercher le médecin par email ou carte RFID
    const result = await query(
      'SELECT * FROM medecins WHERE email = $1 OR carte_rfid = $1 AND actif = TRUE',
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }

    const medecin = result.rows[0];

    // Vérifier le code PIN
    const isValidPin = await bcrypt.compare(code_pin, medecin.code_pin);

    if (!isValidPin) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants incorrects'
      });
    }

    // Générer le token
    const token = generateToken(medecin.id_medecin, 'medecin');

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        medecin: {
          id: medecin.id_medecin,
          carte_rfid: medecin.carte_rfid,
          nom: medecin.nom,
          prenom: medecin.prenom,
          specialite: medecin.specialite,
          email: medecin.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

// Obtenir le profil de l'utilisateur connecté
const getProfile = async (req, res) => {
  try {
    const { id, type } = req.user;

    let result;
    if (type === 'patient') {
      result = await query(
        `SELECT id_patient, carte_rfid, nom, prenom, date_naissance, sexe, 
                adresse, code_postal, ville, email, telephone, numero_secu, 
                mutuelle, allergies, groupe_sanguin, medecin_traitant, date_inscription 
         FROM patients WHERE id_patient = $1`,
        [id]
      );
    } else {
      result = await query(
        `SELECT m.id_medecin, m.carte_rfid, m.nom, m.prenom, m.specialite, 
                m.email, m.telephone, m.disponible, m.date_embauche,
                s.nom as service_nom
         FROM medecins m
         LEFT JOIN services s ON m.id_service = s.id_service
         WHERE m.id_medecin = $1`,
        [id]
      );
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

module.exports = {
  registerPatient,
  verifyEmail,
  loginPatient,
  loginMedecin,
  getProfile
};
