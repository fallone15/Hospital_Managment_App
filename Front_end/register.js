// Configuration de l'API
const API_URL = 'http://localhost:5000/api';

// === État du formulaire multi-étapes ===
let currentStep = 1;
const totalSteps = 4;
let iti = null;

// === Attendre que TOUT soit chargé ===
window.addEventListener('load', function () {

    // === Toggle du code PIN (voir/masquer) ===
    const pinInput = document.getElementById('pin');
    const togglePinBtn = document.getElementById('togglePin');

    if (togglePinBtn && pinInput) {
        togglePinBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (pinInput.type === 'password') {
                pinInput.type = 'text';
                togglePinBtn.textContent = '🙈';
            } else {
                pinInput.type = 'password';
                togglePinBtn.textContent = '👁️';
            }
        });
    }

    // Nouvelle règle : bloquer la soumission si l'âge < 16 ans
    var dateNaissanceInput = document.getElementById('dateNaissance');
    var registerForm = document.getElementById('registerForm');
    function calculateAge(dateString) {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    if (registerForm && dateNaissanceInput) {
        registerForm.addEventListener('submit', function (e) {
            var dateValue = dateNaissanceInput.value;
            if (dateValue) {
                var age = calculateAge(dateValue);
                if (age < 16) {
                    e.preventDefault();
                    alert("La création de compte nécessite d'avoir au moins 16 ans.");
                    return false;
                }
            }
        });
    }
    // Bloc d'options orphelin supprimé (erreur de syntaxe)
    var phoneInput = document.getElementById('phone');
    if (phoneInput && window.intlTelInput) {
        iti = window.intlTelInput(phoneInput, {
            initialCountry: "ma",
            preferredCountries: ["ma", "fr", "be", "dz", "tn"],
            separateDialCode: true,
            autoPlaceholder: "aggressive",
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/js/utils.js"
        });
        console.log('✅ intl-tel-input initialisé');
        // Masquer l'erreur lors de la saisie
        phoneInput.addEventListener('input', function () {
            if (iti.isValidNumber()) {
                phoneInput.style.borderColor = '#4CAF50';
                var phoneError = document.getElementById('phoneError');
                if (phoneError) phoneError.style.display = 'none';
            }
        });
        phoneInput.addEventListener('countrychange', function () {
            console.log('Pays changé');
            if (phoneInput.value.trim() && iti.isValidNumber()) {
                phoneInput.style.borderColor = '#4CAF50';
                var phoneError = document.getElementById('phoneError');
                if (phoneError) phoneError.style.display = 'none';
            }
        });
    } else {
        console.error('❌ Erreur: phoneInput ou intlTelInput non trouvé');
    }
    // (Bloc dupliqué supprimé)

    // Initialiser la première étape
    showStep(1);
});

// === Éléments du DOM ===
const form = document.getElementById("registerForm");
const successBox = document.getElementById("successMessage");
const cardNumberSpan = document.getElementById("cardNumber");
const authCard = document.querySelector('.auth-card'); // Container principal

// === Navigation entre étapes ===
function showStep(stepNumber) {
    currentStep = stepNumber;

    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });

    const currentStepElement = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }

    updateStepper(stepNumber);

    if (stepNumber === totalSteps) {
        displaySummary();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepper(stepNumber) {
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNum < stepNumber) {
            step.classList.add('completed');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
        }
    });
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            showStep(currentStep + 1);
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

// === Validation par étape ===
function validateCurrentStep() {
    const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const inputs = currentStepElement.querySelectorAll('input[required], select[required]');
    let valid = true;

    inputs.forEach(input => {
        if (input.id === 'phone') {
            const phoneError = document.getElementById('phoneError');
            if (!iti || !iti.isValidNumber()) {
                input.style.borderColor = '#e74c3c';
                if (phoneError) phoneError.style.display = 'block';
                valid = false;
            } else {
                input.style.borderColor = '#4CAF50';
                if (phoneError) phoneError.style.display = 'none';
            }
            return;
        }

        if (input.type === 'email' && input.value.trim()) {
            if (!validateEmail(input.value.trim())) {
                input.style.borderColor = '#e74c3c';
                alert("L'email doit se terminer par @gmail.com");
                valid = false;
                return;
            }
        }

        if (!input.value.trim()) {
            input.style.borderColor = '#e74c3c';
            valid = false;
        } else {
            input.style.borderColor = '#4CAF50';
        }
    });

    if (!valid) {
        alert("Merci de remplir correctement tous les champs obligatoires !");
    }

    return valid;
}

// === Validation email ===
function validateEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
}

// === Afficher le récapitulatif ===
function displaySummary() {
    const summaryContent = document.getElementById('summaryContent');

    // Calculer l'âge pour la date de naissance
    const dateNaissance = document.getElementById('dateNaissance').value;
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    const data = {
        "Nom": document.getElementById('nom').value.toUpperCase(),
        "Prénom": document.getElementById('prenom').value,
        "Date de naissance": document.getElementById('dateNaissance').value,
        "Sexe": document.getElementById('sexe').value,
        "Adresse": document.getElementById('adresse').value,
        "Code Postal": document.getElementById('codePostal').value,
        "Ville": document.getElementById('ville').value,
        "Email": document.getElementById('email').value,
        "Téléphone": iti ? iti.getNumber() : document.getElementById('phone').value,
        "N° Sécu": document.getElementById('numeroSecu').value || "Non renseigné",
        "Mutuelle": document.getElementById('mutuelle').value || "Non renseigné",
        "Groupe Sanguin": document.getElementById('groupeSanguin').value || "Non renseigné",
        "Allergies": document.getElementById('allergies').value || "Aucune"
    };

    // Ajouter CIN seulement si l'âge >= 16
    if (age >= 16) {
        data["CIN/Passeport"] = document.getElementById('cin').value;
    }


    let html = '';
    for (const [label, value] of Object.entries(data)) {
        html += `
            <div class="summary-item">
                <span class="summary-label">${label}</span>
                <span class="summary-value">${value}</span>
            </div>
        `;
    }

    summaryContent.innerHTML = html;
}

