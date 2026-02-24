const { pool } = require('./database');

const createTables = async () => {
      // Table membres familiaux (enfants mineurs rattachés à un patient titulaire)
      await client.query(`
        CREATE TABLE IF NOT EXISTS family_members (
          id_member SERIAL PRIMARY KEY,
          id_titulaire INTEGER NOT NULL REFERENCES patients(id_patient) ON DELETE CASCADE,
          nom VARCHAR(100) NOT NULL,
          prenom VARCHAR(100) NOT NULL,
          date_naissance DATE NOT NULL,
          sexe VARCHAR(10) CHECK (sexe IN ('homme', 'femme', 'autre')),
          lien VARCHAR(50), -- ex: fils, fille, frère, soeur, etc.
          allergies TEXT[],
          groupe_sanguin VARCHAR(5),
          actif BOOLEAN DEFAULT TRUE,
          date_ajout TIMESTAMP DEFAULT NOW()
        );
      `);
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Table pour les inscriptions en attente de vérification email
    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_registrations (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        verification_token VARCHAR(255) NOT NULL,
        verification_token_expires TIMESTAMP NOT NULL,
        registration_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Table patients
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id_patient SERIAL PRIMARY KEY,
        carte_rfid VARCHAR(20) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        date_naissance DATE NOT NULL,
        sexe VARCHAR(10) CHECK (sexe IN ('homme', 'femme', 'autre')),
        adresse TEXT,
        code_postal VARCHAR(10),
        ville VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        telephone VARCHAR(20),
        cin VARCHAR(20) UNIQUE,
        tuteur VARCHAR(100),
        numero_secu VARCHAR(25),
        mutuelle VARCHAR(100),
        groupe_sanguin VARCHAR(5),
        allergies TEXT[],
        code_pin VARCHAR(255) NOT NULL,
        medecin_traitant VARCHAR(100),
        date_inscription TIMESTAMP DEFAULT NOW(),
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_token_expires TIMESTAMP,
        actif BOOLEAN DEFAULT TRUE
      );
    `);


    // Table services
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id_service SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        description TEXT,
        tarif DECIMAL(6,2) NOT NULL,
        duree_moyenne INT NOT NULL,
        actif BOOLEAN DEFAULT TRUE
      );
    `);

    // Table médecins
    await client.query(`
      CREATE TABLE IF NOT EXISTS medecins (
        id_medecin SERIAL PRIMARY KEY,
        carte_rfid VARCHAR(20) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        specialite VARCHAR(100),
        id_service INT REFERENCES services(id_service),
        telephone VARCHAR(15),
        sexe VARCHAR(10) CHECK (sexe IN ('homme', 'femme', 'autre')),
        email VARCHAR(100),
        code_pin VARCHAR(255),
        disponible BOOLEAN DEFAULT TRUE,
        date_embauche DATE,
        actif BOOLEAN DEFAULT TRUE
      );
    `);

    // Table salles
    await client.query(`
      CREATE TABLE IF NOT EXISTS salles (
        id_salle SERIAL PRIMARY KEY,
        numero_salle VARCHAR(10) NOT NULL,
        batiment VARCHAR(10),
        etage INT,
        id_service INT REFERENCES services(id_service),
        occupee BOOLEAN DEFAULT FALSE,
        capacite INT DEFAULT 1,
        equipements TEXT[],
        derniere_utilisation TIMESTAMP,
        actif BOOLEAN DEFAULT TRUE
      );
    `);

    // Table consultations
    await client.query(`
      CREATE TABLE IF NOT EXISTS consultations (
        id_consultation SERIAL PRIMARY KEY,
        id_patient INT REFERENCES patients(id_patient) NOT NULL,
        id_service INT REFERENCES services(id_service) NOT NULL,
        id_medecin INT REFERENCES medecins(id_medecin),
        id_salle INT REFERENCES salles(id_salle),
        numero_file VARCHAR(10) UNIQUE NOT NULL,
        heure_arrivee TIMESTAMP DEFAULT NOW(),
        heure_estimee TIMESTAMP,
        heure_debut TIMESTAMP,
        heure_fin TIMESTAMP,
        statut VARCHAR(20) CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee')) DEFAULT 'en_attente',
        motif TEXT,
        observations TEXT,
        diagnostic TEXT,
        montant_paye DECIMAL(6,2),
        mode_paiement VARCHAR(20) CHECK (mode_paiement IN ('CB', 'especes', 'mutuelle', 'cheque'))
      );
    `);

    // Table résultats examens
    await client.query(`
      CREATE TABLE IF NOT EXISTS resultats_examens (
        id_resultat SERIAL PRIMARY KEY,
        id_consultation INT REFERENCES consultations(id_consultation) NOT NULL,
        id_patient INT REFERENCES patients(id_patient) NOT NULL,
        type_examen VARCHAR(100) NOT NULL,
        date_examen TIMESTAMP DEFAULT NOW(),
        compte_rendu TEXT,
        conclusion TEXT,
        medecin_responsable VARCHAR(100),
        fichiers_joints JSONB
      );
    `);

    // Table fichiers médicaux
    await client.query(`
      CREATE TABLE IF NOT EXISTS fichiers_medicaux (
        id_fichier SERIAL PRIMARY KEY,
        id_resultat INT REFERENCES resultats_examens(id_resultat),
        type_fichier VARCHAR(20) CHECK (type_fichier IN ('image', 'pdf', 'dicom', 'autre')),
        nom_fichier VARCHAR(255) NOT NULL,
        chemin_stockage TEXT NOT NULL,
        taille_ko INT,
        date_upload TIMESTAMP DEFAULT NOW()
      );
    `);

    // Table constantes vitales
    await client.query(`
      CREATE TABLE IF NOT EXISTS constantes_vitales (
        id_constante SERIAL PRIMARY KEY,
        id_patient INT REFERENCES patients(id_patient) NOT NULL,
        id_consultation INT REFERENCES consultations(id_consultation),
        temperature DECIMAL(4,2),
        frequence_cardiaque INT,
        spo2 INT,
        tension_systolique INT,
        tension_diastolique INT,
        timestamp TIMESTAMP DEFAULT NOW(),
        source VARCHAR(50) DEFAULT 'borne_accueil'
      );
    `);

    // Table ordonnances
    await client.query(`
      CREATE TABLE IF NOT EXISTS ordonnances (
        id_ordonnance SERIAL PRIMARY KEY,
        id_consultation INT REFERENCES consultations(id_consultation) NOT NULL,
        id_medecin INT REFERENCES medecins(id_medecin) NOT NULL,
        date_prescription TIMESTAMP DEFAULT NOW(),
        medicaments JSONB NOT NULL,
        posologie TEXT,
        duree_traitement INT,
        instructions TEXT,
        envoyee_electronique BOOLEAN DEFAULT FALSE
      );
    `);

    // Index pour performances
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_rfid ON patients(carte_rfid);
      CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
      CREATE INDEX IF NOT EXISTS idx_patients_cin ON patients(cin);
      CREATE INDEX IF NOT EXISTS idx_medecins_rfid ON medecins(carte_rfid);
      CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(id_patient);
      CREATE INDEX IF NOT EXISTS idx_consultations_statut ON consultations(statut);
      CREATE INDEX IF NOT EXISTS idx_constantes_patient ON constantes_vitales(id_patient);
      CREATE INDEX IF NOT EXISTS idx_constantes_timestamp ON constantes_vitales(timestamp);
    `);

    await client.query('COMMIT');
    console.log('✅ Tables créées avec succès');

    // Insérer des données de test
    await insertTestData(client);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Fonction pour insérer des données de test
const insertTestData = async (client) => {
  try {
    const bcrypt = require('bcryptjs');
    
    // Vérifier si des données existent déjà
    const { rows } = await client.query('SELECT COUNT(*) FROM services');
    if (parseInt(rows[0].count) > 0) {
      console.log('📊 Des données existent déjà');
      return;
    }

    // Insérer services
    await client.query(`
      INSERT INTO services (id_service, nom, description, tarif, duree_moyenne) VALUES
      (1, 'Médecine générale', 'Consultation médicale standard', 45.00, 30),
      (2, 'Radiologie', 'Examens radiologiques', 65.00, 20),
      (3, 'Échographie', 'Échographie médicale', 55.00, 25),
      (4, 'Analyses sanguines', 'Prélèvements et analyses', 30.00, 15),
      (5, 'Vaccination', 'Vaccinations diverses', 20.00, 10),
      (6, 'Dentiste', 'Soins dentaires', 50.00, 40)
    `);

    // Hash du PIN par défaut: 1234
    const hashedPin = await bcrypt.hash('1234', 10);

    // Insérer médecins
    await client.query(`
      INSERT INTO medecins (carte_rfid, nom, sexe, prenom, specialite, id_service, email, code_pin, disponible) VALUES
      ('MED001', 'LAURENT', 'femme', 'Sophie', 'Échographie', 3, 'sophie.laurent@hopital.fr', $1, TRUE),
      ('MED002', 'DUPONT', 'homme', 'Jean', 'Médecine générale', 1, 'jean.dupont@hopital.fr', $1, TRUE),
      ('MED003', 'MERCIER', 'femme', 'Marie', 'Radiologie', 2, 'marie.mercier@hopital.fr', $1, TRUE)
    `, [hashedPin]);

    // Insérer salles
    await client.query(`
      INSERT INTO salles (numero_salle, batiment, etage, id_service, occupee) VALUES
      ('101', 'A', 1, 1, FALSE),
      ('102', 'A', 1, 1, FALSE),
      ('203', 'B', 2, 3, FALSE),
      ('204', 'B', 2, 3, FALSE),
      ('301', 'C', 3, 2, FALSE)
    `);

    // Insérer patients de test
    await client.query(`
      INSERT INTO patients (carte_rfid, nom, prenom, date_naissance, sexe, adresse, code_postal, ville, email, telephone, cin, numero_secu, mutuelle, groupe_sanguin, allergies, code_pin) VALUES
      ('PAT001', 'MARTIN', 'Marie', '1985-03-15', 'femme', '15 Rue de la Paix', '75001', 'Paris', 'm.martin@email.fr', '+33612345678', 'AB123456', '2 85 03 75 123 456 78', 'MGEN', 'A+', ARRAY['Pénicilline'], $1),
      ('PAT002', 'DUBOIS', 'Jean', '1978-07-22', 'homme', '8 Avenue Victor Hugo', '75016', 'Paris', 'j.dubois@email.fr', '+33698765432', 'CD789012', '1 78 07 75 987 654 32', 'Harmonie Mutuelle', 'O+', ARRAY[]::TEXT[], $1),
      ('PAT003', 'BERNARD', 'Sophie', '1992-11-08', 'femme', '22 Boulevard Saint-Germain', '75005', 'Paris', 's.bernard@email.fr', '+33656781234', 'EF345678', '2 92 11 75 567 890 12', 'MAAF', 'B+', ARRAY[]::TEXT[], $1)
    `, [hashedPin]);

    console.log('✅ Données de test insérées avec succès');
    console.log('📌 Comptes de test (PIN: 1234):');
    console.log('   Patients: PAT001, PAT002, PAT003');
    console.log('   Médecins: MED001, MED002, MED003');
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error);
  }
};

// Exécuter le script
createTables()
  .then(() => {
    console.log('🎉 Base de données initialisée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Échec de l\'initialisation:', error);
    process.exit(1);
  });
