#!/bin/bash

# Script de démarrage rapide pour Fakhsash Backend
# Usage: ./start.sh

echo "🏥 Démarrage de Fakhsash Backend..."
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null
then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si PostgreSQL est installé
if ! command -v psql &> /dev/null
then
    echo "⚠️  PostgreSQL n'est pas installé ou n'est pas dans le PATH."
    echo "Veuillez installer PostgreSQL avant de continuer."
    exit 1
fi

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé"
    echo "📝 Création du fichier .env depuis .env.example..."
    cp .env.example .env
    echo "✅ Fichier .env créé. Veuillez le configurer avec vos informations."
    echo ""
    echo "Configuration requise :"
    echo "  - DB_PASSWORD : Mot de passe PostgreSQL"
    echo "  - JWT_SECRET : Secret pour les tokens JWT"
    echo "  - STRIPE_SECRET_KEY : Clé Stripe (optionnel pour dev)"
    echo ""
    read -p "Appuyez sur Entrée après avoir configuré le fichier .env..."
fi

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo "✅ Dépendances installées"
    echo ""
fi

# Demander si l'utilisateur veut initialiser la base de données
echo "🗄️  Base de données"
read -p "Voulez-vous initialiser/réinitialiser la base de données ? (o/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]
then
    echo "📊 Initialisation de la base de données..."
    npm run init-db
    echo ""
fi

# Démarrer le serveur
echo "🚀 Démarrage du serveur..."
echo ""
npm run dev
