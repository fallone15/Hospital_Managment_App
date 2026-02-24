const { query } = require('../config/database');

// Récupérer tous les médecins filtrés par service
const getMedecins = async (req, res) => {
  try {
    const { serviceId, specialite, date } = req.query;

    let sqlQuery = `
      SELECT DISTINCT m.id_medecin as id, m.nom, m.prenom, m.specialite, 
             m.email, m.telephone
      FROM medecins m
    `;

    const params = [];
    let idx = 1;

    // Si une date est fournie, filtrer par disponibilité hebdomadaire
    if (date) {
      // Évite les décalages de fuseau horaire en parsant manuellement YYYY-MM-DD
      const [y, m, d] = date.split('-').map(Number);
      const dayOfWeek = new Date(y, m - 1, d).getDay();
      sqlQuery += ` JOIN disponibilites d ON m.id_medecin = d.medecin_id AND d.jour_semaine = $${idx}`;
      params.push(dayOfWeek);
      idx++;
    }

    sqlQuery += ` WHERE m.actif = TRUE`;

    if (serviceId) {
      sqlQuery += ` AND m.id_service = $${idx}`;
      params.push(serviceId);
      idx++;
    }

    if (specialite) {
      sqlQuery += ` AND m.specialite = $${idx}`;
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

    if (date) {
      const [y, m, d] = date.split('-').map(Number);
      const jour_semaine = new Date(y, m - 1, d).getDay();

      const dispoResult = await query(
        `SELECT heure_debut, heure_fin 
         FROM disponibilites 
         WHERE medecin_id = $1 AND jour_semaine = $2`,
        [medecin_id, jour_semaine]
      );

      if (dispoResult.rows.length === 0) {
        return res.json({
          success: true,
          data: { disponible: false, message: 'Le médecin n\'est pas disponible ce jour-là' }
        });
      }

      const rdvResult = await query(
        `SELECT heure_rdv 
         FROM rendez_vous 
         WHERE medecin_id = $1 AND date_rdv = $2 AND statut != 'annule'`,
        [medecin_id, date]
      );

      const rdvPris = rdvResult.rows.map(r => r.heure_rdv.toString().substring(0, 5));

      const { heure_debut, heure_fin } = dispoResult.rows[0];
      const creneaux = generateCreneaux(heure_debut, heure_fin, rdvPris);

      return res.json({
        success: true,
        data: { disponible: true, creneaux }
      });
    }

    const result = await query(
      `SELECT jour_semaine, heure_debut, heure_fin FROM disponibilites 
       WHERE medecin_id = $1 ORDER BY jour_semaine`,
      [medecin_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des disponibilités:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des disponibilités' });
  }
};

// Fonction helper pour générer les créneaux horaires
const generateCreneaux = (debut, fin, rdvPris) => {
  const creneaux = [];
  const [hDebut, mDebut] = debut.split(':').map(Number);
  const [hFin, mFin] = fin.split(':').map(Number);

  let h = hDebut;
  let m = mDebut;

  while (h < hFin || (h === hFin && m < mFin)) {
    const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (!rdvPris.includes(slot)) {
      creneaux.push(slot);
    }
    m += 30;
    if (m >= 60) { h += 1; m = 0; }
  }
  return creneaux;
};

// Créer un rendez-vous
const createRendezVous = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const { medecin_id, date_rdv, heure_rdv, motif, id_member } = req.body;

    if (id_member) {
      const memberCheck = await query(
        'SELECT id_member FROM family_members WHERE id_member = $1 AND id_titulaire = $2 AND actif = TRUE',
        [id_member, patient_id]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Membre familial introuvable.' });
      }
    }

    const checkResult = await query(
      `SELECT id FROM rendez_vous 
       WHERE medecin_id = $1 AND date_rdv = $2 AND heure_rdv = $3 AND statut != 'annule'`,
      [medecin_id, date_rdv, heure_rdv]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Ce créneau n\'est plus disponible' });
    }

    const result = await query(
      `INSERT INTO rendez_vous (patient_id, id_member, medecin_id, date_rdv, heure_rdv, motif, statut) 
       VALUES ($1, $2, $3, $4, $5, $6, 'en_attente') 
       RETURNING *`,
      [patient_id, id_member || null, medecin_id, date_rdv, heure_rdv, motif]
    );

    res.status(201).json({
      success: true,
      message: 'Rendez-vous créé avec succès',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la création du rendez-vous' });
  }
};

// Récupérer les rendez-vous d'un patient
const getRendezVousPatient = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const { statut, id_member } = req.query;

    let sqlQuery = `
      SELECT r.*, 
             m.nom as medecin_nom, m.prenom as medecin_prenom, 
             m.specialite, m.telephone as medecin_telephone,
             fm.nom as member_nom, fm.prenom as member_prenom, fm.lien as member_lien,
             s.nom as service_nom
      FROM rendez_vous r
      JOIN medecins m ON r.medecin_id = m.id_medecin
      JOIN services s ON m.id_service = s.id_service
      LEFT JOIN family_members fm ON r.id_member = fm.id_member
      WHERE r.patient_id = $1
    `;

    const params = [patient_id];
    let idx = 2;

    if (id_member && id_member !== 'all') {
      sqlQuery += ` AND r.id_member = $${idx}`;
      params.push(id_member);
      idx++;
    }

    if (statut) {
      sqlQuery += ` AND r.statut = $${idx}`;
      params.push(statut);
    }

    sqlQuery += ' ORDER BY r.date_rdv DESC, r.heure_rdv DESC';

    const result = await query(sqlQuery, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des rendez-vous' });
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
             p.telephone as patient_telephone, p.sexe
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id_patient
      WHERE r.medecin_id = $1
    `;

    const params = [medecin_id];
    let idx = 2;

    if (date) {
      sqlQuery += ` AND r.date_rdv = $${idx}`;
      params.push(date);
      idx++;
    }

    if (statut) {
      sqlQuery += ` AND r.statut = $${idx}`;
      params.push(statut);
    }

    sqlQuery += ' ORDER BY r.date_rdv ASC, r.heure_rdv ASC';

    const result = await query(sqlQuery, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des rendez-vous' });
  }
};

// Annuler un rendez-vous
const cancelRendezVous = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_type = req.user.type;

    let checkQuery = user_type === 'patient'
      ? 'SELECT * FROM rendez_vous WHERE id = $1 AND patient_id = $2'
      : 'SELECT * FROM rendez_vous WHERE id = $1 AND medecin_id = $2';

    const checkResult = await query(checkQuery, [id, user_id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Rendez-vous non trouvé' });
    }

    const result = await query(
      `UPDATE rendez_vous SET statut = 'annule', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({ success: true, message: 'Rendez-vous annulé avec succès', data: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de l\'annulation du rendez-vous:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation du rendez-vous' });
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
