const { query } = require('../config/database');

// Récupérer le dossier médical d'un patient
const getDossierMedical = async (req, res) => {
  try {
    const { patient_id } = req.params;
    
    // Vérifier que l'utilisateur a le droit d'accéder à ce dossier
    if (req.user.type === 'patient' && req.user.id !== parseInt(patient_id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const result = await query(
      `SELECT d.*, 
              m.nom as medecin_nom, m.prenom as medecin_prenom, 
              m.specialite
       FROM dossiers_medicaux d
       LEFT JOIN medecins m ON d.medecin_id = m.id
       WHERE d.patient_id = $1
       ORDER BY d.date_consultation DESC`,
      [patient_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du dossier médical:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dossier médical'
    });
  }
};

// Ajouter une entrée au dossier médical (médecin uniquement)
const addDossierEntry = async (req, res) => {
  try {
    const medecin_id = req.user.id;
    const {
      patient_id,
      date_consultation,
      diagnostic,
      prescription,
      notes,
      fichiers
    } = req.body;

    const result = await query(
      `INSERT INTO dossiers_medicaux 
       (patient_id, medecin_id, date_consultation, diagnostic, prescription, notes, fichiers) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [patient_id, medecin_id, date_consultation, diagnostic, prescription, notes, JSON.stringify(fichiers)]
    );

    // Créer une notification pour le patient
    await query(
      `INSERT INTO notifications (patient_id, titre, message, type) 
       VALUES ($1, $2, $3, $4)`,
      [
        patient_id,
        'Nouveau diagnostic',
        'Un nouveau diagnostic a été ajouté à votre dossier médical',
        'dossier_medical'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Entrée ajoutée avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'entrée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'entrée'
    });
  }
};

// Mettre à jour une entrée du dossier médical
const updateDossierEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const medecin_id = req.user.id;
    const {
      diagnostic,
      prescription,
      notes,
      fichiers
    } = req.body;

    // Vérifier que l'entrée appartient au médecin
    const checkResult = await query(
      'SELECT * FROM dossiers_medicaux WHERE id = $1 AND medecin_id = $2',
      [id, medecin_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrée non trouvée ou accès non autorisé'
      });
    }

    const result = await query(
      `UPDATE dossiers_medicaux 
       SET diagnostic = $1, prescription = $2, notes = $3, fichiers = $4, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 RETURNING *`,
      [diagnostic, prescription, notes, JSON.stringify(fichiers), id]
    );

    res.json({
      success: true,
      message: 'Entrée mise à jour avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'entrée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'entrée'
    });
  }
};

// Récupérer une entrée spécifique du dossier
const getDossierEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT d.*, 
              m.nom as medecin_nom, m.prenom as medecin_prenom, 
              m.specialite,
              p.nom as patient_nom, p.prenom as patient_prenom
       FROM dossiers_medicaux d
       LEFT JOIN medecins m ON d.medecin_id = m.id
       LEFT JOIN patients p ON d.patient_id = p.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrée non trouvée'
      });
    }

    // Vérifier les droits d'accès
    const entry = result.rows[0];
    if (req.user.type === 'patient' && req.user.id !== entry.patient_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'entrée:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'entrée'
    });
  }
};

// Récupérer les consultations d'un patient
const getConsultations = async (req, res) => {
  try {
    const { patient_id } = req.params;

    // Vérifier les droits d'accès
    if (req.user.type === 'patient' && req.user.id !== parseInt(patient_id)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const result = await query(
      `SELECT c.*, 
              m.nom as medecin_nom, m.prenom as medecin_prenom, 
              m.specialite
       FROM consultations c
       LEFT JOIN medecins m ON c.medecin_id = m.id
       WHERE c.patient_id = $1
       ORDER BY c.date_consultation DESC`,
      [patient_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des consultations'
    });
  }
};

// Ajouter une consultation (médecin uniquement)
const addConsultation = async (req, res) => {
  try {
    const medecin_id = req.user.id;
    const {
      rendez_vous_id,
      patient_id,
      symptomes,
      diagnostic,
      traitement,
      examens_demandes,
      notes
    } = req.body;

    const result = await query(
      `INSERT INTO consultations 
       (rendez_vous_id, patient_id, medecin_id, symptomes, diagnostic, traitement, examens_demandes, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [rendez_vous_id, patient_id, medecin_id, symptomes, diagnostic, traitement, examens_demandes, notes]
    );

    // Mettre à jour le statut du rendez-vous
    if (rendez_vous_id) {
      await query(
        'UPDATE rendez_vous SET statut = $1 WHERE id = $2',
        ['termine', rendez_vous_id]
      );
    }

    // Créer une notification
    await query(
      `INSERT INTO notifications (patient_id, titre, message, type) 
       VALUES ($1, $2, $3, $4)`,
      [
        patient_id,
        'Consultation terminée',
        'Votre consultation a été enregistrée. Vous pouvez consulter les détails dans votre dossier médical.',
        'consultation'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Consultation enregistrée avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement de la consultation'
    });
  }
};

module.exports = {
  getDossierMedical,
  addDossierEntry,
  updateDossierEntry,
  getDossierEntry,
  getConsultations,
  addConsultation
};
