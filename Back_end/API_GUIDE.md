# 🏥 API Fakhsash - Guide Complet

## 📋 Architecture de la Base de Données

Le système utilise PostgreSQL avec les tables suivantes :
- **patients** : Informations des patients avec carte RFID
- **medecins** : Informations des médecins
- **services** : Services médicaux disponibles (Médecine générale, Radiologie, etc.)
- **salles** : Salles de consultation
- **consultations** : Gestion de la file d'attente et consultations
- **resultats_examens** : Résultats des examens médicaux
- **fichiers_medicaux** : Fichiers attachés aux examens
- **constantes_vitales** : Données des capteurs (température, fréquence cardiaque, etc.)
- **ordonnances** : Prescriptions médicales

## 🚀 Installation Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer .env
cp .env.example .env
# Éditer .env avec vos paramètres PostgreSQL

# 3. Initialiser la base de données
npm run init-db

# 4. Démarrer le serveur
npm run dev
```

## 📡 API Endpoints

### 🔐 Authentification

#### Inscription Patient
```http
POST /api/auth/register/patient
Content-Type: application/json

{
  "nom": "MARTIN",
  "prenom": "Sophie",
  "date_naissance": "1990-05-15",
  "sexe": "femme",
  "adresse": "123 Rue de Paris",
  "code_postal": "75001",
  "ville": "Paris",
  "email": "sophie.martin@gmail.com",
  "telephone": "+33612345678",
  "numero_secu": "2 90 05 75 123 456 78",
  "mutuelle": "MGEN",
  "allergies": ["Pénicilline"],
  "groupe_sanguin": "A+",
  "code_pin": "1234"
}

