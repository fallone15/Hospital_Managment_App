// === Initialisation de intl-tel-input ===
const phoneInput = document.querySelector("#phone");
const iti = window.intlTelInput(phoneInput, {
    initialCountry: "ma", // Maroc par défaut
    preferredCountries: ["ma", "fr", "be", "dz", "tn"], // Pays prioritaires
    separateDialCode: true, // Afficher l'indicatif séparément
    utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.6/build/js/utils.js"
});

// === Formulaire et success box ===
const form = document.getElementById("registerForm");
const successBox = document.getElementById("successMessage");
const cardNumberSpan = document.getElementById("cardNumber");
const phoneError = document.getElementById("phoneError");

// === Validation email (doit finir par @gmail.com) ===
function validateEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
}

// === Validation simple pour tous les champs ===
function validateForm(form) {
    let valid = true;
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        if (input.id === 'phone') return; // On gère le téléphone séparément
        
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger)';
            valid = false;
        } else {
            input.style.borderColor = 'var(--primary)';
        }
    });

    // Email spécifique
    const emailInput = form.querySelector('input[type="email"]');
    if (emailInput && !validateEmail(emailInput.value.trim())) {
        emailInput.style.borderColor = 'var(--danger)';
        alert("L'email doit se terminer par @gmail.com");
        valid = false;
    }

    // Validation du téléphone avec intl-tel-input
    if (!iti.isValidNumber()) {
        phoneInput.style.borderColor = 'var(--danger)';
        if (phoneError) {
            phoneError.style.display = 'block';
        }
        valid = false;
    } else {
        phoneInput.style.borderColor = 'var(--primary)';
        if (phoneError) {
            phoneError.style.display = 'none';
        }
    }

    return valid;
}

// === Masquer l'erreur téléphone quand l'utilisateur tape ===
phoneInput.addEventListener('input', function() {
    if (iti.isValidNumber()) {
        phoneInput.style.borderColor = 'var(--primary)';
        if (phoneError) {
            phoneError.style.display = 'none';
        }
    }
});

// === Masquer l'erreur téléphone lors du changement de pays ===
phoneInput.addEventListener('countrychange', function() {
    if (phoneInput.value.trim() && iti.isValidNumber()) {
        phoneInput.style.borderColor = 'var(--primary)';
        if (phoneError) {
            phoneError.style.display = 'none';
        }
    }
});

// === Gestion du submit ===
form.addEventListener("submit", function(e) {
    e.preventDefault();

    if (!validateForm(form)) {
        alert("Merci de remplir correctement tous les champs !");
        return;
    }

    // Récupérer le numéro de téléphone complet au format international
    const fullPhoneNumber = iti.getNumber();
    
    // Récupérer les informations du pays
    const countryData = iti.getSelectedCountryData();
    
    // Vous pouvez stocker ces données
    console.log("Numéro complet:", fullPhoneNumber);
    console.log("Pays:", countryData.name);
    console.log("Code ISO:", countryData.iso2);
    console.log("Indicatif:", "+" + countryData.dialCode);

    // TODO: Envoyer les données au serveur ici
    // fetch('/api/register', {
    //     method: 'POST',
    //     body: JSON.stringify({
    //         nom: document.getElementById('nom').value,
    //         prenom: document.getElementById('prenom').value,
    //         telephone: fullPhoneNumber,
    //         ...
    //     })
    // });

    // Tout est valide → générer un numéro de carte
    const cardNumber = "FCZ" + Math.floor(100000 + Math.random() * 900000);
    cardNumberSpan.textContent = cardNumber;

    // Masquer le formulaire
    form.parentElement.style.display = "none";

    // Afficher le message succès
    successBox.classList.remove("hidden");

    // Redirection vers login
    setTimeout(() => {
        window.location.href = "login.html";
    }, 5000);
});

// === Auto-calcul de l'âge à partir de la date de naissance ===
const dateNaissanceInput = document.getElementById('dateNaissance');
const ageInput = document.getElementById('age');

if (dateNaissanceInput && ageInput) {
    dateNaissanceInput.addEventListener('change', function() {
        const birthDate = new Date(this.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        ageInput.value = age;
    });
}