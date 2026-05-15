/**
 * mqttService.js
 * Service MQTT pour la réception des données des capteurs médicaux
 * Broker : shiftr.io
 * 
 * Topics supportés :
 *   hospital/sensors/vitals  → JSON complet  { id_patient, temperature, frequence_cardiaque, spo2, tension_systolique, tension_diastolique }
 *   hospital/sensors/temperature      → { id_patient, value }
 *   hospital/sensors/heart_rate       → { id_patient, value }
 *   hospital/sensors/spo2             → { id_patient, value }
 *   hospital/sensors/blood_pressure   → { id_patient, systolique, diastolique }
 */

const mqtt = require('mqtt');
const { pool } = require('../config/database');

let ioInstance = null;   // Référence à Socket.io (injectée depuis server.js)
let mqttClient = null;

// Buffer en mémoire des dernières valeurs par patient (accès rapide sans requête DB)
const latestByPatient = {};

/**
 * Injecter l'instance Socket.io pour broadcaster en temps réel
 */
const setIO = (io) => {
  ioInstance = io;
};

/**
 * Sauvegarder les constantes vitales en base de données
 */
const saveToDatabase = async (data) => {
  const {
    id_patient,
    id_consultation = null,
    rendez_vous_id = null,
    temperature = null,
    frequence_cardiaque = null,
    spo2 = null,
    tension_systolique = null,
    tension_diastolique = null,
  } = data;

  if (!id_patient) {
    console.warn('⚠️  [MQTT] Message reçu sans id_patient — ignoré');
    return null;
  }

  try {
    const result = await pool.query(
      `INSERT INTO constantes_vitales
         (id_patient, id_consultation, rendez_vous_id,
          temperature, frequence_cardiaque, spo2,
          tension_systolique, tension_diastolique, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'mqtt_sensor')
       RETURNING *`,
      [
        id_patient,
        id_consultation,
        rendez_vous_id,
        temperature,
        frequence_cardiaque,
        spo2,
        tension_systolique,
        tension_diastolique,
      ]
    );

    const saved = result.rows[0];
    console.log(`✅ [MQTT] Constantes vitales sauvegardées (patient ${id_patient}):`, saved);
    return saved;
  } catch (err) {
    console.error('❌ [MQTT] Erreur lors de la sauvegarde en DB:', err.message);
    return null;
  }
};

/**
 * Parser sécurisé JSON depuis un Buffer MQTT
 */
const safeParse = (buffer) => {
  try {
    return JSON.parse(buffer.toString());
  } catch {
    // Si c'est un simple nombre (ex : "36.5")
    const raw = buffer.toString().trim();
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
  }
};

/**
 * Merger les nouvelles données dans le buffer en mémoire
 * et émettre l'événement Socket.io
 */
const updateAndBroadcast = async (patientId, newFields) => {
  // Mise à jour du buffer mémoire
  latestByPatient[patientId] = {
    ...(latestByPatient[patientId] || {}),
    id_patient: patientId,
    ...newFields,
    timestamp: new Date().toISOString(),
  };

  const payload = latestByPatient[patientId];

  // Sauvegarder en DB
  await saveToDatabase(payload);

  // Broadcaster via Socket.io à tous les clients connectés
  if (ioInstance) {
    ioInstance.emit('sensor:update', payload);
    // Émettre aussi dans une room dédiée au patient
    ioInstance.to(`patient:${patientId}`).emit('sensor:update', payload);
  }
};

/**
 * Handler principal des messages MQTT
 */
