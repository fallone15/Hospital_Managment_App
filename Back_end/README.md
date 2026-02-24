# 🏥 Fakhsash Backend - API Système Hospitalier

Backend Node.js + Express + PostgreSQL pour le système hospitalier Fakhsash.

## 📋 Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [API Endpoints](#api-endpoints)
- [Base de données](#base-de-données)
- [Sécurité](#sécurité)

## 🔧 Prérequis

- Node.js >= 16.x
- PostgreSQL >= 13.x
- npm ou yarn
- Compte Stripe (pour les paiements)

## 📦 Installation

1. Cloner le projet
```bash
git clone <url-du-repo>
cd fakhsash-backend
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Éditer le fichier `.env` avec vos informations :
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_NAME=fakhsash_db

PORT=5000
NODE_ENV=development

JWT_SECRET=votre_secret_jwt_changez_moi
JWT_EXPIRES_IN=86400

STRIPE_SECRET_KEY=sk_test_votre_cle
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle

FRONTEND_URL=http://localhost:3000
```

## 🗄️ Configuration de la base de données

1. Créer la base de données PostgreSQL
```bash
psql -U postgres
CREATE DATABASE fakhsash_db;
\q
```

2. Initialiser les tables
```bash
npm run init-db
```

Cela créera toutes les tables nécessaires et insérera des données de test :
- 5 médecins de test (PIN: 1234)
- Tables : patients, medecins, rendez_vous, dossiers_medicaux, consultations, paiements, etc.

## 🚀 Démarrage

### Mode développement (avec nodemon)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 📡 API Endpoints

### Authentification

#### Inscription patient
```http
POST /api/auth/register/patient
Content-Type: application/json

{
  "nom": "Doe",
  "prenom": "John",
  "date_naissance": "1990-01-15",
  "age": 34,
  "cin": "CNI12345678",
  "sexe": "homme",
  "adresse": "123 Rue Exemple, Rabat",
  "email": "john.doe@gmail.com",
  "telephone": "+212612345678",
  "code_pin": "1234"
}
```

#### Connexion patient
```http
POST /api/auth/login/patient
Content-Type: application/json

{
  "identifier": "john.doe@gmail.com",  // ou numéro de carte
  "code_pin": "1234"
}
```

#### Connexion médecin
```http
POST /api/auth/login/medecin
Content-Type: application/json

{
  "identifier": "dr.alami@fakhsash.ma",  // ou numéro médecin
  "code_pin": "1234"
}
```

#### Obtenir le profil
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Rendez-vous

#### Lister les médecins
```http
GET /api/rendezvous/medecins
GET /api/rendezvous/medecins?specialite=Cardiologie
Authorization: Bearer <token>
```

#### Disponibilités d'un médecin
```http
GET /api/rendezvous/medecins/:medecin_id/disponibilites
GET /api/rendezvous/medecins/:medecin_id/disponibilites?date=2024-03-20
Authorization: Bearer <token>
```

#### Créer un rendez-vous
```http
POST /api/rendezvous
Authorization: Bearer <token>
Content-Type: application/json

{
  "medecin_id": 1,
  "date_rdv": "2024-03-20",
  "heure_rdv": "14:00",
  "motif": "Consultation de routine pour contrôle annuel"
}
```

#### Mes rendez-vous (patient)
```http
GET /api/rendezvous/patient
GET /api/rendezvous/patient?statut=en_attente
Authorization: Bearer <token>
```

#### Rendez-vous du médecin
```http
GET /api/rendezvous/medecin
GET /api/rendezvous/medecin?date=2024-03-20&statut=confirme
Authorization: Bearer <token>
```

#### Annuler un rendez-vous
```http
DELETE /api/rendezvous/:id
Authorization: Bearer <token>
```

### Dossiers médicaux

#### Obtenir le dossier d'un patient
```http
GET /api/dossiers/patient/:patient_id
Authorization: Bearer <token>
```

#### Ajouter une entrée (médecin uniquement)
```http
POST /api/dossiers
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": 1,
  "date_consultation": "2024-03-20",
  "diagnostic": "Hypertension artérielle légère",
  "prescription": "Médicament XYZ, 1 comprimé matin et soir",
  "notes": "Contrôle dans 3 mois"
}
```

#### Consultations d'un patient
```http
GET /api/dossiers/consultations/:patient_id
Authorization: Bearer <token>
```

#### Ajouter une consultation
```http
POST /api/dossiers/consultations
Authorization: Bearer <token>
Content-Type: application/json

{
  "rendez_vous_id": 5,
  "patient_id": 1,
  "symptomes": "Fatigue, maux de tête",
  "diagnostic": "Tension élevée",
  "traitement": "Repos et médicaments",
  "examens_demandes": "Prise de sang",
  "notes": "Revoir dans 2 semaines"
}
```

### Paiements

#### Obtenir les tarifs
```http
GET /api/paiements/tarifs
```

#### Créer un paiement
```http
POST /api/paiements
Authorization: Bearer <token>
Content-Type: application/json

{
  "montant": 200,
  "methode_paiement": "stripe",
  "rendez_vous_id": 5,
  "description": "Consultation cardiologie"
}
```

#### Confirmer un paiement Stripe
```http
POST /api/paiements/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "payment_intent_id": "pi_xxxxx"
}
```

#### Historique des paiements
```http
GET /api/paiements/historique
Authorization: Bearer <token>
```

## 🔐 Sécurité

- Tous les mots de passe et codes PIN sont hashés avec bcrypt
- Authentification par JWT (JSON Web Tokens)
- Validation des données avec express-validator
- Protection CORS configurée
- Requêtes SQL paramétrées pour éviter les injections

## 📊 Structure de la base de données

### Tables principales :
- `patients` - Informations des patients
- `medecins` - Informations des médecins
- `rendez_vous` - Gestion des rendez-vous
- `dossiers_medicaux` - Historique médical
- `consultations` - Détails des consultations
- `paiements` - Transactions financières
- `disponibilites` - Planning des médecins
- `notifications` - Système de notifications

## 🧪 Tests

### Tester l'API avec curl

```bash
# Test de santé
curl http://localhost:5000/health

# Inscription
curl -X POST http://localhost:5000/api/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "User",
    "date_naissance": "1990-01-01",
    "age": 34,
    "cin": "TEST123",
    "sexe": "homme",
    "adresse": "Test Address",
    "email": "test@gmail.com",
    "telephone": "+212612345678",
    "code_pin": "1234"
  }'

# Connexion
curl -X POST http://localhost:5000/api/auth/login/patient \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@gmail.com",
    "code_pin": "1234"
  }'
```

## 🔄 Intégration Frontend

Dans votre frontend, utilisez fetch ou axios :

```javascript
// Exemple avec fetch
const API_URL = 'http://localhost:5000/api';

// Inscription
const register = async (data) => {
  const response = await fetch(`${API_URL}/auth/register/patient`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Connexion
const login = async (identifier, code_pin) => {
  const response = await fetch(`${API_URL}/auth/login/patient`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ identifier, code_pin })
  });
  const data = await response.json();
  
  // Stocker le token
  if (data.success) {
    localStorage.setItem('token', data.data.token);
  }
  
  return data;
};

// Requête authentifiée
const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/auth/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## 📝 Notes importantes

1. **Sécurité** : Changez toutes les valeurs par défaut dans le fichier `.env`
2. **Production** : Configurez PostgreSQL avec des credentials sécurisés
3. **Stripe** : Utilisez les clés de test pour le développement
4. **HTTPS** : En production, utilisez HTTPS avec un reverse proxy (nginx)

## 🆘 Support

Pour toute question ou problème, contactez l'équipe de développement.

## 📄 Licence

© 2026 Fakhsash Hospital. Tous droits réservés.
