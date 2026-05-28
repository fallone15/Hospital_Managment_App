# 🏥 CareTrack — Portail Web Patient

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe&logoColor=white"/>
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat-square&logo=socket.io&logoColor=white"/>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/>
</p>

> Module principal du système CareTrack — Interface web complète permettant aux patients de gérer leurs rendez-vous, accéder à leur dossier médical et effectuer des paiements en ligne.

---

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Structure du Projet](#-structure-du-projet)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration `.env`](#-configuration-env)
- [Lancement](#-lancement)
- [Pages Disponibles](#-pages-disponibles)
- [API REST](#-api-rest)
- [Sécurité](#-sécurité)

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 📝 **Inscription** | Enregistrement patient avec vérification email par token |
| 🔐 **Connexion** | Authentification email + code PIN 4 chiffres (hashé bcrypt) |
| 📅 **Rendez-vous** | Prise de RDV en ligne avec créneaux disponibles en temps réel |
| 💳 **Paiement Stripe** | Paiement sécurisé en ligne via PaymentIntent + Webhook |
| 📂 **Dossier Médical** | Accès à l'historique complet des consultations et ordonnances |
| 📄 **Ordonnances PDF** | Visualisation et téléchargement des ordonnances |
| 👨‍👩‍👧 **Famille** | Gestion des membres de la famille sur un même compte |
| 🔔 **Notifications** | Alertes en temps réel via WebSocket (Socket.io) |
| 🔑 **Reset PIN** | Réinitialisation du code PIN par email |

---

## 📁 Structure du Projet

```
sys_hospital_website/
│
├── Front_end/                             # Interface utilisateur
│   ├── index.html                        # Page d'accueil du portail
│   ├── login.html / login.js             # Connexion patient
│   ├── register.html / register.js       # Inscription patient
│   ├── verify-email.html                 # Validation du compte par email
│   ├── forgot-pin.html / forgot-pin.js   # Mot de passe oublié
│   ├── reset-pin.html / reset-pin.js     # Réinitialisation PIN
│   ├── dashboard.html                    # Tableau de bord patient
│   ├── book-appointment.html             # Sélection du médecin et du créneau
│   ├── appointment-booking-with-payment.html  # RDV + paiement Stripe
│   ├── payment-checkout.html             # Page de finalisation paiement
│   ├── dossier-medical.html              # Dossier médical électronique
│   ├── consultation.html                 # Détails d'une consultation
│   ├── mes-consultations.html            # Historique des consultations
│   ├── mes-paiements.html                # Historique des paiements
│   ├── ordonnance.html                   # Visualisation ordonnance PDF
│   ├── sensors-dashboard.html            # Données IoT (constantes vitales)
│   ├── script.js                         # Scripts communs
│   └── style.css                         # Styles globaux
│
└── Back_end/                              # API et serveur principal (Port 5000)
    ├── server.js                         # Point d'entrée Express + Socket.io
    ├── routes/
    │   ├── auth.js                       # Inscription, connexion, email
    │   ├── rendezvous.js                 # Médecins, créneaux, réservations
    │   ├── consultations.js              # Consultations et file d'attente
    │   ├── paiements.js                  # Stripe PaymentIntent + Webhook
    │   ├── dossiers.js                   # Dossier médical électronique
    │   └── family.js                     # Gestion membres famille
    ├── models/
    │   ├── Patient.js
    │   ├── Medecin.js
    │   ├── RendezVous.js
    │   └── DossierMedical.js
    ├── middleware/                        # JWT, CORS, validation
    ├── config/                            # Connexion PostgreSQL
    ├── services/                          # Nodemailer, Stripe helpers
    ├── migrations/                        # Scripts SQL
    ├── .env.example                       # Template de configuration
    └── package.json
```

---

## ✅ Prérequis

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v15+
- Compte [Stripe](https://stripe.com/) (mode test pour le développement)
- Compte Gmail avec mot de passe d'application (pour l'envoi d'emails)
- Extension navigateur [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) (ou équivalent) pour le frontend

---

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/fallone15/Hospital_Managment_App.git
cd Hospital_Managment_App

# 2. Installer les dépendances du backend
cd Back_end
npm install

# 3. Copier le fichier d'environnement
cp .env.example .env
# Puis éditer .env avec vos valeurs
```

---

## ⚙️ Configuration `.env`

```env
# ── Base de données ────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_USER=hospital_owner
DB_PASSWORD=your_password
DB_NAME=hospital_db

# ── Serveur ────────────────────────────────────
port=5000
NODE_ENV=development

# ── JWT ────────────────────────────────────────
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=6h

# ── Stripe ─────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Email ──────────────────────────────────────
EMAIL_SERVICE=gmail
EMAIL_USER=votre@gmail.com
EMAIL_PASSWORD=your_app_password

# ── URLs ───────────────────────────────────────
FRONTEND_URL=http://127.0.0.1:5502
```

> ⚠️ Ne jamais committer le fichier `.env` — il est listé dans `.gitignore`.

---

## ▶️ Lancement

### Backend (API — Port 5000)

```bash
cd Back_end
node server.js
```

### Frontend (Interface Patient — Port 5502)

Ouvrir `Front_end/index.html` avec **Live Server** sur VS Code, ou tout équivalent.
L'interface sera accessible sur : `http://127.0.0.1:5502`

---

## 🌐 Pages Disponibles

| Page | Fichier | Description |
|---|---|---|
| Accueil | `index.html` | Page principale du portail |
| Connexion | `login.html` | Authentification patient |
| Inscription | `register.html` | Création de compte |
| Tableau de bord | `dashboard.html` | Résumé patient connecté |
| Prendre RDV | `book-appointment.html` | Sélection médecin et créneau |
| Payer un RDV | `appointment-booking-with-payment.html` | RDV + paiement Stripe |
| Dossier médical | `dossier-medical.html` | Historique complet |
| Constantes IoT | `sensors-dashboard.html` | Données biométriques en temps réel |

---

## 🔌 API REST

Le backend tourne sur **`http://localhost:5000`**

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register/patient` | ❌ | Inscription + envoi email |
| `GET` | `/api/auth/verify-email?token=` | ❌ | Validation compte |
| `POST` | `/api/auth/login/patient` | ❌ | Connexion → JWT |
| `POST` | `/api/auth/forgot-pin` | ❌ | Email reset PIN |
| `GET` | `/api/auth/profile` | ✅ JWT | Profil connecté |
| `GET` | `/api/rendezvous/medecins` | ✅ JWT | Liste médecins actifs |
| `GET` | `/api/rendezvous/disponibilites/:id/:date` | ✅ JWT | Créneaux disponibles |
| `POST` | `/api/rdv` | ✅ JWT | Créer un rendez-vous |
| `GET` | `/api/rdv/patient` | ✅ JWT | Mes rendez-vous |
| `GET` | `/api/dossiers/patient/:id` | ✅ JWT | Dossier médical |
| `POST` | `/api/paiements` | ✅ JWT | Créer PaymentIntent Stripe |
| `POST` | `/api/webhook` | ❌ (signature) | Confirmation paiement Stripe |
| `GET` | `/health` | ❌ | Santé du serveur |

> 📬 Une collection Postman est disponible : [`Fakhsash-API.postman_collection.json`](Back_end/Fakhsash-API.postman_collection.json)

---

## 🔒 Sécurité

- **PIN hashé** avec `bcryptjs` (salage automatique, irréversible)
- **JWT** — tokens sans état, expiration configurable (défaut : 6h)
- **3 tentatives max** de saisie PIN par session
- **Validation des entrées** via `express-validator` sur chaque endpoint
- **Vérification email** obligatoire avant activation du compte
- **Webhook Stripe** sécurisé par vérification de signature cryptographique
- **CORS** restreint à l'origine `FRONTEND_URL` définie dans `.env`
