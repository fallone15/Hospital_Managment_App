const { query } = require('./config/database');

async function run() {
  try {
    console.log('--- Checking current constraints ---');
    const res = await query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'rendez_vous'::regclass 
      AND contype = 'c'
    `);
    console.log('Current constraints:', JSON.stringify(res.rows, null, 2));

    console.log('--- Dropping and recreating constraint ---');
    await query(`ALTER TABLE rendez_vous DROP CONSTRAINT IF EXISTS rendez_vous_statut_check`);
    await query(`
      ALTER TABLE rendez_vous 
      ADD CONSTRAINT rendez_vous_statut_check 
      CHECK (statut IN ('en_attente', 'en_attente_paiement', 'confirme', 'annule', 'termine'))
    `);
    
    // Also ensure the column is wide enough
    await query(`ALTER TABLE rendez_vous ALTER COLUMN statut TYPE VARCHAR(30)`);

    console.log('--- Final check ---');
    const finalRes = await query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'rendez_vous'::regclass 
      AND contype = 'c'
    `);
    console.log('Final constraints:', JSON.stringify(finalRes.rows, null, 2));
    
    console.log('✅ Database fix completed.');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    process.exit(0);
  }
}

run();
