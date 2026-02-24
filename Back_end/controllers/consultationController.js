const { query } = require('../config/database');

// Créer une nouvelle consultation (file d'attente)
const createConsultation = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const { id_service, motif } = req.body;

    // Générer un numéro de file d'attente
    const today = new Date().toISOString().split('T')[0];
    const countResult = await query(
      `SELECT COUNT(*) FROM consultations 
       WHERE DATE(heure_arrivee) = $1 AND id_service = $2`,
      [today, id_service]
    );
    
    const numero_file = `S${id_service}-${String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0')}`;

    // Créer la consultation
    const result = await query(
      `INSERT INTO consultations 
       (id_patient, id_service, numero_file, motif, statut) 
       VALUES ($1, $2, $3, $4, 'en_attente') 
       RETURNING *`,
      [patient_id, id_service, numero_file, motif]
    );

    // Récupérer les infos du service
    const serviceResult = await query(
      'SELECT nom, tarif, duree_moyenne FROM services WHERE id_service = $1',
      [id_service]
    );

    res.status(201).json({
      success: true,
      message: 'Consultation enregistrée avec succès',
      data: {
        consultation: result.rows[0],
        service: serviceResult.rows[0],
        numero_file: numero_file
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la consultation'
    });
  }
};

// Récupérer la file d'attente d'un service
const getFileAttente = async (req, res) => {
  try {
    const { id_service } = req.params;
    const { date } = req.query;

    const dateFilter = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `SELECT c.*, 
              p.nom as patient_nom, p.prenom as patient_prenom, p.carte_rfid,
              m.nom as medecin_nom, m.prenom as medecin_prenom,
              s.nom as service_nom, s.duree_moyenne
       FROM consultations c
       JOIN patients p ON c.id_patient = p.id_patient
       LEFT JOIN medecins m ON c.id_medecin = m.id_medecin
       JOIN services s ON c.id_service = s.id_service
       WHERE c.id_service = $1 
       AND DATE(c.heure_arrivee) = $2
       AND c.statut IN ('en_attente', 'en_cours')
       ORDER BY c.heure_arrivee ASC`,
      [id_service, dateFilter]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la file d\'attente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la file d\'attente'
    });
  }
};

// Récupérer les consultations d'un patient
const getConsultationsPatient = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const { statut } = req.query;

    let sqlQuery = `
      SELECT c.*, 
             s.nom as service_nom, s.tarif,
             m.nom as medecin_nom, m.prenom as medecin_prenom, m.specialite,
             sa.numero_salle, sa.batiment, sa.etage
      FROM consultations c
      JOIN services s ON c.id_service = s.id_service
      LEFT JOIN medecins m ON c.id_medecin = m.id_medecin
      LEFT JOIN salles sa ON c.id_salle = sa.id_salle
      WHERE c.id_patient = $1
    `;

    const params = [patient_id];

    if (statut) {
      sqlQuery += ' AND c.statut = $2';
      params.push(statut);
    }

    sqlQuery += ' ORDER BY c.heure_arrivee DESC';

    const result = await query(sqlQuery, params);

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

