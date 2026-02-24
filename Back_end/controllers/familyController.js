const { query } = require('../config/database');

// Ajouter un membre familial (mineur)
exports.addFamilyMember = async (req, res) => {
  try {
    const id_titulaire = req.user.id; // supposé injecté par le middleware d'auth
    const { nom, prenom, date_naissance, sexe, lien, allergies, groupe_sanguin } = req.body;

    // Calculer l'âge
    const today = new Date();
    const birthDate = new Date(date_naissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age >= 16) {
      return res.status(400).json({ success: false, message: 'Seuls les membres de moins de 16 ans peuvent être ajoutés.' });
    }

    // Récupérer le nom complet du titulaire
    const titulaireRes = await query('SELECT nom, prenom FROM patients WHERE id_patient = $1', [id_titulaire]);
    if (titulaireRes.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Titulaire introuvable.' });
    }
    const nomTuteur = `${titulaireRes.rows[0].nom} ${titulaireRes.rows[0].prenom}`;

    // Créer le patient enfant (sans email, sans CIN, sans code_pin)
    const carte_rfid = 'ENF' + Math.floor(100000 + Math.random() * 900000);
    const patientRes = await query(
      `INSERT INTO patients (carte_rfid, nom, prenom, date_naissance, sexe, adresse, code_postal, ville, email, telephone, cin, tuteur, numero_secu, mutuelle, groupe_sanguin, allergies, code_pin, email_verified, actif)
       VALUES ($1, $2, $3, $4, $5, NULL, NULL, NULL, NULL, NULL, NULL, $6, NULL, NULL, $7, NULL, TRUE, TRUE)
       RETURNING id_patient, carte_rfid, nom, prenom, date_naissance, sexe, tuteur, groupe_sanguin, allergies`,
      [carte_rfid, nom, prenom, date_naissance, sexe, nomTuteur, groupe_sanguin, allergies || []]
    );
    const enfant = patientRes.rows[0];

    // Lier dans family_members
    const result = await query(
      `INSERT INTO family_members (id_titulaire, nom, prenom, date_naissance, sexe, lien, allergies, groupe_sanguin)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id_titulaire, nom, prenom, date_naissance, sexe, lien, allergies || [], groupe_sanguin]
    );
    res.status(201).json({ success: true, member: result.rows[0], patient: enfant });
  } catch (error) {
    console.error('Erreur ajout membre familial:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Lister les membres familiaux du titulaire
exports.getFamilyMembers = async (req, res) => {
  try {
    const id_titulaire = req.user.id;
    const result = await query(
      'SELECT * FROM family_members WHERE id_titulaire = $1 AND actif = TRUE ORDER BY date_ajout DESC',
      [id_titulaire]
    );
    res.json({ success: true, members: result.rows });
  } catch (error) {
    console.error('Erreur liste membres familiaux:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Supprimer un membre familial
exports.deleteFamilyMember = async (req, res) => {
  try {
    const id_titulaire = req.user.id;
    const { id_member } = req.params;
    await query(
      'UPDATE family_members SET actif = FALSE WHERE id_member = $1 AND id_titulaire = $2',
      [id_member, id_titulaire]
    );
    res.json({ success: true, message: 'Membre supprimé' });
  } catch (error) {
    console.error('Erreur suppression membre familial:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
