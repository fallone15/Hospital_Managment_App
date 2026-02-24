# 🐳 Guide Docker - Système Hospitalier Fakhsash

## Services disponibles

Ce Docker Compose configure **uniquement** les services de base de données :

- **PostgreSQL** : Base de données principale (port 5432)
- **pgAdmin** : Interface web de gestion PostgreSQL (port 5050)

## 🚀 Démarrage rapide

### 1. Prérequis

- Docker Desktop installé et démarré
- Ports 5432 et 5050 disponibles

### 2. Démarrer les services

```bash
# Démarrer PostgreSQL et pgAdmin
docker-compose up -d

# Vérifier que les services sont actifs
docker-compose ps
```

### 3. Accéder à pgAdmin

1. Ouvrez votre navigateur : **http://localhost:5050**
2. Connectez-vous avec :
   - **Email** : `admin@hospital.com`
   - **Password** : `admin123`

### 4. Configurer la connexion PostgreSQL dans pgAdmin

Une fois dans pgAdmin :

1. **Clic droit** sur `Servers` → `Register` → `Server`
2. **Onglet General** :
   - Name : `Hospital Database`
3. **Onglet Connection** :
   - Host : `postgres` (nom du service Docker)
   - Port : `5432`
   - Maintenance database : `hospital_db`
   - Username : `hospital_admin`
   - Password : `namosash`
   - ✅ Cochez "Save password"
4. **Save**

## 📊 Informations de connexion

### PostgreSQL (depuis votre machine)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=hospital_admin
DB_PASSWORD=namosash
DB_NAME=hospital_db
```

### PostgreSQL (depuis un autre container Docker)

```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=hospital_admin
DB_PASSWORD=namosash
DB_NAME=hospital_db
```

### pgAdmin Web Interface

- **URL** : http://localhost:5050
- **Email** : admin@hospital.com
- **Password** : admin123

## 🛠️ Commandes utiles

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Voir les logs
docker-compose logs -f

# Voir les logs PostgreSQL uniquement
docker-compose logs -f postgres

# Voir les logs pgAdmin uniquement
docker-compose logs -f pgadmin

# Redémarrer les services
docker-compose restart

# Arrêter et supprimer les volumes (⚠️ SUPPRIME LES DONNÉES)
docker-compose down -v

# Accéder au shell PostgreSQL
docker exec -it hospital_postgres psql -U hospital_admin -d hospital_db
```

## 🗄️ Initialisation de la base de données

Une fois les services démarrés, initialisez les tables :

```bash
# Depuis votre machine (Node.js requis)
cd Back_end
node config/initDatabase.js
```

Cela créera :
- ✅ Toutes les tables (patients, medecins, consultations, etc.)
- ✅ Les index de performance
- ✅ Des données de test

## 📦 Volumes persistants

Les données sont stockées dans des volumes Docker :

- `postgres_data` : Données PostgreSQL
- `pgadmin_data` : Configuration pgAdmin

Ces volumes persistent même après `docker-compose down`.

## 🔧 Dépannage

### Les services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier que les ports sont libres
netstat -ano | findstr :5432
netstat -ano | findstr :5050
```

### Réinitialiser complètement

```bash
# Arrêter et supprimer tout
docker-compose down -v

# Redémarrer
docker-compose up -d
```

### Connexion refusée depuis Node.js

Vérifiez que votre fichier `.env` utilise bien :
```env
DB_HOST=localhost  # Pas "postgres" si vous êtes hors Docker
```

## 🎯 Workflow de développement recommandé

1. **Démarrer Docker** : `docker-compose up -d`
2. **Initialiser la DB** : `node config/initDatabase.js`
3. **Démarrer le backend** : `npm start` (dans Back_end/)
4. **Ouvrir le frontend** : Ouvrir `Front_end/index.html`
5. **Gérer la DB** : http://localhost:5050 (pgAdmin)

## 🔒 Sécurité

⚠️ **Important pour la production** :

- Changez tous les mots de passe par défaut
- Utilisez des secrets Docker ou variables d'environnement sécurisées
- Ne commitez jamais les fichiers `.env` avec des vrais mots de passe
- Activez SSL/TLS pour PostgreSQL

## 📝 Notes

- PostgreSQL version : 16 (Alpine - image légère)
- pgAdmin version : Latest
- Réseau : `hospital_network` (bridge)
- Healthcheck : PostgreSQL vérifié toutes les 10s