// Mettre à jour une consultation (médecin uniquement)
const updateConsultation = async (req, res) => {
  try {
    const { id_consultation } = req.params;
    const medecin_id = req.user.id;
    const {
      id_salle,
      statut,
      observations,
      diagnostic,
      montant_paye,
      mode_paiement
    } = req.body;

    // Vérifier que la consultation existe
    const checkResult = await query(
      'SELECT * FROM consultations WHERE id_consultation = $1',
      [id_consultation]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation non trouvée'
      });
    }

    let updateQuery = 'UPDATE consultations SET ';
    const updates = [];
    const params = [id_consultation];
    let paramIndex = 2;

    // Assigner le médecin si pas encore fait
    if (!checkResult.rows[0].id_medecin) {
      updates.push(`id_medecin = $${paramIndex}`);
      params.push(medecin_id);
      paramIndex++;
    }

    if (id_salle) {
      updates.push(`id_salle = $${paramIndex}`);
      params.push(id_salle);
      paramIndex++;
    }

    if (statut) {
      updates.push(`statut = $${paramIndex}`);
      params.push(statut);
      paramIndex++;

      // Mettre à jour les timestamps selon le statut
      if (statut === 'en_cours') {
        updates.push('heure_debut = CURRENT_TIMESTAMP');
      } else if (statut === 'terminee') {
        updates.push('heure_fin = CURRENT_TIMESTAMP');
      }
    }

    if (observations) {
      updates.push(`observations = $${paramIndex}`);
      params.push(observations);
      paramIndex++;
    }

    if (diagnostic) {
      updates.push(`diagnostic = $${paramIndex}`);
      params.push(diagnostic);
      paramIndex++;
    }

    if (montant_paye) {
      updates.push(`montant_paye = $${paramIndex}`);
      params.push(montant_paye);
      paramIndex++;
    }

    if (mode_paiement) {
      updates.push(`mode_paiement = $${paramIndex}`);
      params.push(mode_paiement);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune mise à jour fournie'
      });
    }

    updateQuery += updates.join(', ') + ' WHERE id_consultation = $1 RETURNING *';

    const result = await query(updateQuery, params);

    res.json({
      success: true,
      message: 'Consultation mise à jour avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la consultation'
    });
  }
};

// Annuler une consultation
const cancelConsultation = async (req, res) => {
  try {
    const { id_consultation } = req.params;
    const patient_id = req.user.id;

    // Vérifier que la consultation appartient au patient
    const checkResult = await query(
      'SELECT * FROM consultations WHERE id_consultation = $1 AND id_patient = $2',
      [id_consultation, patient_id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultation non trouvée'
      });
    }

    // Annuler la consultation
    const result = await query(
      `UPDATE consultations 
       SET statut = 'annulee' 
       WHERE id_consultation = $1 
       RETURNING *`,
      [id_consultation]
    );

    res.json({
      success: true,
      message: 'Consultation annulée avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la consultation'
    });
  }
};

// Récupérer les consultations d'un médecin
const getConsultationsMedecin = async (req, res) => {
  try {
    const medecin_id = req.user.id;
    const { date, statut } = req.query;

    let sqlQuery = `
      SELECT c.*, 
             p.nom as patient_nom, p.prenom as patient_prenom, 
             p.carte_rfid, p.date_naissance, p.sexe, p.allergies, p.groupe_sanguin,
             s.nom as service_nom,
             sa.numero_salle, sa.batiment, sa.etage
      FROM consultations c
      JOIN patients p ON c.id_patient = p.id_patient
      JOIN services s ON c.id_service = s.id_service
      LEFT JOIN salles sa ON c.id_salle = sa.id_salle
      WHERE c.id_medecin = $1
    `;

    const params = [medecin_id];
    let paramIndex = 2;

    if (date) {
      sqlQuery += ` AND DATE(c.heure_arrivee) = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (statut) {
      sqlQuery += ` AND c.statut = $${paramIndex}`;
      params.push(statut);
    }

    sqlQuery += ' ORDER BY c.heure_arrivee DESC';

    const result = await query(sqlQuery, params);

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

// Récupérer les services disponibles
const getServices = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM services WHERE actif = TRUE ORDER BY nom'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des services'
    });
  }
};

// Récupérer les salles disponibles
const getSallesDisponibles = async (req, res) => {
  try {
    const { id_service } = req.query;

    let sqlQuery = 'SELECT * FROM salles WHERE occupee = FALSE AND actif = TRUE';
    const params = [];

    if (id_service) {
      sqlQuery += ' AND id_service = $1';
      params.push(id_service);
    }

    sqlQuery += ' ORDER BY batiment, etage, numero_salle';

    const result = await query(sqlQuery, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des salles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des salles'
    });
  }
};

module.exports = {
  createConsultation,
  getFileAttente,
  getConsultationsPatient,
  updateConsultation,
  cancelConsultation,
  getConsultationsMedecin,
  getServices,
  getSallesDisponibles
};
