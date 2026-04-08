const { pool } = require('./config/database');

async function fixConstraint() {
  const client = await pool.connect();
  try {
    // Drop the exiting check constraint
    await client.query(`ALTER TABLE rendez_vous DROP CONSTRAINT IF EXISTS rendez_vous_statut_check`);
    
    // Add the new constraint allowing 'en_attente_paiement'
    await client.query(`
      ALTER TABLE rendez_vous 
      ADD CONSTRAINT rendez_vous_statut_check 
      CHECK (statut IN ('en_attente', 'en_attente_paiement', 'confirme', 'annule', 'termine'))
    `);
    
    console.log('✅ Constraint updated successfully.');
  } catch (err) {
    console.error('❌ Error updating constraint:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixConstraint();
