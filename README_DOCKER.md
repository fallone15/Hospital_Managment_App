# 🐳 Docker - PostgreSQL et pgAdmin uniquement

## Services disponibles

- **PostgreSQL** : Base de données (port 5432)
- **pgAdmin** : Interface web (port 5050)

## 🚀 Démarrage

```bash
# Démarrer les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

## 🌐 Accès

### pgAdmin (Interface Web)
- **URL** : http://localhost:5050
- **Email** : admin@hospital.com
- **Password** : admin123

### Configurer la connexion dans pgAdmin

1. Clic droit sur `Servers` → `Register` → `Server`
2. **General** : Name = `Hospital Database`
3. **Connection** :
   - Host : `postgres`
   - Port : `5432`
   - Database : `hospital_db`
   - Username : `hospital_admin`
   - Password : `namosash`
   - ✅ Save password
4. **Save**

## 💻 Connexion depuis votre code Node.js

Votre fichier `.env` actuel fonctionne parfaitement :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=hospital_admin
DB_PASSWORD=namosash
DB_NAME=hospital_db
```

## 📊 Initialiser la base de données

Une fois Docker démarré :

```bash
cd Back_end
node config/initDatabase.js
```

## 🛠️ Commandes utiles

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Accéder au shell PostgreSQL
docker exec -it hospital_postgres psql -U hospital_admin -d hospital_db
```

## ✅ C'est tout !

Pas de Dockerfile, pas de build, juste PostgreSQL et pgAdmin prêts à l'emploi.