// === Gestion des boutons de navigation ===
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-next') || e.target.closest('.btn-next')) {
        e.preventDefault();
        nextStep();
    }

    if (e.target.classList.contains('btn-prev') || e.target.closest('.btn-prev')) {
        e.preventDefault();
        prevStep();
    }
});

// === Soumission du formulaire ===
if (form) {
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!validateCurrentStep()) {
            return;
        }

        const allergiesInput = document.getElementById('allergies').value;
        const allergies = allergiesInput ? allergiesInput.split(',').map(a => a.trim()) : [];

        const cinValue = document.getElementById('cin').value.toUpperCase();


        const formData = {
            nom: document.getElementById('nom').value.toUpperCase(),
            prenom: document.getElementById('prenom').value,
            date_naissance: document.getElementById('dateNaissance').value,
            sexe: document.getElementById('sexe').value,
            adresse: document.getElementById('adresse').value,
            code_postal: document.getElementById('codePostal').value,
            ville: document.getElementById('ville').value,
            email: document.getElementById('email').value,
            telephone: iti ? iti.getNumber() : document.getElementById('phone').value,
            cin: cinValue || null,
            numero_secu: document.getElementById('numeroSecu').value || null,
            mutuelle: document.getElementById('mutuelle').value || null,
            allergies: allergies,
            groupe_sanguin: document.getElementById('groupeSanguin').value || null,
            code_pin: document.getElementById('pin').value
        };

        console.log('📤 Envoi:', formData);

        // Afficher le message "Envoi en cours..."
        const loadingMessage = document.createElement('div');
        loadingMessage.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div style="font-size: 50px; margin-bottom: 20px; animation: pulse 1.5s infinite;">⏳</div>
                <h2 style="color: #333; margin-bottom: 15px;">Envoi en cours...</h2>
                <p style="color: #666; font-size: 16px;">Création de votre compte et envoi de l'email de vérification</p>
                <div style="margin-top: 30px;">
                    <div style="width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            </style>
        `;
        authCard.innerHTML = '';
        authCard.appendChild(loadingMessage);
        authCard.style.display = 'block';

        try {
            const response = await fetch(`${API_URL}/auth/register/patient`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            console.log('📥 Réponse:', result);

            if (result.success) {
                // Afficher le message de vérification email (sans le numéro de carte)
                const verificationMessage = document.createElement('div');
                verificationMessage.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <div style="font-size: 60px; margin-bottom: 20px;">📧</div>
                        <h2 style="color: #4CAF50; margin-bottom: 15px;">✓ Inscription réussie!</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Vérifiez votre email:<br>
                            <strong style="color: #667eea;">${result.data.email}</strong>
                        </p>
                        <div style="background: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: left;">
                            <p style="color: #333; margin-bottom: 10px;"><strong>⏱️ En attente de vérification email:</strong></p>
                            <ol style="color: #666; margin-left: 20px; line-height: 1.8;">
                                <li>Consultez votre <strong>boîte de réception</strong> (vérifiez aussi les <strong>spams</strong>)</li>
                                <li>Ouvrez l'email de <strong>CareTrack</strong></li>
                                <li>Cliquez sur le bouton <strong>"Confirmer mon email"</strong></li>
                                <li>Après confirmation, vous recevrez votre <strong>numéro de carte RFID</strong></li>
                            </ol>
                        </div>
                    </div>
                `;
                authCard.innerHTML = '';
                authCard.appendChild(verificationMessage);
                authCard.style.display = 'block';

                // Pas de redirection automatique - l'utilisateur ferme le navigateur ou va vérifier son email
            } else {
                // Afficher un message d'erreur en haut du formulaire
                const errorAlert = document.createElement('div');
                errorAlert.innerHTML = `
                    <div style="background: #ffebee; border: 2px solid #f44336; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                        <p style="color: #f44336; font-size: 16px; font-weight: bold; margin: 0;">
                            ❌ ${result.message || 'Une erreur est survenue lors de votre inscription'}
                        </p>
                    </div>
                `;
                // Restaurer le formulaire avec le message d'erreur
                authCard.innerHTML = '';
                authCard.appendChild(errorAlert);
                authCard.appendChild(form);
                // Scroller vers le haut pour voir l'erreur
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error('❌ Erreur:', error);
            // Afficher un message d'erreur serveur plus beau
            const serverErrorMessage = document.createElement('div');
            serverErrorMessage.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <div style="font-size: 60px; margin-bottom: 20px;">🔌</div>
                    <h2 style="color: #f44336; margin-bottom: 15px;">Erreur de connexion</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Impossible de se connecter au serveur CareTrack
                    </p>
                    <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left;">
                        <p style="color: #333; margin-bottom: 10px;"><strong>Vérifiez:</strong></p>
                        <ul style="color: #666; margin-left: 20px; line-height: 1.8;">
                            <li>Le serveur backend est lancé sur le port 5000</li>
                            <li>Votre connexion Internet est active</li>
                            <li>L'URL du serveur est correcte</li>
                        </ul>
                    </div>
                    <button onclick="location.reload()" style="background: #667eea; color: white; padding: 12px 30px; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 16px;">
                        Réessayer
                    </button>
                </div>
            `;
            authCard.innerHTML = '';
            authCard.appendChild(serverErrorMessage);
            authCard.style.display = 'block';
        }
    });
}