const API_URL = 'http://172.16.84.81:5000' + '/api';

const resetForm = document.getElementById('resetForm');
const messageBox = document.getElementById('messageBox');
const backToLogin = document.getElementById('backToLogin');

// Récupérer les paramètres de l'URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const email = urlParams.get('email');

if (!token || !email) {
    showMessage('Lien de réinitialisation invalide ou manquant.', 'error');
    resetForm.classList.add('hidden');
}

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const pin = document.getElementById('pin').value;
    const confirmPin = document.getElementById('confirmPin').value;

    if (pin !== confirmPin) {
        showMessage('Les codes PIN ne correspondent pas.', 'error');
        return;
    }

    if (pin.length !== 4) {
        showMessage('Le code PIN doit contenir 4 chiffres.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/reset-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, email, code_pin: pin })
        });

        const result = await response.json();

        if (result.success) {
            showMessage(result.message, 'success');
            resetForm.classList.add('hidden');
            backToLogin.classList.remove('hidden');
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showMessage('Erreur lors de la connexion au serveur.', 'error');
    }
});

function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.className = `mt-6 p-4 rounded-xl text-sm font-medium text-center ${type === 'success'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`;
    messageBox.classList.remove('hidden');
}