const handleMessage = async (topic, message) => {
  const data = safeParse(message);
  if (data === null) {
    console.warn(`⚠️  [MQTT] Impossible de parser le message sur "${topic}"`);
    return;
  }

  console.log(`📡 [MQTT] Message reçu sur "${topic}":`, data);

  // ── Topic : hospital/sensors/vitals ──────────────────────────────
  if (topic === 'hospital/sensors/vitals') {
    // Attend un objet JSON complet
    if (typeof data !== 'object') return;
    const { id_patient } = data;
    if (!id_patient) return;
    await updateAndBroadcast(id_patient, data);
    return;
  }

  // Pour les topics individuels, data peut être un objet { id_patient, value }
  // ou simplement une valeur si id_patient est dans le chemin du topic
  const patientId = typeof data === 'object' ? data.id_patient : null;
  if (!patientId) {
    console.warn(`⚠️  [MQTT] "${topic}" : id_patient manquant dans le payload`);
    return;
  }

  // ── Topic : hospital/sensors/temperature ─────────────────────────
  if (topic === 'hospital/sensors/temperature') {
    const value = typeof data === 'object' ? data.value : data;
    await updateAndBroadcast(patientId, { temperature: value });
    return;
  }

  // ── Topic : hospital/sensors/heart_rate ──────────────────────────
  if (topic === 'hospital/sensors/heart_rate') {
    const value = typeof data === 'object' ? data.value : data;
    await updateAndBroadcast(patientId, { frequence_cardiaque: parseInt(value, 10) });
    return;
  }

  // ── Topic : hospital/sensors/spo2 ────────────────────────────────
  if (topic === 'hospital/sensors/spo2') {
    const value = typeof data === 'object' ? data.value : data;
    await updateAndBroadcast(patientId, { spo2: parseInt(value, 10) });
    return;
  }

  // ── Topic : hospital/sensors/blood_pressure ──────────────────────
  if (topic === 'hospital/sensors/blood_pressure') {
    const systolique   = typeof data === 'object' ? (data.systolique   || data.value_sys) : null;
    const diastolique  = typeof data === 'object' ? (data.diastolique  || data.value_dia) : null;
    await updateAndBroadcast(patientId, {
      tension_systolique:  systolique  ? parseInt(systolique, 10)  : undefined,
      tension_diastolique: diastolique ? parseInt(diastolique, 10) : undefined,
    });
    return;
  }

  console.warn(`⚠️  [MQTT] Topic inconnu : "${topic}"`);
};

/**
 * Démarrer le client MQTT et se connecter à shiftr.io
 */
const start = () => {
  const host     = process.env.MQTT_HOST     || 'broker.shiftr.io';
  const username = process.env.MQTT_USERNAME || 'VOTRE_USERNAME';
  const password = process.env.MQTT_PASSWORD || 'VOTRE_PASSWORD';
  const clientId = process.env.MQTT_CLIENT_ID || `caretrack_server_${Date.now()}`;

  // URL de connexion shiftr.io : mqtt://username:password@broker.shiftr.io
  const brokerUrl = `mqtt://${host}`;

  console.log(`\n📡 [MQTT] Connexion à ${brokerUrl} en tant que "${username}"...`);

  mqttClient = mqtt.connect(brokerUrl, {
    clientId,
    username,
    password,
    clean: true,
    reconnectPeriod: 5000,   // Reconnexion automatique toutes les 5s
    connectTimeout: 10000,
  });

  // ── Événements du client MQTT ─────────────────────────────────────

  mqttClient.on('connect', () => {
    console.log('✅ [MQTT] Connecté à shiftr.io !');

    const topics = [
      'hospital/sensors/vitals',
      'hospital/sensors/temperature',
      'hospital/sensors/heart_rate',
      'hospital/sensors/spo2',
      'hospital/sensors/blood_pressure',
    ];

    mqttClient.subscribe(topics, { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ [MQTT] Erreur de souscription:', err.message);
      } else {
        console.log('📋 [MQTT] Topics souscrits :');
        topics.forEach((t) => console.log(`   • ${t}`));
      }
    });
  });

  mqttClient.on('message', handleMessage);

  mqttClient.on('reconnect', () => {
    console.log('🔄 [MQTT] Tentative de reconnexion...');
  });

  mqttClient.on('offline', () => {
    console.warn('⚠️  [MQTT] Client hors ligne');
  });

  mqttClient.on('error', (err) => {
    console.error('❌ [MQTT] Erreur:', err.message);
  });

  return mqttClient;
};

/**
 * Arrêter proprement le client MQTT
 */
const stop = () => {
  if (mqttClient) {
    mqttClient.end(true);
    console.log('🛑 [MQTT] Client déconnecté');
  }
};

/**
 * Obtenir les dernières valeurs d'un patient depuis le cache mémoire
 */
const getLatest = (patientId) => latestByPatient[patientId] || null;

/**
 * Obtenir toutes les dernières valeurs (tous patients)
 */
const getAllLatest = () => latestByPatient;

module.exports = { start, stop, setIO, getLatest, getAllLatest };
