const { pool } = require('../config/database');
const mqttService = require('../services/mqttService');

/**
 * GET /api/sensors/latest
 * Retourne les dernières constantes vitales de chaque patient (depuis le cache MQTT en mémoire)
 */
const getLatestAll = (req, res) => {
  const data = mqttService.getAllLatest();
  res.json({ success: true, data });
};

/**
 * GET /api/sensors/latest/:patientId
 * Retourne les dernières constantes vitales d'un patient spécifique (cache MQTT)
 */
const getLatestByPatient = (req, res) => {
  const { patientId } = req.params;
  const data = mqttService.getLatest(parseInt(patientId, 10));

  if (!data) {
    return res.status(404).json({
      success: false,
      message: 'Aucune donnée capteur reçue pour ce patient',
    });
  }

  res.json({ success: true, data });
};

/**
 * GET /api/sensors/history/:patientId
 * Retourne l'historique des constantes vitales depuis la base de données
 * Query params: limit (défaut 50), offset (défaut 0)
 */
const getHistory = async (req, res) => {
  const { patientId } = req.params;
  const limit  = parseInt(req.query.limit,  10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;

  try {
    const result = await pool.query(
      `SELECT id_constante, id_patient, id_consultation, rendez_vous_id,
              temperature, frequence_cardiaque, spo2,
              tension_systolique, tension_diastolique,
              timestamp, source
       FROM constantes_vitales
       WHERE id_patient = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset]
    );

    res.json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    console.error('❌ [SensorController] getHistory:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * GET /api/sensors/history/:patientId/consultation/:consultationId
 * Retourne les constantes vitales d'une consultation précise
 */
const getByConsultation = async (req, res) => {
  const { patientId, consultationId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM constantes_vitales
       WHERE id_patient = $1 AND id_consultation = $2
       ORDER BY timestamp ASC`,
      [patientId, consultationId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ [SensorController] getByConsultation:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * POST /api/sensors/manual
 * Permet d'insérer manuellement des constantes vitales (test ou saisie manuelle)
 * Body: { id_patient, id_consultation?, rendez_vous_id?,
 *         temperature?, frequence_cardiaque?, spo2?,
 *         tension_systolique?, tension_diastolique? }
 */
const insertManual = async (req, res) => {
  const {
    id_patient,
    id_consultation,
    rendez_vous_id,
    temperature,
    frequence_cardiaque,
    spo2,
    tension_systolique,
    tension_diastolique,
  } = req.body;

  if (!id_patient) {
    return res.status(400).json({ success: false, message: 'id_patient est requis' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO constantes_vitales
         (id_patient, id_consultation, rendez_vous_id,
          temperature, frequence_cardiaque, spo2,
          tension_systolique, tension_diastolique, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'saisie_manuelle')
       RETURNING *`,
      [
        id_patient,
        id_consultation || null,
        rendez_vous_id  || null,
        temperature     || null,
        frequence_cardiaque || null,
        spo2            || null,
        tension_systolique  || null,
        tension_diastolique || null,
      ]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('❌ [SensorController] insertManual:', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * GET /api/sensors/status
 * Retourne l'état de connexion MQTT
 */
const getMqttStatus = (req, res) => {
  const allLatest = mqttService.getAllLatest();
  const patientCount = Object.keys(allLatest).length;

  res.json({
    success: true,
    mqtt: {
      host:    process.env.MQTT_HOST     || 'broker.shiftr.io',
      username: process.env.MQTT_USERNAME || '(non configuré)',
      topics: [
        'hospital/sensors/vitals',
        'hospital/sensors/temperature',
        'hospital/sensors/heart_rate',
        'hospital/sensors/spo2',
        'hospital/sensors/blood_pressure',
      ],
    },
    cache: {
      patientsActifs: patientCount,
      donnees: allLatest,
    },
  });
};

module.exports = {
  getLatestAll,
  getLatestByPatient,
  getHistory,
  getByConsultation,
  insertManual,
  getMqttStatus,
};
