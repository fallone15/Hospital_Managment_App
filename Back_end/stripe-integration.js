/**
 * Integration Stripe - Workflow de RDV avec Paiement
 * 
 * Ce fichier démontre comment intégrer le flux de paiement Stripe
 * dans votre système de réservation de rendez-vous
 */

// ============================================
// ÉTAPE 1: Obtenir la clé Stripe publique
// ============================================
async function initializeStripePayment() {
  try {
    // Récupérer les tarifs et initialiser Stripe
    const response = await fetch('/api/paiements/tarifs');
    const data = await response.json();
    
    // Stocker les tarifs pour plus tard
    window.tarifsMedicaux = data.data;
    
    console.log('✅ Tarifs chargés:', window.tarifsMedicaux);
  } catch (error) {
    console.error('❌ Erreur lors du chargement des tarifs:', error);
  }
}

// ============================================
// ÉTAPE 2: Créer un rendez-vous
// ============================================
async function creerRendezVousAvecPaiement(formData) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert('Veuillez vous connecter d\'abord');
    window.location.href = 'login.html';
    return;
  }

  try {
    // Afficher un indicateur de chargement
    showLoadingSpinner('Création du rendez-vous...');

    // Créer le rendez-vous
    const rdvResponse = await fetch('/api/rdv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        medecin_id: formData.medecin_id,
        date_rdv: formData.date_rdv,
        heure_rdv: formData.heure_rdv,
        motif: formData.motif,
        id_member: formData.id_member || null
      })
    });

    if (!rdvResponse.ok) {
      const error = await rdvResponse.json();
      throw new Error(error.message);
    }

    const rdvData = await rdvResponse.json();
    console.log('✅ RDV créé:', rdvData);

    // Stocker les informations pour le paiement
    const appointmentInfo = {
      id: rdvData.data.rendez_vous.id,
      medecin_nom: rdvData.data.paiement_requis.medecin.nom,
      medecin_prenom: rdvData.data.paiement_requis.medecin.prenom,
      specialite: rdvData.data.paiement_requis.medecin.specialite,
      date_rdv: rdvData.data.rendez_vous.date_rdv,
      heure_rdv: rdvData.data.rendez_vous.heure_rdv,
      service_nom: rdvData.data.paiement_requis.medecin.specialite,
      montant: rdvData.data.paiement_requis.montant,
      patient_nom: rdvData.data.paiement_requis.patient.nom,
      patient_email: rdvData.data.paiement_requis.patient.email,
      patient_prenom: rdvData.data.paiement_requis.patient.prenom
    };

    // Stocker dans sessionStorage pour la page de paiement
    sessionStorage.setItem('appointmentData', JSON.stringify(appointmentInfo));

    // Afficher la confirmation
    showPaymentConfirmation(appointmentInfo);

  } catch (error) {
    console.error('❌ Erreur:', error);
    alert('Erreur: ' + error.message);
  } finally {
    hideLoadingSpinner();
  }
}

// ============================================
// ÉTAPE 3: Afficher la confirmation avant paiement
// ============================================
function showPaymentConfirmation(appointmentInfo) {
  const message = `
    📋 Résumé de votre rendez-vous:
    
    👨‍⚕️ Médecin: Dr. ${appointmentInfo.medecin_prenom} ${appointmentInfo.medecin_nom}
    📅 Date: ${new Date(appointmentInfo.date_rdv).toLocaleDateString('fr-FR')}
    🕐 Heure: ${appointmentInfo.heure_rdv}
    💰 Montant à payer: ${appointmentInfo.montant} MAD
    
    Cliquez sur "OK" pour procéder au paiement sécurisé.
  `;

  if (confirm(message)) {
    // Rediriger vers la page de paiement
    window.location.href = 'payment-checkout.html';
  }
}

// ============================================
// ÉTAPE 4: Fonctions utilitaires UI
// ============================================

function showLoadingSpinner(message = 'Chargement...') {
  let spinner = document.getElementById('loading-spinner');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.95);
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      text-align: center;
    `;
    document.body.appendChild(spinner);
  }
  
  spinner.innerHTML = `
    <div style="margin-bottom: 15px;">
      <div style="
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
      "></div>
    </div>
    <p style="color: #333; margin: 0;">${message}</p>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  spinner.style.display = 'block';
}

