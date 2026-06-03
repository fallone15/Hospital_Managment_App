const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Répertoire de stockage des PDFs (depuis l'autre projet Medecin_dashboard)
const EXTERNAL_PDF_BASE = process.platform === 'win32'
  ? 'D:\\Medecin_dashboard\\Back_end\\'
  : '/home/caretrack2/medecin-dashboard/Back_end/';

// Répertoire de stockage des PDFs local
const PDF_STORAGE_DIR = path.join(__dirname, '../uploads/ordonnances');

// S'assurer que le répertoire existe
if (!fs.existsSync(PDF_STORAGE_DIR)) {
  fs.mkdirSync(PDF_STORAGE_DIR, { recursive: true });
}

// Fonction utilitaire pour résoudre le chemin complet du PDF
const resolvePDFPath = (cheminFromDb) => {
  if (!cheminFromDb) return null;
  
  // Si le chemin contient déjà le chemin complet, le retourner
  if (cheminFromDb.startsWith('D:\\') || cheminFromDb.startsWith('/') || cheminFromDb.startsWith('/home/')) {
    return cheminFromDb;
  }
  
  // Sinon, concaténer avec le chemin de base
  return path.join(EXTERNAL_PDF_BASE, cheminFromDb);
};

// Récupérer les infos du PDF d'une ordonnance (pas de génération, juste lecture)
const getOrdonnancePDFInfo = async (req, res) => {
  try {
    const { ordonnance_id } = req.params;
    const patient_id = req.user.id;

    // Récupérer l'ordonnance
    const ordonnanceResult = await query(
      `SELECT o.*, 
              c.id_patient
       FROM ordonnances o
       LEFT JOIN consultations c ON o.id_consultation = c.id_consultation
       WHERE o.id_ordonnance = $1`,
      [ordonnance_id]
    );

    if (ordonnanceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    const ordonnance = ordonnanceResult.rows[0];

    // Vérifier l'accès
    if (ordonnance.id_patient !== patient_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Vérifier que le PDF existe
    if (!ordonnance.chemin_pdf || ordonnance.statut_pdf !== 'genere') {
      return res.status(400).json({
        success: false,
        message: 'Le PDF n\'est pas disponible'
      });
    }

    // Résoudre le chemin complet
    const fullPath = resolvePDFPath(ordonnance.chemin_pdf);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Le fichier PDF n\'a pas été trouvé',
        debug: fullPath
      });
    }

    res.json({
      success: true,
      message: 'Informations du PDF récupérées',
      data: {
        ordonnance_id: ordonnance.id_ordonnance,
        chemin_pdf: ordonnance.chemin_pdf,
        statut: ordonnance.statut_pdf,
        date_generation: ordonnance.date_generation,
        downloadUrl: `/api/ordonnances/${ordonnance_id}/download`
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des infos PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des infos PDF'
    });
  }
};

// Télécharger un PDF d'ordonnance
const downloadOrdonnancePDF = async (req, res) => {
  try {
    const { ordonnance_id } = req.params;
    const patient_id = req.user.id;

    // Récupérer le chemin du PDF
    const result = await query(
      `SELECT o.chemin_pdf, o.statut_pdf, c.id_patient
       FROM ordonnances o
       LEFT JOIN consultations c ON o.id_consultation = c.id_consultation
       WHERE o.id_ordonnance = $1`,
      [ordonnance_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    const ordonnance = result.rows[0];

    // Vérifier l'accès
    if (ordonnance.id_patient !== patient_id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Vérifier que le PDF existe
    if (!ordonnance.chemin_pdf || ordonnance.statut_pdf !== 'genere') {
      return res.status(400).json({
        success: false,
        message: 'Le PDF n\'est pas disponible. Veuillez le générer d\'abord.'
      });
    }

    // Résoudre le chemin complet
    const fullPath = resolvePDFPath(ordonnance.chemin_pdf);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Le fichier PDF n\'a pas été trouvé',
        debug: fullPath
      });
    }

    // Télécharger le fichier
    res.download(fullPath, `ordonnance_${ordonnance_id}.pdf`);
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du PDF'
    });
  }
};

// Récupérer le statut de génération d'un PDF
const getOrdonnancePDFStatus = async (req, res) => {
  try {
    const { ordonnance_id } = req.params;

    const result = await query(
      `SELECT id_ordonnance, statut_pdf, date_generation, chemin_pdf
       FROM ordonnances
       WHERE id_ordonnance = $1`,
      [ordonnance_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    const ordonnance = result.rows[0];
    
    // Résoudre le chemin complet et vérifier l'existence
    const fullPath = ordonnance.chemin_pdf ? resolvePDFPath(ordonnance.chemin_pdf) : null;
    const fileExists = fullPath && fs.existsSync(fullPath);

    res.json({
      success: true,
      data: {
        ordonnance_id: ordonnance.id_ordonnance,
        statut: ordonnance.statut_pdf,
        date_generation: ordonnance.date_generation,
        isPDFGenerated: ordonnance.statut_pdf === 'genere' && fileExists
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut'
    });
  }
};

module.exports = {
  getOrdonnancePDFInfo,
  downloadOrdonnancePDF,
  getOrdonnancePDFStatus
};
