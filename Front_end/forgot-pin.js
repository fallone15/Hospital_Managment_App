const API_URL = ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname) ? 'http://localhost:5000' : 'http://' + window.location.hostname + ':5000') + '/api';

const forgotForm = document.getElementById('forgotForm');
const messageBox = document.getElementById('messageBox');

forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = document.getElementById('identifier').value.trim();

    if (!identifier) {
        showMessage('Veuillez entrer votre email ou RFID', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/request-reset-pin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier })
        });

        const result = await response.json();

        if (result.success) {
            showMessage(result.message, 'success');
            forgotForm.reset();
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
