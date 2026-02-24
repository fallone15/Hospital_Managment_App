const { query } = require('../config/database');

// Récupérer tous les médecins avec leurs disponibilités
const getMedecins = async (req, res) => {
  try {
    const { specialite } = req.query;

    let sqlQuery = `
      SELECT m.id, m.numero_medecin, m.nom, m.prenom, m.specialite, 
             m.email, m.telephone, m.photo_profil
      FROM medecins m
      WHERE m.statut = 'actif'
    `;

    const params = [];

    if (specialite) {
      sqlQuery += ' AND m.specialite = $1';
      params.push(specialite);
    }

    sqlQuery += ' ORDER BY m.nom, m.prenom';

    const result = await query(sqlQuery, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des médecins:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des médecins'
    });
  }
};

// Récupérer les disponibilités d'un médecin
const getDisponibilites = async (req, res) => {
  try {
    const { medecin_id } = req.params;
    const { date } = req.query;

    // Si une date est fournie, récupérer les créneaux disponibles pour cette date
    if (date) {
      const jour_semaine = new Date(date).getDay(); // 0 = Dimanche, 1 = Lundi, etc.

      // Récupérer les horaires de disponibilité du médecin pour ce jour
      const dispoResult = await query(
        `SELECT heure_debut, heure_fin 
         FROM disponibilites 
         WHERE medecin_id = $1 AND jour_semaine = $2`,
        [medecin_id, jour_semaine]
      );

      if (dispoResult.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            disponible: false,
            message: 'Le médecin n\'est pas disponible ce jour-là'
          }
        });
      }

      // Récupérer les rendez-vous déjà pris pour cette date
      const rdvResult = await query(
        `SELECT heure_rdv 
         FROM rendez_vous 
         WHERE medecin_id = $1 AND date_rdv = $2 AND statut != 'annule'`,
        [medecin_id, date]
      );

      const rdvPris = rdvResult.rows.map(r => r.heure_rdv);

      // Générer les créneaux disponibles (tous les 30 minutes)
      const { heure_debut, heure_fin } = dispoResult.rows[0];
      const creneaux = generateCreneaux(heure_debut, heure_fin, rdvPris);

      return res.json({
        success: true,
        data: {
          disponible: true,
          creneaux
        }
      });
    }

    // Si pas de date, récupérer tous les jours de disponibilité
    const result = await query(
      `SELECT jour_semaine, heure_debut, heure_fin 
       FROM disponibilites 
       WHERE medecin_id = $1 
       ORDER BY jour_semaine, heure_debut`,
      [medecin_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des disponibilités:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des disponibilités'
    });
  }
};

// Fonction helper pour générer les créneaux horaires
const generateCreneaux = (debut, fin, rdvPris) => {
  const creneaux = [];
  const [heureDebut, minDebut] = debut.split(':').map(Number);
  const [heureFin, minFin] = fin.split(':').map(Number);

  let heure = heureDebut;
  let minute = minDebut;

  while (heure < heureFin || (heure === heureFin && minute < minFin)) {
    const creneau = `${String(heure).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    // Vérifier si le créneau n'est pas déjà pris
    if (!rdvPris.includes(creneau)) {
      creneaux.push(creneau);
    }

    // Ajouter 30 minutes
    minute += 30;
    if (minute >= 60) {
      heure += 1;
      minute = 0;
    }
  }

  return creneaux;
};

// Créer un rendez-vous
const createRendezVous = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const { medecin_id, date_rdv, heure_rdv, motif } = req.body;

    // Vérifier si le créneau est disponible
    const checkResult = await query(
      `SELECT id FROM rendez_vous 
       WHERE medecin_id = $1 AND date_rdv = $2 AND heure_rdv = $3 AND statut != 'annule'`,
      [medecin_id, date_rdv, heure_rdv]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ce créneau n\'est plus disponible'
      });
    }

    // Créer le rendez-vous
    const result = await query(
      `INSERT INTO rendez_vous (patient_id, medecin_id, date_rdv, heure_rdv, motif, statut) 
       VALUES ($1, $2, $3, $4, $5, 'en_attente') 
       RETURNING *`,
      [patient_id, medecin_id, date_rdv, heure_rdv, motif]
    );

    // Créer une notification pour le patient
    await query(
      `INSERT INTO notifications (patient_id, titre, message, type) 
       VALUES ($1, $2, $3, $4)`,
      [
        patient_id,
        'Rendez-vous confirmé',
        `Votre rendez-vous du ${date_rdv} à ${heure_rdv} a été confirmé`,
        'rendez_vous'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Rendez-vous créé avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du rendez-vous'
    });
  }
};

// Récupérer les rendez-vous d'un patient
const getRendezVousPatient = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const { statut } = req.query;

    let sqlQuery = `
      SELECT r.*, 
             m.nom as medecin_nom, m.prenom as medecin_prenom, 
             m.specialite, m.telephone as medecin_telephone
      FROM rendez_vous r
      JOIN medecins m ON r.medecin_id = m.id
      WHERE r.patient_id = $1
    `;

    const params = [patient_id];

    if (statut) {
      sqlQuery += ' AND r.statut = $2';
      params.push(statut);
    }

    sqlQuery += ' ORDER BY r.date_rdv DESC, r.heure_rdv DESC';

    const result = await query(sqlQuery, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous'
    });
  }
};

// Récupérer les rendez-vous d'un médecin
const getRendezVousMedecin = async (req, res) => {
  try {
    const medecin_id = req.user.id;
    const { date, statut } = req.query;

    let sqlQuery = `
      SELECT r.*, 
             p.nom as patient_nom, p.prenom as patient_prenom, 
             p.numero_carte, p.telephone as patient_telephone,
             p.age, p.sexe
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id
      WHERE r.medecin_id = $1
    `;

    const params = [medecin_id];
    let paramIndex = 2;

    if (date) {
      sqlQuery += ` AND r.date_rdv = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    if (statut) {
      sqlQuery += ` AND r.statut = $${paramIndex}`;
      params.push(statut);
    }

    sqlQuery += ' ORDER BY r.date_rdv ASC, r.heure_rdv ASC';

    const result = await query(sqlQuery, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous'
    });
  }
};

// Annuler un rendez-vous
const cancelRendezVous = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_type = req.user.type;

    // Vérifier que le rendez-vous appartient à l'utilisateur
    let checkQuery;
    if (user_type === 'patient') {
      checkQuery = 'SELECT * FROM rendez_vous WHERE id = $1 AND patient_id = $2';
    } else {
      checkQuery = 'SELECT * FROM rendez_vous WHERE id = $1 AND medecin_id = $2';
    }

    const checkResult = await query(checkQuery, [id, user_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Annuler le rendez-vous
    const result = await query(
      `UPDATE rendez_vous SET statut = 'annule', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Rendez-vous annulé avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation du rendez-vous:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du rendez-vous'
    });
  }
};

module.exports = {
  getMedecins,
  getDisponibilites,
  createRendezVous,
  getRendezVousPatient,
  getRendezVousMedecin,
  cancelRendezVous
};
