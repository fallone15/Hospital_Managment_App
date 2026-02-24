-- Script de configuration PostgreSQL pour le projet Hospital
-- À exécuter dans pgAdmin (Query Tool) ou psql

-- 1. Créer l'utilisateur hospital_admin (si n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'hospital_admin') THEN
        CREATE USER hospital_admin WITH PASSWORD 'namosash';
        RAISE NOTICE 'Utilisateur hospital_admin créé';
    ELSE
        RAISE NOTICE 'Utilisateur hospital_admin existe déjà';
    END IF;
END
$$;

-- 2. Donner les privilèges de création de base de données
ALTER USER hospital_admin CREATEDB;

-- 3. Créer la base de données (si n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'hospital_db') THEN
        CREATE DATABASE hospital_db OWNER hospital_admin;
        RAISE NOTICE 'Base de données hospital_db créée';
    ELSE
        RAISE NOTICE 'Base de données hospital_db existe déjà';
    END IF;
END
$$;

-- 4. Se connecter à hospital_db et donner tous les privilèges
\c hospital_db

-- Donner tous les privilèges sur la base
GRANT ALL PRIVILEGES ON DATABASE hospital_db TO hospital_admin;

-- Donner les privilèges sur le schéma public
GRANT ALL PRIVILEGES ON SCHEMA public TO hospital_admin;

-- Donner les privilèges sur toutes les tables futures
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hospital_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hospital_admin;

-- Vérification
SELECT 'Configuration terminée!' as status;
SELECT current_database() as database, current_user as user;
