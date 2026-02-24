// ============================================
// EXEMPLE D'INTÉGRATION API POUR LE FRONTEND
// ============================================
// Ajoutez ce code dans un fichier api.js dans votre projet frontend

const API_URL = 'http://localhost:5500/api';

// ============================================
// GESTION DU TOKEN
// ============================================

const setToken = (token) => {
  localStorage.setItem('fakhsash_token', token);
};

const getToken = () => {
  return localStorage.getItem('fakhsash_token');
};

const removeToken = () => {
  localStorage.removeItem('fakhsash_token');
};

// ============================================
// FONCTION HELPER POUR LES REQUÊTES
// ============================================

const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur réseau');
    }

    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

// ============================================
// AUTHENTIFICATION
// ============================================

// Inscription d'un patient
const register = async (formData) => {
  const data = await apiRequest('/auth/register/patient', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

  if (data.success) {
    setToken(data.data.token);
  }

  return data;
};

// Connexion patient
const loginPatient = async (identifier, code_pin) => {
  const data = await apiRequest('/auth/login/patient', {
    method: 'POST',
    body: JSON.stringify({ identifier, code_pin }),
  });

  if (data.success) {
    setToken(data.data.token);
  }

  return data;
};

// Connexion médecin
const loginMedecin = async (identifier, code_pin) => {
  const data = await apiRequest('/auth/login/medecin', {
    method: 'POST',
    body: JSON.stringify({ identifier, code_pin }),
  });

  if (data.success) {
    setToken(data.data.token);
  }

  return data;
};

// Obtenir le profil
const getProfile = async () => {
  return await apiRequest('/auth/profile');
};

// Déconnexion
const logout = () => {
  removeToken();
  window.location.href = '/login.html';
};

// ============================================
// RENDEZ-VOUS
// ============================================

// Récupérer la liste des médecins
const getMedecins = async (specialite = null) => {
  const params = specialite ? `?specialite=${specialite}` : '';
  return await apiRequest(`/rendezvous/medecins${params}`);
};

// Récupérer les disponibilités d'un médecin
const getDisponibilites = async (medecinId, date = null) => {
  const params = date ? `?date=${date}` : '';
  return await apiRequest(`/rendezvous/medecins/${medecinId}/disponibilites${params}`);
};

// Créer un rendez-vous
const createRendezVous = async (rdvData) => {
  return await apiRequest('/rendezvous', {
    method: 'POST',
    body: JSON.stringify(rdvData),
  });
};

// Récupérer mes rendez-vous (patient)
const getMyRendezVous = async (statut = null) => {
  const params = statut ? `?statut=${statut}` : '';
  return await apiRequest(`/rendezvous/patient${params}`);
};

// Annuler un rendez-vous
const cancelRendezVous = async (rdvId) => {
  return await apiRequest(`/rendezvous/${rdvId}`, {
    method: 'DELETE',
  });
};

// ============================================
// DOSSIERS MÉDICAUX
// ============================================

// Récupérer mon dossier médical
const getDossierMedical = async (patientId) => {
  return await apiRequest(`/dossiers/patient/${patientId}`);
};

// Récupérer mes consultations
const getConsultations = async (patientId) => {
  return await apiRequest(`/dossiers/consultations/${patientId}`);
};

// ============================================
// PAIEMENTS
// ============================================

// Récupérer les tarifs
const getTarifs = async () => {
  return await apiRequest('/paiements/tarifs');
};

// Créer un paiement
const createPaiement = async (paiementData) => {
  return await apiRequest('/paiements', {
    method: 'POST',
    body: JSON.stringify(paiementData),
  });
};

// Confirmer un paiement Stripe
const confirmPaiement = async (paymentIntentId) => {
  return await apiRequest('/paiements/confirm', {
    method: 'POST',
    body: JSON.stringify({ payment_intent_id: paymentIntentId }),
  });
};

// Récupérer l'historique des paiements
const getHistoriquePaiements = async () => {
  return await apiRequest('/paiements/historique');
};

// ============================================
// EXEMPLE D'UTILISATION DANS register.html
// ============================================

/*
// Dans votre script.js, modifiez la fonction de soumission du formulaire :

form.addEventListener("submit", async function(e) {
    e.preventDefault();

    if (!validateForm(form)) {
        alert("Merci de remplir correctement tous les champs !");
        return;
    }

    // Récupérer le numéro complet avec intl-tel-input
    const fullPhoneNumber = iti.getNumber();

    // Préparer les données
    const formData = {
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        date_naissance: document.getElementById('dateNaissance').value,
        age: parseInt(document.getElementById('age').value),
        cin: document.getElementById('cin').value,
        sexe: document.getElementById('sexe').value,
        adresse: document.getElementById('adresse').value,
        email: document.getElementById('email').value,
        telephone: fullPhoneNumber,
        code_pin: document.getElementById('pin').value
    };

    try {
        // Appeler l'API
        const result = await register(formData);

        if (result.success) {
            // Afficher le numéro de carte
            cardNumberSpan.textContent = result.data.patient.numero_carte;

            // Masquer le formulaire
            form.parentElement.style.display = "none";

            // Afficher le message succès
            successBox.classList.remove("hidden");

            // Redirection
            setTimeout(() => {
                window.location.href = "login.html";
            }, 5000);
        }
    } catch (error) {
        alert("Erreur lors de l'inscription : " + error.message);
    }
});
*/

// ============================================
// EXEMPLE D'UTILISATION DANS login.html
// ============================================

/*
// Dans votre page de connexion :

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = document.getElementById('identifier').value;
    const code_pin = document.getElementById('pin').value;

    try {
        const result = await loginPatient(identifier, code_pin);

        if (result.success) {
            // Stocker les infos utilisateur
            localStorage.setItem('user', JSON.stringify(result.data.patient));

            // Redirection vers le dashboard
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        alert('Identifiants incorrects');
    }
});
*/

// ============================================
// EXEMPLE POUR CRÉER UN RENDEZ-VOUS
// ============================================

/*
const bookRendezVous = async () => {
    const rdvData = {
        medecin_id: 1,
        date_rdv: '2024-03-20',
        heure_rdv: '14:00',
        motif: 'Consultation de routine'
    };

    try {
        const result = await createRendezVous(rdvData);
        
        if (result.success) {
            alert('Rendez-vous créé avec succès !');
            // Rafraîchir la liste des rendez-vous
            loadMyRendezVous();
        }
    } catch (error) {
        alert('Erreur : ' + error.message);
    }
};
*/

// ============================================
// VÉRIFIER SI L'UTILISATEUR EST CONNECTÉ
// ============================================

const isAuthenticated = () => {
  return !!getToken();
};

const requireAuth = () => {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
  }
};

// Sur les pages protégées, appelez requireAuth() au chargement
// window.addEventListener('DOMContentLoaded', requireAuth);

// ============================================
// EXPORTER LES FONCTIONS
// ============================================

// Si vous utilisez des modules ES6 :
/*
export {
  register,
  loginPatient,
  loginMedecin,
  getProfile,
  logout,
  getMedecins,
  getDisponibilites,
  createRendezVous,
  getMyRendezVous,
  cancelRendezVous,
  getDossierMedical,
  getConsultations,
  getTarifs,
  createPaiement,
  confirmPaiement,
  getHistoriquePaiements,
  isAuthenticated,
  requireAuth
};
*/
