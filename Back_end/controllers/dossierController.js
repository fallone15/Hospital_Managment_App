const { query } = require('../config/database');

// Récupérer le dossier médical d'un patient
const getDossierMedical = async (req, res) => {
  try {
    const patient_id = req.user.id; // Le titulaire authentifié
    const { patient_id: target_id } = req.params;
    const { type, id_member } = req.query;

    let sqlQuery = `
      SELECT c.*, 
             m.nom as medecin_nom, m.prenom as medecin_prenom, m.specialite,
             (SELECT json_agg(o.*) FROM ordonnances o WHERE o.id_consultation = c.id_consultation) as ordonnances,
             (SELECT json_agg(r.*) FROM resultats_examens r WHERE r.id_consultation = c.id_consultation) as examens,
             (SELECT json_agg(cv.*) FROM constantes_vitales cv WHERE cv.id_consultation = c.id_consultation) as constantes
      FROM consultations c
      LEFT JOIN medecins m ON c.id_medecin = m.id_medecin
      WHERE c.id_patient = $1 AND c.statut = 'terminee'
    `;
    const params = [patient_id];

    if (type === 'member' || id_member) {
      const memberId = id_member || target_id;
      sqlQuery += ' AND c.id_member = $2';
      params.push(memberId);
    } else {
      sqlQuery += ' AND c.id_member IS NULL';
    }

    sqlQuery += ' ORDER BY c.heure_fin DESC';

    const result = await query(sqlQuery, params);

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
      id_consultation,
      diagnostic,
      observations,
      notes,
      fichiers
    } = req.body;

    // Si on a un id_consultation, on met à jour cette consultation
    if (id_consultation) {
      const result = await query(
        `UPDATE consultations 
         SET diagnostic = $1, observations = $2, notes = $3, fichiers = $4, 
             statut = 'terminee', heure_fin = CURRENT_TIMESTAMP
         WHERE id_consultation = $5 AND id_medecin = $6
         RETURNING *`,
        [diagnostic, observations, notes, JSON.stringify(fichiers), id_consultation, medecin_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Consultation non trouvée ou non autorisée' });
      }

      return res.status(200).json({
        success: true,
        message: 'Dossier mis à jour avec succès',
        data: result.rows[0]
      });
    }

    // Sinon, on devrait peut-être en créer une nouvelle, mais le workflow habituel
    // est de partir d'une consultation existante (file d'attente ou RDV).
    res.status(400).json({ success: false, message: 'ID de consultation requis' });
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
      observations,
      notes,
      fichiers
    } = req.body;

    const result = await query(
      `UPDATE consultations 
       SET diagnostic = $1, observations = $2, notes = $3, fichiers = $4
       WHERE id_consultation = $5 AND id_medecin = $6 RETURNING *`,
      [diagnostic, observations, notes, JSON.stringify(fichiers), id, medecin_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrée non trouvée ou accès non autorisé'
      });
    }

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
      `SELECT c.*, 
              m.nom as medecin_nom, m.prenom as medecin_prenom, m.specialite,
              p.nom as patient_nom, p.prenom as patient_prenom,
              (SELECT json_agg(o.*) FROM ordonnances o WHERE o.id_consultation = c.id_consultation) as ordonnances,
              (SELECT json_agg(r.*) FROM resultats_examens r WHERE r.id_consultation = c.id_consultation) as examens,
              (SELECT json_agg(cv.*) FROM constantes_vitales cv WHERE cv.id_consultation = c.id_consultation) as constantes
       FROM consultations c
       LEFT JOIN medecins m ON c.id_medecin = m.id_medecin
       LEFT JOIN patients p ON c.id_patient = p.id_patient
       WHERE c.id_consultation = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Entrée non trouvée'
      });
    }

    const entry = result.rows[0];
    // Vérifier les droits d'accès
    if (req.user.type === 'patient' && req.user.id !== entry.id_patient) {
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
       LEFT JOIN medecins m ON c.id_medecin = m.id_medecin
       WHERE c.id_patient = $1
       ORDER BY c.heure_arrivee DESC`,
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
      motif,
      observations,
      diagnostic,
      notes
    } = req.body;

    // Note: Pour une nouvelle consultation via id_medecin, on devrait générer un numero_file
    // ou simplement utiliser le rendez_vous_id pour lier.
    // Ici on suppose qu'elle existe déjà ou qu'on la crée.
    // Étant donné que consultations est aussi la file d'attente, 
    // lier à un RDV est la meilleure option.

    let result;
    if (rendez_vous_id) {
      // On cherche si une consultation existe déjà pour ce RDV
      const existing = await query('SELECT id_consultation FROM consultations WHERE id_patient = $1 AND id_medecin = $2 AND statut != \'terminee\'', [patient_id, medecin_id]);
      if (existing.rows.length > 0) {
        result = await query(
          `UPDATE consultations 
              SET diagnostic = $1, observations = $2, notes = $3, statut = 'terminee', heure_fin = CURRENT_TIMESTAMP
              WHERE id_consultation = $4 RETURNING *`,
          [diagnostic, observations, notes, existing.rows[0].id_consultation]
        );
      } else {
        // On en crée une liée au RDV (mais attention aux colonnes obligatoires comme numero_file)
        // Pour simplifier, on renvoie une erreur car le workflow normal passe par la file d'attente
        return res.status(400).json({ success: false, message: 'Veuillez démarrer la consultation via la file d\'attente' });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Consultation enregistrée avec succès',
      data: result ? result.rows[0] : null
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
