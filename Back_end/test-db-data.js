const { pool } = require('./config/database');

async function checkData() {
  const client = await pool.connect();
  try {
    console.log('--- SERVICES ---');
    const services = await client.query('SELECT * FROM services');
    console.table(services.rows);

    console.log('\n--- MEDECINS ---');
    const medecins = await client.query('SELECT id_medecin, nom, prenom, specialite, actif, id_service FROM medecins');
    console.table(medecins.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkData();
