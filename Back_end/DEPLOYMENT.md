# 🚀 Guide de Déploiement - Fakhsash Backend

Ce guide vous aide à déployer votre backend Fakhsash en production.

## 📋 Prérequis de Production

- Serveur Linux (Ubuntu 20.04+ recommandé)
- Node.js 16.x ou supérieur
- PostgreSQL 13.x ou supérieur
- Nginx (reverse proxy)
- Nom de domaine
- Certificat SSL

## 🔧 Installation sur le Serveur

### 1. Mise à jour du système

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Installation de Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Installation de PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Configuration de PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données et l'utilisateur
CREATE DATABASE fakhsash_db;
CREATE USER fakhsash_user WITH ENCRYPTED PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE fakhsash_db TO fakhsash_user;
\q
```

### 5. Cloner et configurer le projet

```bash
cd /var/www
sudo git clone <votre-repo-git> fakhsash-backend
cd fakhsash-backend
sudo npm install --production

# Copier et configurer .env
sudo cp .env.example .env
sudo nano .env
```

Configuration `.env` pour production :
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=fakhsash_user
DB_PASSWORD=votre_mot_de_passe_securise
DB_NAME=fakhsash_db

PORT=5000
NODE_ENV=production

JWT_SECRET=votre_secret_jwt_tres_securise_32_caracteres_minimum
JWT_EXPIRES_IN=86400

STRIPE_SECRET_KEY=sk_live_votre_cle_live
STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_publique_live

FRONTEND_URL=https://votre-domaine.com

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_app
```

### 6. Initialiser la base de données

```bash
npm run init-db
```

## 🔐 Configuration de PM2 (Process Manager)

PM2 garde votre application Node.js en cours d'exécution.

### Installation

```bash
sudo npm install -g pm2
```

### Démarrage de l'application

```bash
# Démarrer l'application
pm2 start server.js --name fakhsash-api

# Configurer PM2 pour démarrer au boot
pm2 startup
pm2 save

# Commandes utiles
pm2 status          # Voir le statut
pm2 logs            # Voir les logs
pm2 restart all     # Redémarrer
pm2 stop all        # Arrêter
```

## 🌐 Configuration de Nginx

Nginx sert de reverse proxy pour votre API.

### Installation

```bash
sudo apt install nginx -y
```

### Configuration

Créer le fichier de configuration :

```bash
sudo nano /etc/nginx/sites-available/fakhsash-api
```

Contenu du fichier :

```nginx
server {
    listen 80;
    server_name api.votre-domaine.com;

    # Taille maximale des uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/fakhsash-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔒 Configuration SSL avec Let's Encrypt

### Installation de Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtenir le certificat SSL

```bash
sudo certbot --nginx -d api.votre-domaine.com
```

Certbot configurera automatiquement Nginx pour HTTPS.

### Renouvellement automatique

```bash
# Tester le renouvellement
sudo certbot renew --dry-run

# Créer un cron job pour le renouvellement automatique
sudo crontab -e

# Ajouter cette ligne :
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔥 Configuration du Firewall

```bash
# Autoriser SSH, HTTP, et HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 📊 Monitoring et Logs

### Voir les logs de l'application

```bash
# Logs PM2
pm2 logs fakhsash-api

# Logs en temps réel
pm2 logs fakhsash-api --lines 100
```

### Voir les logs Nginx

```bash
# Logs d'accès
sudo tail -f /var/log/nginx/access.log

# Logs d'erreur
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Mise à jour de l'application

Script pour mettre à jour l'application :

```bash
#!/bin/bash
# update.sh

cd /var/www/fakhsash-backend
git pull origin main
npm install --production
pm2 restart fakhsash-api
```

Rendre le script exécutable :

```bash
chmod +x update.sh
```

## 🗄️ Sauvegarde de la Base de Données

### Sauvegarde manuelle

```bash
# Créer une sauvegarde
pg_dump -U fakhsash_user fakhsash_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurer depuis une sauvegarde
psql -U fakhsash_user fakhsash_db < backup_20240320_120000.sql
```

### Sauvegarde automatique

Créer un script de sauvegarde :

```bash
sudo nano /usr/local/bin/backup-db.sh
```

Contenu :

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/fakhsash"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U fakhsash_user fakhsash_db > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Garder seulement les 7 derniers jours
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Rendre exécutable et ajouter au cron :

```bash
sudo chmod +x /usr/local/bin/backup-db.sh
sudo crontab -e

# Ajouter : sauvegarde quotidienne à 2h du matin
0 2 * * * /usr/local/bin/backup-db.sh
```

## 🛡️ Sécurité

### Bonnes pratiques

1. **Changez tous les mots de passe par défaut**
2. **Utilisez des mots de passe forts**
3. **Mettez à jour régulièrement** :
   ```bash
   sudo apt update && sudo apt upgrade -y
   npm update
   ```
4. **Limitez les connexions SSH** :
   ```bash
   sudo nano /etc/ssh/sshd_config
   # PermitRootLogin no
   # PasswordAuthentication no (si vous utilisez des clés SSH)
   ```
5. **Activez fail2ban** pour protéger contre les attaques par force brute :
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   ```

## 📈 Performance

### Optimisation PostgreSQL

```bash
sudo nano /etc/postgresql/13/main/postgresql.conf
```

Ajustements recommandés :
```conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
max_connections = 100
```

Redémarrer PostgreSQL :
```bash
sudo systemctl restart postgresql
```

## 🆘 Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
pm2 logs fakhsash-api

# Vérifier la connexion à la base de données
psql -U fakhsash_user -d fakhsash_db -h localhost
```

### Erreur de connexion à PostgreSQL

```bash
# Vérifier que PostgreSQL écoute sur localhost
sudo nano /etc/postgresql/13/main/postgresql.conf
# listen_addresses = 'localhost'

# Vérifier pg_hba.conf
sudo nano /etc/postgresql/13/main/pg_hba.conf
# Ajouter si nécessaire :
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5
```

### Nginx ne démarre pas

```bash
# Tester la configuration
sudo nginx -t

# Voir les erreurs
sudo tail -f /var/log/nginx/error.log
```

## 📞 Support

En cas de problème, consultez :
- Les logs de l'application : `pm2 logs`
- Les logs Nginx : `/var/log/nginx/`
- Les logs système : `/var/log/syslog`

---

**Note importante** : Ce guide suppose une configuration de base. Adaptez-le selon vos besoins spécifiques et votre infrastructure.
