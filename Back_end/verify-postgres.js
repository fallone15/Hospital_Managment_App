const { Pool } = require('pg');

console.log('🔍 Test de connexion PostgreSQL...\n');

// Test 1: Avec l'utilisateur postgres par défaut
console.log('Test 1: Connexion avec utilisateur "postgres"');
const pool1 = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres', // Mot de passe par défaut courant
    database: 'postgres'
});

pool1.query('SELECT current_database(), current_user', (err, res) => {
    if (err) {
        console.log('❌ Échec:', err.message);
    } else {
        console.log('✅ Succès! Base:', res.rows[0].current_database, '| User:', res.rows[0].current_user);

        // Vérifier si hospital_db existe
        pool1.query("SELECT datname FROM pg_database WHERE datname = 'hospital_db'", (err2, res2) => {
            if (res2 && res2.rows.length > 0) {
                console.log('✅ La base "hospital_db" existe bien!\n');
            } else {
                console.log('❌ La base "hospital_db" n\'existe PAS\n');
            }

            // Vérifier si l'utilisateur hospital_admin existe
            pool1.query("SELECT usename FROM pg_user WHERE usename = 'hospital_admin'", (err3, res3) => {
                if (res3 && res3.rows.length > 0) {
                    console.log('✅ L\'utilisateur "hospital_admin" existe!\n');
                } else {
                    console.log('❌ L\'utilisateur "hospital_admin" n\'existe PAS');
                    console.log('💡 Créez-le avec cette commande SQL:');
                    console.log('   CREATE USER hospital_admin WITH PASSWORD \'namosash\';');
                    console.log('   ALTER USER hospital_admin CREATEDB;');
                    console.log('   GRANT ALL PRIVILEGES ON DATABASE hospital_db TO hospital_admin;\n');
                }
                pool1.end();

                // Test 2: Avec hospital_admin
                testHospitalAdmin();
            });
        });
    }
});

function testHospitalAdmin() {
    console.log('\nTest 2: Connexion avec utilisateur "hospital_admin"');
    const pool2 = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'hospital_admin',
        password: 'namosash',
        database: 'hospital_db'
    });

    pool2.query('SELECT current_database(), current_user', (err, res) => {
        if (err) {
            console.log('❌ Échec:', err.message);
            console.log('   Code erreur:', err.code);
        } else {
            console.log('✅ SUCCÈS! Votre configuration est CORRECTE!');
            console.log('   Base:', res.rows[0].current_database);
            console.log('   User:', res.rows[0].current_user);
        }
        pool2.end();
    });
}
