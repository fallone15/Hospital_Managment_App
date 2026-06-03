#!/bin/bash

# ==============================================================================
# Script de Déploiement Automatique pour Raspberry Pi (CareTrack)
# ==============================================================================
# Ce script installe les dépendances système (Node.js, PostgreSQL),
# configure la base de données, crée le fichier .env de production,
# installe les dépendances Node.js et lance le serveur en arrière-plan avec PM2.
#
# Usage:
#   chmod +x deploy-pi.sh
#   ./deploy-pi.sh
# ==============================================================================

# Couleurs pour le terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}🏥 Début de l'installation et du déploiement sur le Pi ${NC}"
echo -e "${GREEN}====================================================${NC}"

# 1. Mise à jour système
echo -e "\n${YELLOW}🔄 1. Mise à jour du système...${NC}"
sudo apt update && sudo apt upgrade -y

# Install curl if missing
if ! command -v curl &> /dev/null; then
    echo "📦 Installation de curl..."
    sudo apt install curl -y
fi

# 2. Installation de Node.js (si absent)
echo -e "\n${YELLOW}📦 2. Vérification de Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Node.js non trouvé. Installation via NodeSource (v18)..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js installé avec succès : $(node -v)${NC}"
else
    echo -e "${GREEN}✅ Node.js est déjà installé : $(node -v)${NC}"
fi

# 3. Installation de PostgreSQL (si absent)
echo -e "\n${YELLOW}📦 3. Vérification de PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL non trouvé. Installation..."
    sudo apt install postgresql postgresql-contrib -y
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    echo -e "${GREEN}✅ PostgreSQL installé et démarré.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL est déjà installé.${NC}"
fi

# 4. Configuration de la base de données PostgreSQL
echo -e "\n${YELLOW}🗄️  4. Configuration de l'utilisateur et de la base de données...${NC}"

# Vérifier si le rôle hospital_admin existe, sinon le créer
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='hospital_admin'" | grep -q 1
if [ $? -ne 0 ]; then
    echo "👤 Création de l'utilisateur PostgreSQL 'hospital_admin'..."
    sudo -u postgres psql -c "CREATE USER hospital_admin WITH ENCRYPTED PASSWORD 'namosash';"
    sudo -u postgres psql -c "ALTER USER hospital_admin WITH SUPERUSER;"
    echo -e "${GREEN}✅ Utilisateur hospital_admin créé.${NC}"
else
    echo "✅ L'utilisateur hospital_admin existe déjà."
fi

# Vérifier si la base de données hospital_db existe, sinon la créer
sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw hospital_db
if [ $? -ne 0 ]; then
    echo "📊 Création de la base de données 'hospital_db'..."
    sudo -u postgres psql -c "CREATE DATABASE hospital_db OWNER hospital_admin;"
    echo -e "${GREEN}✅ Base de données hospital_db créée.${NC}"
else
    echo "✅ La base de données hospital_db existe déjà."
fi

# 5. Configuration de l'environnement (.env)
echo -e "\n${YELLOW}📝 5. Configuration du fichier de configuration .env...${NC}"
cd Back_end

if [ ! -f .env ]; then
    echo "Copie de .env.example vers .env..."
    cp .env.example .env
    
    # Remplacement des valeurs par défaut pour la production locale
    sed -i 's/DB_USER=.*/DB_USER=hospital_admin/g' .env
    sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=namosash/g' .env
    sed -i 's/DB_NAME=.*/DB_NAME=hospital_db/g' .env
    sed -i 's/DB_HOST=.*/DB_HOST=localhost/g' .env
    sed -i 's/PORT=.*/PORT=5000/g' .env
    sed -i 's/NODE_ENV=.*/NODE_ENV=production/g' .env
    
    # Génération d'une clé JWT sécurisée aléatoire
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/g" .env
    
    echo -e "${GREEN}✅ Fichier .env configuré automatiquement avec des identifiants sécurisés.${NC}"
else
    echo -e "${GREEN}✅ Le fichier .env existe déjà (non modifié).${NC}"
fi

# 6. Installation des packages Node.js & Init Database
echo -e "\n${YELLOW}📦 6. Installation des packages npm...${NC}"
npm install --production

echo -e "\n${YELLOW}📊 7. Initialisation des tables SQL...${NC}"
npm run init-db

# 7. Configuration de PM2 pour maintenir le processus actif
echo -e "\n${YELLOW}🚀 8. Configuration du gestionnaire de processus PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo "Installation globale de PM2..."
    sudo npm install -g pm2
fi

echo "Démarrage du serveur CareTrack sous PM2..."
pm2 delete hospital-api 2>/dev/null || true
pm2 start server.js --name hospital-api
pm2 save

# Configurer le lancement de PM2 au boot du Raspberry Pi
echo "Configuration du démarrage automatique au reboot du système..."
pm2 startup | tail -n 1 | bash

echo -e "\n${GREEN}====================================================${NC}"
echo -e "${GREEN}✅ DEPLOIEMENT TERMINE AVEC SUCCES !${NC}"
echo -e "${GREEN}====================================================${NC}"
echo -e "🏥 Le serveur CareTrack tourne désormais en arrière-plan."
echo -e "📡 URL d'accès locale : ${YELLOW}http://localhost:5000${NC} (ou l'adresse IP de votre Pi)"
echo -e "🔧 Commandes utiles :"
echo -e "   - ${GREEN}pm2 logs hospital-api${NC}    : Voir les logs du serveur en temps réel."
echo -e "   - ${GREEN}pm2 status${NC}              : Voir l'état du serveur."
echo -e "   - ${GREEN}pm2 restart hospital-api${NC}    : Redémarrer le serveur."
echo -e "====================================================\n"
