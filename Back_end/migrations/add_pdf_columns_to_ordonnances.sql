-- Migration: Ajouter les colonnes de gestion PDF aux ordonnances
-- Version: 1.0
-- Date: 2024

-- Ajouter les colonnes si elles n'existent pas
ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS chemin_pdf TEXT DEFAULT NULL;
ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS statut_pdf VARCHAR(20) DEFAULT 'non_genere' CHECK (statut_pdf IN ('non_genere', 'genere', 'erreur'));
ALTER TABLE ordonnances ADD COLUMN IF NOT EXISTS date_generation TIMESTAMP DEFAULT NULL;

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_ordonnances_consultation ON ordonnances(id_consultation);
CREATE INDEX IF NOT EXISTS idx_ordonnances_statut ON ordonnances(statut_pdf);

-- Vérification
SELECT 'Migration completed successfully' as status;
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ordonnances' 
ORDER BY ordinal_position;
