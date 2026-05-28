
<p align="center">
  <img src="Front_end/caretrack-logo.png" alt="CareTrack Logo" width="200"/>
</p>

<h1 align="center">CareTrack — Système Automatisé et Intelligent d'Accueil et Suivi des Patients</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white"/>
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe&logoColor=white"/>
  <img src="https://img.shields.io/badge/ESP32-IoT-E7352C?style=for-the-badge&logo=espressif&logoColor=white"/>
</p>

<p align="center">
  Plateforme de gestion hospitalière full-stack intégrant un sous-système IoT pour la collecte des constantes vitales, une borne kiosque d'accueil, un tableau de bord médecin et un portail patient.
</p>

---

## 📋 Table des Matières

- [Aperçu du Projet](#-aperçu-du-projet)
- [Architecture](#-architecture)
- [Stack Technologique](#-stack-technologique)
- [Modules](#-modules)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [API REST](#-api-rest)
- [Sous-système IoT](#-sous-système-iot)
- [Sécurité](#-sécurité)
- [Équipe](#-équipe)

---

## 🏥 Aperçu du Projet

**CareTrack** est une plateforme intégrée de gestion hospitalière qui couvre l'ensemble du parcours patient :

| Fonctionnalité | Description |
|---|---|
| 🖥️ **Portail Patient** | Inscription, prise de RDV en ligne, paiement Stripe, dossier médical |
| 🏪 **Borne Kiosque** | Accueil automatisé via carte à puce ACOS3, assistant vocal multilingue |
| 👨‍⚕️ **Dashboard Médecin** | Gestion file d'attente, consultation, ordonnances PDF |
| 🛠️ **Portail Admin** | Configuration médecins, plannings, paiements physiques, programmation cartes |
| 🌡️ **IoT ESP32** | Collecte des constantes vitales (SpO2, FC, température) au check-in |

---

## 🏗️ Architecture

```
CareTrack/
├── Front_end/              # Portail Web Patient      → Port 5502
├── Back_end/               # API principale           → Port 5000
│
├── Tablette/
│   ├── kiosk-frontend/     # Interface Borne Kiosque
│   └── kiosk-backend/      # API Borne + PC/SC ACOS3  → Port 3001
│
├── Admin/
│   ├── Front/              # Interface Administration
│   └── Back/               # API Administrative       → Port 3000
│
├── Medecin_dashboard/
│   ├── front_end/          # Interface Médecin
│   └── Back_end/           # API Prescriptions        → Port 8000
│
└── IoT/                    # Firmware ESP32 + Flask Gateway
```

### Ports des services

| Service | Port | Description |
|---|---|---|
| Backend Principal | `5000` | API REST principale |
| Frontend Patient | `5502` | Interface Web patient |
| Backend Médecin | `8000` | Gestion consultations & ordonnances |
| Backend Borne | `3001` | Auth ACOS3, check-in, file d'attente |
| WebSocket Borne | `3001/ws/card` | Lecture carte temps réel |
| Backend Admin | `3000` | Gestion administrative |
| PostgreSQL | `5432` | Base de données |

---

## 🛠️ Stack Technologique

### Backend
| Composant | Technologie |
|---|---|
| Serveur HTTP | Node.js + Express |
| Temps réel | Socket.io |
| Base de données | PostgreSQL |
| Authentification | JWT + bcryptjs |
| Paiement | Stripe API |
| Email | Nodemailer |
| Upload fichiers | Multer |
| Carte à puce | PC/SC (Gemalto) + ACOS3 |

### Frontend
- HTML5 + CSS3 + JavaScript vanilla
- Design responsive, compatible borne tactile et navigateur

### IoT
| Composant | Rôle |
|---|---|
| ESP32 | Microcontrôleur principal |
| MAX30105 | Capteur SpO2 & fréquence cardiaque (PPG) |
| MLX90614 | Capteur de température infrarouge sans contact |
| Flask | Passerelle IoT → Backend |

---

## 📦 Modules

### 1. Portail Patient (`Front_end/` + `Back_end/`)
- Inscription avec vérification email
- Connexion sécurisée (email + code PIN hashé bcrypt)
- Prise de rendez-vous avec créneaux disponibles en temps réel
- Paiement en ligne via Stripe (PaymentIntent + Webhook)
- Accès au dossier médical électronique et ordonnances PDF

### 2. Borne Kiosque (`Tablette/`)
- Identification par carte ACOS3 via lecteur PC/SC Gemalto
- Authentification PIN (3 tentatives max)
- Assistant vocal multilingue (🇫🇷 🇬🇧 🇸🇦 🇲🇦)
- Génération de ticket de file d'attente
- Acquisition des constantes vitales (IoT)

### 3. Dashboard Médecin (`Medecin_dashboard/`)
- Visualisation de la file d'attente en temps réel
- Saisie du diagnostic et des constantes vitales
- Génération d'ordonnances au format PDF (PDFKit)
- Accès au dossier médical complet du patient

### 4. Portail Admin (`Admin/`)
- Gestion des médecins et de leurs plannings
- Gestion des paiements physiques à la caisse
- Programmation des cartes ACOS3 patients et médecins
- Affichage dynamique de l'écran d'appel (numéro + cabinet + alerte sonore)

---

## ✅ Prérequis

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v15+
- [Python](https://www.python.org/) 3.9+ (pour l'IoT et la gestion PC/SC)
- [npm](https://www.npmjs.com/) v9+
- Lecteur de carte Gemalto PC/SC (pour la borne kiosque)
- Compte [Stripe](https://stripe.com/) (mode test suffisant pour le développement)

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/fallone15/Hospital_Managment_App.git
cd Hospital_Managment_App
```

### 2. Installer les dépendances de chaque module

```bash
# Backend principal
cd Back_end && npm install

# Backend Borne Kiosque
cd ../Tablette/kiosk-backend && npm install

# Backend Administration
cd ../../Admin/Back && npm install

# Backend Médecin
cd ../../Medecin_dashboard/Back_end && npm install
```

### 3. Initialiser la base de données

```bash
cd Admin/Back
node db_init.js
```

---

## ⚙️ Configuration

Chaque module possède son propre fichier `.env`. Copier l'exemple et remplir les valeurs :

```bash
cp Back_end/.env.example Back_end/.env
```

Variables principales à configurer :

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USER=hospital_owner
DB_PASSWORD=your_password
DB_NAME=hospital_db

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=6h

# Stripe (clés de test disponibles sur dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=votre@email.com
EMAIL_PASSWORD=your_app_password

# URLs
FRONTEND_URL=http://127.0.0.1:5502
```

> ⚠️ Ne jamais committer les fichiers `.env` — ils sont dans le `.gitignore`.

---

## ▶️ Lancement

Ouvrir un terminal par service :

```bash
# Terminal 1 — Backend Principal
cd Back_end && node server.js

# Terminal 2 — Backend Borne Kiosque
cd Tablette/kiosk-backend && node server.js

# Terminal 3 — Backend Administration
cd Admin/Back && node server.js

# Terminal 4 — Backend Médecin
cd Medecin_dashboard/Back_end && node server.js
```

Ouvrir les interfaces dans le navigateur :
- **Patient** : `http://127.0.0.1:5502`
- **Admin** : ouvrir `Admin/Front/index.html`
- **Médecin** : ouvrir `Medecin_dashboard/front_end/index.html`
- **Borne** : ouvrir `Tablette/kiosk-frontend/index.html`

---

## 🔌 API REST

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register/patient` | Inscription patient |
| `POST` | `/api/auth/login/patient` | Connexion patient (JWT) |
| `POST` | `/api/auth/login/medecin` | Connexion médecin (JWT) |
| `GET` | `/api/auth/profile` | Profil utilisateur |
| `GET` | `/api/rendezvous/medecins` | Liste médecins disponibles |
| `POST` | `/api/rdv` | Créer un rendez-vous |
| `GET` | `/api/rdv/patient` | Mes rendez-vous |
| `GET` | `/api/consultations` | File d'attente du jour |
| `POST` | `/api/consultations` | Enregistrer une consultation |
| `GET` | `/api/dossiers/patient/:id` | Dossier médical patient |
| `POST` | `/api/paiements` | Créer un PaymentIntent Stripe |
| `POST` | `/api/ordonnances` | Créer une ordonnance |
| `GET` | `/health` | Santé du serveur |

---

## 🌡️ Sous-système IoT

### Matériel
- **ESP32** — Microcontrôleur avec Wi-Fi intégré
- **MAX30105** — Capteur de pouls et SpO2 (communication I2C, photopléthysmographie PPG)
- **MLX90614** — Capteur de température infrarouge sans contact (I2C)

### Filtres de sécurité sur l'ESP32
- **Détection de présence** : signal infrarouge ≥ 50 000 (irMoy)
- **Filtre physiologique** : 40 ≤ BPM ≤ 120

### Flux de données
```
ESP32 → Flask Gateway → API Backend (port 5000) → PostgreSQL
```

---

## 🔒 Sécurité

- **Hashage PIN** : bcryptjs avec salage
- **Authentification** : JWT sans état (stateless), expiration 6h
- **Limite de tentatives** : 3 essais PIN max par session
- **Validation** : express-validator sur tous les endpoints
- **Vérification email** : token temporaire avant activation du compte
- **Stripe Webhook** : vérification de signature cryptographique
- **CORS** : restriction d'origine configurée par environnement
- **RGPD** : gestion des consentements et droits d'accès/suppression

---

## 👥 Équipe

| Nom | Rôle |
|---|---|
| BAAZIZ Sanae | Développement full-stack |
| DAS Shawrov | Développement full-stack |
| MOSSAMIH Khadija | Développement full-stack |
| NACOULMA Baowendmanegda Doris Fallone | Développement full-stack |

**Encadrants** : Pr. CHAMI Mouhcine · Pr. EL HADBI Assia · Pr. KHALLAAYOUNE Jamal

**Institut** : INPT — Institut National des Postes et Télécommunications · Année 2025–2026

---

<p align="center">Fait avec ❤️ à l'INPT · CareTrack © 2025–2026</p>
