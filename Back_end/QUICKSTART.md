# 🏥 Fakhsash Backend - Guide de Démarrage Rapide

## 📁 Fichiers du Projet

Votre backend Fakhsash contient :

```
fakhsash-backend/
├── config/
│   ├── database.js           # Configuration PostgreSQL
│   └── initDatabase.js       # Script d'initialisation DB
├── controllers/
│   ├── authController.js     # Gestion authentification
│   ├── dossierController.js  # Gestion dossiers médicaux
│   ├── paiementController.js # Gestion paiements/Stripe
│   └── rdvController.js      # Gestion rendez-vous
├── middleware/
│   ├── auth.js              # Middleware JWT
│   └── validation.js        # Validation des données
├── routes/
│   ├── auth.js              # Routes authentification
│   ├── dossiers.js          # Routes dossiers
│   ├── paiements.js         # Routes paiements
│   └── rendezvous.js        # Routes rendez-vous
├── server.js                # Serveur principal
├── package.json             # Dépendances Node.js
├── .env.example             # Template variables d'environnement
├── start.sh                 # Script de démarrage automatique
├── README.md                # Documentation complète
├── DEPLOYMENT.md            # Guide de déploiement production
├── integration-frontend-example.js  # Exemples d'intégration
└── Fakhsash-API.postman_collection.json  # Collection Postman
```

## 🚀 Installation en 5 Minutes

### 1️⃣ Installer PostgreSQL

**macOS :**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian) :**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows :**
Télécharger depuis https://www.postgresql.org/download/windows/

### 2️⃣ Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Dans psql, exécuter :
CREATE DATABASE fakhsash_db;
\q
```

### 3️⃣ Configurer le projet

```bash
cd fakhsash-backend

# Installer les dépendances
npm install

# Copier le fichier .env
cp .env.example .env

# Éditer .env avec vos informations
nano .env  # ou utilisez votre éditeur préféré
```

**Configuration minimale dans .env :**
```env
DB_PASSWORD=votre_mot_de_passe_postgres
JWT_SECRET=changez_moi_secret_32_caracteres_minimum
```

### 4️⃣ Initialiser la base de données

```bash
npm run init-db
```

✅ Cela créera toutes les tables et insérera 5 médecins de test (PIN: 1234)

### 5️⃣ Démarrer le serveur

```bash
# Mode développement (avec auto-reload)
npm run dev

# OU mode production
npm start
```

🎉 Votre API est maintenant accessible sur **http://localhost:5000**

## 🧪 Tester l'API

### Option 1 : Avec curl

```bash
# Test de santé
curl http://localhost:5000/health

# Inscription d'un patient
curl -X POST http://localhost:5000/api/auth/register/patient \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "Patient",
    "date_naissance": "1990-01-01",
    "age": 34,
    "cin": "TEST123",
    "sexe": "homme",
    "adresse": "123 Rue Test",
    "email": "test@gmail.com",
    "telephone": "+212612345678",
    "code_pin": "1234"
  }'
```

### Option 2 : Avec Postman

1. Ouvrir Postman
2. Importer le fichier `Fakhsash-API.postman_collection.json`
3. Modifier la variable `baseUrl` si nécessaire
4. Tester les requêtes

## 🔗 Intégrer avec votre Frontend

### Étape 1 : Créer un fichier api.js

Copiez le contenu de `integration-frontend-example.js` dans votre projet frontend.

### Étape 2 : Modifier register.html

Ajoutez dans votre `script.js` :

```javascript
// Remplacez l'URL de l'API
const API_URL = 'http://localhost:5000/api';

