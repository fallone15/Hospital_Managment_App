const { pool } = require('./config/database');

// Fonction helper pour générer les créneaux horaires (corrigée)
const generateCreneaux = (debut, fin, rdvPris, duration = 30) => {
  const creneaux = [];
  const [hDebut, mDebut] = debut.split(':').map(Number);
  let [hFin, mFin] = fin.split(':').map(Number);

  // Gérer les créneaux qui traversent minuit (hFin = 0 = 24:00)
  if (hFin === 0 && mFin === 0) {
    hFin = 24;
  }

  let h = hDebut;
  let m = mDebut;

  while (h < hFin || (h === hFin && m < mFin)) {
    const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (!rdvPris.includes(slot)) {
      creneaux.push(slot);
    }
    m += duration;
    if (m >= 60) { 
      h += Math.floor(m / 60); 
      m = m % 60; 
    }
  }
  return creneaux;
};

(async () => {
  try {
    // Récupérer les créneaux pour le 18 mai
    const medecinId = 3;
    const date = '2026-05-18';
    const [y, m, d] = date.split('-').map(Number);
    const jour_semaine = new Date(y, m - 1, d).getDay(); // 1 = lundi

    console.log(`📅 Vérification pour ${date} (jour ${jour_semaine} = lundi)`);

    const dispoResult = await pool.query(
      `SELECT d.heure_debut, d.heure_fin, s.duree_moyenne 
       FROM disponibilites d
       JOIN medecins m ON d.medecin_id = m.id_medecin
       JOIN services s ON m.id_service = s.id_service
       WHERE d.medecin_id = $1 AND d.jour_semaine = $2`,
      [medecinId, jour_semaine]
    );

    if (dispoResult.rows.length === 0) {
      console.log('❌ Pas de disponibilités ce jour-là');
      process.exit(1);
    }

    const rdvResult = await pool.query(
      `SELECT heure_rdv 
       FROM rendez_vous 
       WHERE medecin_id = $1 AND date_rdv = $2 AND statut != 'annule'`,
      [medecinId, date]
    );

    const rdvPris = rdvResult.rows.map(r => r.heure_rdv.toString().substring(0, 5));
    console.log(`\n⏰ RDV déjà pris: ${rdvPris.join(', ') || 'aucun'}`);

    const { heure_debut, heure_fin, duree_moyenne } = dispoResult.rows[0];
    const duration = parseInt(duree_moyenne) || 30;
    
    console.log(`\n📋 Disponibilités: ${heure_debut} - ${heure_fin}`);
    console.log(`Durée moyenne: ${duration} min\n`);

    const creneaux = generateCreneaux(heure_debut, heure_fin, rdvPris, duration);
    
    console.log(`✅ Créneaux disponibles (${creneaux.length}):`);
    creneaux.forEach(c => console.log(`  - ${c}`));

  } catch(err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
