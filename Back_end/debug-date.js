// Vérifier la date réelle du 18 mai 2026
const date = new Date('2026-05-18');
console.log('Date:', date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
console.log('Jour de semaine (0=dimanche):', date.getDay());

// Voir les jours de la semaine
const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
console.log('Jour:', days[date.getDay()]);

// Vérifier les disponibilités du docteur
const { pool } = require('./config/database');

(async () => {
  try {
    // Récupérer les dispo du docteur Mossamih
    const dispoResult = await pool.query(
      `SELECT jour_semaine, heure_debut, heure_fin FROM disponibilites 
       WHERE medecin_id = 3 ORDER BY jour_semaine`
    );
    
    console.log('\n📅 Disponibilités docteur Mossamih (ID 3):');
    dispoResult.rows.forEach(d => {
      console.log(`  Jour ${d.jour_semaine} (${days[d.jour_semaine]}): ${d.heure_debut} - ${d.heure_fin}`);
    });

    // Récupérer le tarif
    const serviceResult = await pool.query(
      `SELECT m.nom, m.prenom, s.nom as service, s.tarif 
       FROM medecins m 
       LEFT JOIN services s ON m.id_service = s.id_service
       WHERE m.id_medecin = 3`
    );
    
    console.log('\n💰 Tarif docteur Mossamih:');
    console.log(`  Service: ${serviceResult.rows[0].service}`);
    console.log(`  Tarif base: ${serviceResult.rows[0].tarif} MAD`);
    console.log(`  Tarif + frais (15 MAD): ${parseFloat(serviceResult.rows[0].tarif) + 15} MAD`);

  } catch(err) {
    console.error('Erreur:', err.message);
  } finally {
    process.exit(0);
  }
})();