// Dans le form submit handler
form.addEventListener("submit", async function(e) {
    e.preventDefault();

    if (!validateForm(form)) {
        alert("Merci de remplir correctement tous les champs !");
        return;
    }

    const formData = {
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        date_naissance: document.getElementById('dateNaissance').value,
        age: parseInt(document.getElementById('age').value),
        cin: document.getElementById('cin').value,
        sexe: document.getElementById('sexe').value,
        adresse: document.getElementById('adresse').value,
        email: document.getElementById('email').value,
        telephone: iti.getNumber(), // Numéro complet international
        code_pin: document.getElementById('pin').value
    };

    try {
        const response = await fetch(`${API_URL}/auth/register/patient`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            // Sauvegarder le token
            localStorage.setItem('token', result.data.token);
            
            // Afficher le numéro de carte
            cardNumberSpan.textContent = result.data.patient.numero_carte;

            // Masquer le formulaire et afficher le succès
            form.parentElement.style.display = "none";
            successBox.classList.remove("hidden");

            // Redirection
            setTimeout(() => {
                window.location.href = "login.html";
            }, 5000);
        } else {
            alert("Erreur : " + result.message);
        }
    } catch (error) {
        alert("Erreur de connexion au serveur");
        console.error(error);
    }
});
```

### Étape 3 : Modifier login.html

```javascript
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = document.getElementById('identifier').value;
    const code_pin = document.getElementById('pin').value;

    try {
        const response = await fetch(`${API_URL}/auth/login/patient`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier, code_pin })
        });

        const result = await response.json();

        if (result.success) {
            // Sauvegarder le token et les infos
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.patient));

            // Redirection vers le dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert('Identifiants incorrects');
        }
    } catch (error) {
        alert('Erreur de connexion');
        console.error(error);
    }
});
```

## 📱 Endpoints Principaux

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/auth/register/patient` | Inscription patient | Non |
| POST | `/api/auth/login/patient` | Connexion patient | Non |
| POST | `/api/auth/login/medecin` | Connexion médecin | Non |
| GET | `/api/auth/profile` | Profil utilisateur | Oui |
| GET | `/api/rendezvous/medecins` | Liste des médecins | Oui |
| POST | `/api/rendezvous` | Créer rendez-vous | Oui |
| GET | `/api/rendezvous/patient` | Mes rendez-vous | Oui |
| GET | `/api/dossiers/patient/:id` | Dossier médical | Oui |
| GET | `/api/paiements/tarifs` | Tarifs | Non |
| POST | `/api/paiements` | Créer paiement | Oui |

## 🎯 Comptes de Test

Après l'initialisation de la base de données, vous avez accès à :

**5 Médecins de test :**
- Email : `dr.alami@fakhsash.ma` (Cardiologie)
- Email : `dr.bennani@fakhsash.ma` (Pédiatrie)
- Email : `dr.elidrissi@fakhsash.ma` (Médecine Générale)
- Email : `dr.tazi@fakhsash.ma` (Dermatologie)
- Email : `dr.benkirane@fakhsash.ma` (Ophtalmologie)

**PIN pour tous :** `1234`

## ⚠️ Points Importants

1. **Sécurité** :
   - Changez `JWT_SECRET` dans `.env` (min 32 caractères)
   - Utilisez des mots de passe forts pour PostgreSQL
   - En production, activez HTTPS

2. **CORS** :
   - Le backend accepte les requêtes depuis `http://localhost:3000` par défaut
   - Modifiez `FRONTEND_URL` dans `.env` pour votre domaine

3. **Stripe** :
   - Les paiements nécessitent une clé Stripe
   - Utilisez les clés de test pour le développement
   - Obtenez-les sur https://stripe.com

4. **Email** :
   - Pour les notifications par email, configurez `EMAIL_*` dans `.env`
   - Utilisez un mot de passe d'application Gmail

## 🔧 Commandes Utiles

```bash
# Démarrer en développement
npm run dev

# Démarrer en production
npm start

# Réinitialiser la base de données
npm run init-db

# Voir les logs (si vous utilisez PM2)
pm2 logs fakhsash-api
```

## 📚 Documentation Complète

- **README.md** : Documentation détaillée de l'API
- **DEPLOYMENT.md** : Guide de déploiement en production
- **integration-frontend-example.js** : Exemples de code pour l'intégration

## 🆘 Problèmes Courants

### Erreur de connexion PostgreSQL

```bash
# Vérifier que PostgreSQL est lancé
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Vérifier les logs
tail -f /usr/local/var/log/postgres.log  # macOS
sudo tail -f /var/log/postgresql/postgresql-*.log  # Linux
```

### Port 5000 déjà utilisé

Modifiez `PORT` dans `.env` :
```env
PORT=3001
```

### Token JWT invalide

Vérifiez que `JWT_SECRET` est identique dans `.env` et qu'il fait au moins 32 caractères.

## 📞 Support

En cas de problème :
1. Vérifiez les logs du serveur
2. Consultez `README.md` pour plus de détails
3. Testez avec Postman pour isoler le problème

---

🎉 **Félicitations !** Votre backend Fakhsash est prêt à l'emploi !