function hideLoadingSpinner() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}

// ============================================
// ÉTAPE 5: Exemple d'utilisation dans un formulaire
// ============================================

function setupAppointmentForm() {
  const form = document.getElementById('appointment-form');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        medecin_id: parseInt(document.getElementById('medecin').value),
        date_rdv: document.getElementById('date').value,
        heure_rdv: document.getElementById('heure').value,
        motif: document.getElementById('motif').value,
        id_member: document.getElementById('member') ? document.getElementById('member').value : null
      };

      console.log('📝 Données du formulaire:', formData);
      
      // Créer le RDV avec paiement
      await creerRendezVousAvecPaiement(formData);
    });
  }
}

// ============================================
// ÉTAPE 6: Exemple HTML pour le formulaire
// ============================================

const EXAMPLE_HTML = `
<!-- Ajouter ceci dans votre HTML de réservation de RDV -->

<form id="appointment-form">
  <div class="form-group">
    <label>Sélectionner un médecin:</label>
    <select id="medecin" required>
      <option value="">-- Choisir un médecin --</option>
      <!-- Les options seront remplies dynamiquement -->
    </select>
  </div>

  <div class="form-group">
    <label>Date du rendez-vous:</label>
    <input type="date" id="date" required min="2024-04-10">
  </div>

  <div class="form-group">
    <label>Heure du rendez-vous:</label>
    <select id="heure" required>
      <option value="">-- Choisir une heure --</option>
      <!-- Les options seront remplies dynamiquement -->
    </select>
  </div>

  <div class="form-group">
    <label>Motif de la consultation:</label>
    <textarea id="motif" required placeholder="Décrivez votre motif de consultation"></textarea>
  </div>

  <div class="form-group">
    <label>Membre familial (optionnel):</label>
    <select id="member">
      <option value="">-- Vous-même --</option>
      <!-- Les options seront remplies dynamiquement -->
    </select>
  </div>

  <button type="submit" class="btn btn-primary">
    💳 Réserver et Payer
  </button>
</form>

<!-- Inclure les scripts -->
<script src="stripe-integration.js"></script>
<script>
  // Initialiser au chargement
  document.addEventListener('DOMContentLoaded', () => {
    initializeStripePayment();
    setupAppointmentForm();
  });
</script>
`;

// ============================================
// ÉTAPE 7: Charger les médecins disponibles
// ============================================

async function loadMedecins() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/rdv/medecins', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('medecin');
      if (select) {
        select.innerHTML = '<option value="">-- Choisir un médecin --</option>';
        
        data.data.forEach(medecin => {
          const option = document.createElement('option');
          option.value = medecin.id;
          option.textContent = `Dr. ${medecin.prenom} ${medecin.nom} (${medecin.specialite})`;
          select.appendChild(option);
        });

        // Charger les crénéaux quand un médecin est sélectionné
        select.addEventListener('change', () => {
          loadCreneaux(medecin.id, document.getElementById('date').value);
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des médecins:', error);
  }
}

// ============================================
// ÉTAPE 8: Charger les crénéaux disponibles
// ============================================

async function loadCreneaux(medecinId, date) {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      `/api/rdv/medecins/${medecinId}/disponibilites?date=${date}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    
    if (data.success && data.data.disponible) {
      const select = document.getElementById('heure');
      if (select) {
        select.innerHTML = '<option value="">-- Choisir une heure --</option>';
        
        data.data.creneaux.forEach(creneau => {
          const option = document.createElement('option');
          option.value = creneau;
          option.textContent = creneau;
          select.appendChild(option);
        });
      }
    } else {
      alert('❌ Aucun créneau disponible pour cette date');
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des crénéaux:', error);
  }
}

// ============================================
// ÉTAPE 9: Exporter pour utilisation
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeStripePayment,
    creerRendezVousAvecPaiement,
    showPaymentConfirmation,
    setupAppointmentForm,
    loadMedecins,
    loadCreneaux
  };
}
