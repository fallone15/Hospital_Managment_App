require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Vérification de la configuration PostgreSQL...\n');

// Configuration depuis .env
const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

console.log('📋 Configuration détectée:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   User: ${config.user}`);
console.log(`   Database: ${config.database}\n`);

// Test de connexion
const pool = new Pool(config);

pool.query('SELECT NOW() as current_time, version() as pg_version', (err, res) => {
    if (err) {
        console.log('❌ ERREUR DE CONNEXION:');
        console.log(`   ${err.message}\n`);

        if (err.code === 'ECONNREFUSED') {
            console.log('💡 Solution: PostgreSQL n\'est pas démarré ou n\'écoute pas sur le port 5432');
        } else if (err.code === '28P01') {
            console.log('💡 Solution: Mot de passe incorrect pour l\'utilisateur ' + config.user);
        } else if (err.code === '3D000') {
            console.log('💡 Solution: La base de données "' + config.database + '" n\'existe pas');
            console.log('   Créez-la avec: CREATE DATABASE ' + config.database + ';');
        } else if (err.code === '28000') {
            console.log('💡 Solution: L\'utilisateur "' + config.user + '" n\'existe pas');
            console.log('   Créez-le avec: CREATE USER ' + config.user + ' WITH PASSWORD \'' + config.password + '\';');
        }
    } else {
        console.log('✅ CONNEXION RÉUSSIE!\n');
        console.log('📅 Date serveur:', res.rows[0].current_time);
        console.log('🐘 Version PostgreSQL:', res.rows[0].pg_version.split(',')[0]);
        console.log('\n🎉 Votre configuration est correcte!');
    }

    pool.end();
    process.exit(err ? 1 : 0);
});