Réponse:
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "patient": {
      "id": 1,
      "carte_rfid": "PAT1234",
      "nom": "MARTIN",
      "prenom": "Sophie",
      "email": "sophie.martin@gmail.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Connexion Patient
```http
POST /api/auth/login/patient
Content-Type: application/json

{
  "identifier": "sophie.martin@gmail.com",  // ou carte RFID
  "code_pin": "1234"
}
```

#### Connexion Médecin
```http
POST /api/auth/login/medecin
Content-Type: application/json

{
  "identifier": "sophie.laurent@hopital.fr",  // ou carte RFID
  "code_pin": "1234"
}
```

### 🏥 Consultations

#### Liste des Services
```http
GET /api/consultations/services
Authorization: Bearer <token>

Réponse:
{
  "success": true,
  "data": [
    {
      "id_service": 1,
      "nom": "Médecine générale",
      "description": "Consultation médicale standard",
      "tarif": "45.00",
      "duree_moyenne": 30,
      "actif": true
    },
    ...
  ]
}
```

#### Créer une Consultation (Patient)
```http
POST /api/consultations
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_service": 1,
  "motif": "Douleurs abdominales depuis 2 jours"
}

Réponse:
{
  "success": true,
  "message": "Consultation enregistrée avec succès",
  "data": {
    "consultation": {
      "id_consultation": 1,
      "numero_file": "S1-001",
      "statut": "en_attente",
      ...
    },
    "service": {
      "nom": "Médecine générale",
      "tarif": "45.00",
      "duree_moyenne": 30
    },
    "numero_file": "S1-001"
  }
}
```

#### File d'Attente d'un Service (Médecin)
```http
GET /api/consultations/file-attente/:id_service
GET /api/consultations/file-attente/1?date=2024-03-20
Authorization: Bearer <token>

Réponse:
{
  "success": true,
  "data": [
    {
      "id_consultation": 1,
      "numero_file": "S1-001",
      "patient_nom": "MARTIN",
      "patient_prenom": "Sophie",
      "carte_rfid": "PAT1234",
      "motif": "Douleurs abdominales",
      "statut": "en_attente",
      "heure_arrivee": "2024-03-20T09:15:00",
      ...
    }
  ]
}
```

#### Mes Consultations (Patient)
```http
GET /api/consultations/patient
GET /api/consultations/patient?statut=en_attente
Authorization: Bearer <token>
```

#### Consultations du Médecin
```http
GET /api/consultations/medecin
GET /api/consultations/medecin?date=2024-03-20&statut=en_cours
Authorization: Bearer <token>
```

#### Mettre à Jour une Consultation (Médecin)
```http
PUT /api/consultations/:id_consultation
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_salle": 3,
  "statut": "en_cours",
  "observations": "Patient présente des symptômes de gastro-entérite",
  "diagnostic": "Gastro-entérite aiguë",
  "montant_paye": 45.00,
  "mode_paiement": "CB"
}
```

#### Annuler une Consultation (Patient)
```http
DELETE /api/consultations/:id_consultation
Authorization: Bearer <token>
```

#### Salles Disponibles (Médecin)
```http
GET /api/consultations/salles
GET /api/consultations/salles?id_service=1
Authorization: Bearer <token>
```

### 📊 Statuts des Consultations

- `en_attente` : Patient en salle d'attente
- `en_cours` : Consultation en cours avec le médecin
- `terminee` : Consultation terminée
- `annulee` : Consultation annulée

## 🔑 Authentification

Toutes les routes protégées nécessitent un token JWT dans le header :
```
Authorization: Bearer <votre_token>
```

Le token est retourné lors de la connexion et doit être stocké côté client.

## 🎯 Comptes de Test

Après `npm run init-db`, vous avez accès à :

**Patients:**
- Email: `m.martin@email.fr` - Carte: `PAT001` - PIN: `1234`
- Email: `j.dubois@email.fr` - Carte: `PAT002` - PIN: `1234`
- Email: `s.bernard@email.fr` - Carte: `PAT003` - PIN: `1234`

**Médecins:**
- Email: `sophie.laurent@hopital.fr` - Carte: `MED001` - PIN: `1234` (Échographie)
- Email: `jean.dupont@hopital.fr` - Carte: `MED002` - PIN: `1234` (Médecine générale)
- Email: `marie.mercier@hopital.fr` - Carte: `MED003` - PIN: `1234` (Radiologie)

## 🧪 Exemples d'Utilisation

### Workflow Complet Patient

```javascript
// 1. Connexion
const loginResponse = await fetch('http://localhost:5000/api/auth/login/patient', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'm.martin@email.fr',
    code_pin: '1234'
  })
});
const { data } = await loginResponse.json();
const token = data.token;

// 2. Récupérer les services
const servicesResponse = await fetch('http://localhost:5000/api/consultations/services', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const services = await servicesResponse.json();

// 3. Créer une consultation
const consultationResponse = await fetch('http://localhost:5000/api/consultations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    id_service: 1,
    motif: 'Consultation de routine'
  })
});
const consultation = await consultationResponse.json();
console.log('Votre numéro de file:', consultation.data.numero_file);

// 4. Vérifier mes consultations
const mesConsultations = await fetch('http://localhost:5000/api/consultations/patient', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Workflow Complet Médecin

```javascript
// 1. Connexion
const loginResponse = await fetch('http://localhost:5000/api/auth/login/medecin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'jean.dupont@hopital.fr',
    code_pin: '1234'
  })
});
const { data } = await loginResponse.json();
const token = data.token;

// 2. Voir la file d'attente
const fileAttente = await fetch('http://localhost:5000/api/consultations/file-attente/1', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const patients = await fileAttente.json();

// 3. Prendre en charge un patient
const updateResponse = await fetch(`http://localhost:5000/api/consultations/${patients.data[0].id_consultation}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    id_salle: 101,
    statut: 'en_cours'
  })
});

// 4. Terminer la consultation
const finishResponse = await fetch(`http://localhost:5000/api/consultations/${patients.data[0].id_consultation}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    statut: 'terminee',
    diagnostic: 'Grippe saisonnière',
    observations: 'Repos recommandé',
    montant_paye: 45.00,
    mode_paiement: 'CB'
  })
});
```

## 📝 Notes

- Les numéros de file sont générés automatiquement : `S{service_id}-{numéro_séquentiel}`
- Les timestamps sont gérés automatiquement par PostgreSQL
- Les cartes RFID sont uniques par patient/médecin
- Le système supporte les allergies multiples (tableau)

## 🐛 Débogage

```bash
# Voir les logs
npm run dev

# Tester la connexion DB
psql -U postgres -d fakhsash_db

# Vérifier les tables
\dt

# Voir les données
SELECT * FROM patients;
SELECT * FROM consultations;
```

---
Pour plus d'informations, consultez QUICKSTART.md
