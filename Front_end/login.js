// Configuration de l'API
const API_URL = 'http://localhost:5000/api';

// Éléments du DOM
const loginForm = document.getElementById('loginForm');
const identifierInput = document.getElementById('identifier');
const pinInput = document.getElementById('pin');

// Gestion de la soumission du formulaire
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = identifierInput.value.trim();
    const code_pin = pinInput.value;

    // Validation basique
    if (!identifier || !code_pin) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    if (code_pin.length !== 4 || !/^\d{4}$/.test(code_pin)) {
        alert('Le code PIN doit contenir exactement 4 chiffres');
        return;
    }

    console.log('🔐 Tentative de connexion:', { identifier });

    try {
        // Envoyer la requête de connexion
        const response = await fetch(`${API_URL}/auth/login/patient`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier, code_pin })
        });

        const result = await response.json();
        console.log('📥 Réponse du serveur:', result);

        if (result.success) {
            // Sauvegarder les données de session
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('carte_rfid', result.data.patient.carte_rfid);
            localStorage.setItem('user', JSON.stringify(result.data.patient));

            console.log('✅ Connexion réussie !');
            console.log('👤 Utilisateur:', result.data.patient);

            // Afficher un message de succès
            alert(`Bienvenue ${result.data.patient.prenom} ${result.data.patient.nom} !`);

            // Redirection vers le dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Afficher l'erreur
            alert('❌ ' + result.message);
            console.error('Erreur de connexion:', result.message);
        }
    } catch (error) {
        console.error('❌ Erreur de connexion:', error);
        alert('❌ Erreur de connexion au serveur. Vérifiez que le backend est démarré sur le port 5000.');
    }
});

// Vérifier si l'utilisateur est déjà connecté
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        console.log('ℹ️ Utilisateur déjà connecté, redirection...');
        window.location.href = 'dashboard.html';
    }
});