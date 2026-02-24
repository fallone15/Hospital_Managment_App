# 🎨 Guide d'Adaptation du Frontend

Ce guide explique comment adapter votre frontend HTML/JS pour utiliser la nouvelle API.

## 📝 Modifications du Formulaire d'Inscription

### Dans register.html

Ajoutez ces nouveaux champs au formulaire :

```html
<div class="form-group">
    <label>Code Postal</label>
    <input type="text" name="code_postal" id="codePostal" required>
</div>

<div class="form-group">
    <label>Ville</label>
    <input type="text" name="ville" id="ville" required>
</div>

<div class="form-group">
    <label>Numéro de Sécurité Sociale</label>
    <input type="text" name="numero_secu" id="numeroSecu" 
           placeholder="2 85 03 75 123 456 78" required>
</div>

<div class="form-group">
    <label>Mutuelle</label>
    <input type="text" name="mutuelle" id="mutuelle" 
           placeholder="MGEN, Harmonie Mutuelle..." required>
</div>

<div class="form-group">
    <label>Groupe Sanguin</label>
    <select name="groupe_sanguin" id="groupeSanguin">
        <option value="">Sélectionner</option>
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
    </select>
</div>

<div class="form-group">
    <label>Allergies (séparer par des virgules)</label>
    <input type="text" name="allergies" id="allergies" 
           placeholder="Pénicilline, Aspirine...">
</div>
```

### Dans script.js - Fonction d'inscription

```javascript
form.addEventListener("submit", async function(e) {
    e.preventDefault();

    if (!validateForm(form)) {
        alert("Merci de remplir correctement tous les champs !");
        return;
    }

    // Préparer les allergies sous forme de tableau
    const allergiesInput = document.getElementById('allergies').value;
    const allergies = allergiesInput 
        ? allergiesInput.split(',').map(a => a.trim()) 
        : [];

    // Préparer les données
    const formData = {
        nom: document.getElementById('nom').value.toUpperCase(),
        prenom: document.getElementById('prenom').value,
        date_naissance: document.getElementById('dateNaissance').value,
        sexe: document.getElementById('sexe').value,
        adresse: document.getElementById('adresse').value,
        code_postal: document.getElementById('codePostal').value,
        ville: document.getElementById('ville').value,
        email: document.getElementById('email').value,
        telephone: iti.getNumber(), // Numéro complet international
        numero_secu: document.getElementById('numeroSecu').value,
        mutuelle: document.getElementById('mutuelle').value,
        allergies: allergies,
        groupe_sanguin: document.getElementById('groupeSanguin').value,
        code_pin: document.getElementById('pin').value
    };

    try {
        const response = await fetch('http://localhost:5000/api/auth/register/patient', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            // Sauvegarder le token
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('carte_rfid', result.data.patient.carte_rfid);
            
            // Afficher le numéro de carte RFID
            cardNumberSpan.textContent = result.data.patient.carte_rfid;

            // Masquer le formulaire et afficher le succès
            form.parentElement.style.display = "none";
            successBox.classList.remove("hidden");

            // Redirection
            setTimeout(() => {
                window.location.href = "login.html";
            }, 5000);
        } else {
            alert("Erreur : " + result.message);
        }
    } catch (error) {
        alert("Erreur de connexion au serveur");
        console.error(error);
    }
});
```

## 🔐 Modifications de la Connexion

### Dans login.html

Simplifiez le formulaire (la carte RFID ou l'email peut être utilisé):

```html
<form class="auth-form" id="loginForm">
    <div class="form-group">
        <label>Email ou Carte RFID</label>
        <input type="text" name="identifier" id="identifier" 
               placeholder="Email ou carte (ex: PAT001)" required>
    </div>

    <div class="form-group">
        <label>Code PIN (4 chiffres)</label>
        <input type="password" name="pin" id="pin" 
               maxlength="4" pattern="[0-9]{4}" required>
    </div>

    <button type="submit" class="btn btn-primary btn-block">
        <i class="fas fa-sign-in-alt"></i> Se connecter
    </button>
</form>
```

### Dans script.js - Fonction de connexion

```javascript
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const identifier = document.getElementById('identifier').value;
    const code_pin = document.getElementById('pin').value;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login/patient', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier, code_pin })
        });

        const result = await response.json();

        if (result.success) {
            // Sauvegarder les données
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.patient));
            localStorage.setItem('carte_rfid', result.data.patient.carte_rfid);

            // Redirection vers le dashboard
            window.location.href = 'dashboard.html';
        } else {
            alert('Identifiants incorrects');
        }
    } catch (error) {
        alert('Erreur de connexion');
        console.error(error);
    }
});
```

## 🏥 Créer une Page de Consultation

### consultation.html

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Nouvelle Consultation - Fakhsash</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Prendre un Rendez-vous</h1>

        <!-- Liste des services -->
        <div id="servicesContainer">
            <h2>Choisissez un service</h2>
            <div id="servicesList" class="services-grid"></div>
        </div>

        <!-- Formulaire de motif -->
        <div id="motifForm" style="display:none;">
            <h2>Motif de la consultation</h2>
            <form id="consultationForm">
                <input type="hidden" id="selectedService">
                
                <div class="form-group">
                    <label>Décrivez vos symptômes ou le motif de votre visite</label>
                    <textarea id="motif" rows="5" required 
                              placeholder="Ex: Douleurs abdominales depuis 2 jours..."></textarea>
                </div>

                <button type="submit" class="btn btn-primary">
                    Confirmer la prise de rendez-vous
                </button>
            </form>
        </div>

        <!-- Confirmation -->
        <div id="confirmation" style="display:none;">
            <div class="success-box">
                <h2>✅ Consultation enregistrée</h2>
                <div class="ticket">
                    <h3>Votre numéro de file :</h3>
                    <div class="numero-file" id="numeroFile"></div>
                </div>
                <p id="serviceInfo"></p>
                <p>Veuillez vous présenter à l'accueil avec votre carte RFID</p>
                <button class="btn" onclick="window.location.href='dashboard.html'">
                    Retour au tableau de bord
                </button>
            </div>
        </div>
    </div>

    <script src="consultation.js"></script>
</body>
</html>
```

### consultation.js

```javascript
const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

// Charger les services
async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/consultations/services`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            displayServices(result.data);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement des services');
    }
}

// Afficher les services
function displayServices(services) {
    const container = document.getElementById('servicesList');
    container.innerHTML = '';

    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.innerHTML = `
            <h3>${service.nom}</h3>
            <p>${service.description}</p>
            <div class="service-details">
                <span class="tarif">${service.tarif} €</span>
                <span class="duree">${service.duree_moyenne} min</span>
            </div>
        `;
        card.onclick = () => selectService(service);
        container.appendChild(card);
    });
}

// Sélectionner un service
function selectService(service) {
    document.getElementById('selectedService').value = service.id_service;
    document.getElementById('servicesContainer').style.display = 'none';
    document.getElementById('motifForm').style.display = 'block';
}

// Soumettre la consultation
document.getElementById('consultationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        id_service: parseInt(document.getElementById('selectedService').value),
        motif: document.getElementById('motif').value
    };

    try {
        const response = await fetch(`${API_URL}/consultations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            // Afficher la confirmation
            document.getElementById('numeroFile').textContent = result.data.numero_file;
            document.getElementById('serviceInfo').textContent = 
                `Service: ${result.data.service.nom} - Tarif: ${result.data.service.tarif}€`;
            
            document.getElementById('motifForm').style.display = 'none';
            document.getElementById('confirmation').style.display = 'block';
        } else {
            alert('Erreur: ' + result.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la création de la consultation');
    }
});

// Charger au démarrage
loadServices();
```

## 📋 Voir Mes Consultations

### mes-consultations.html

```html
<div class="consultations-list" id="consultationsList"></div>

<script>
async function loadMyConsultations() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:5000/api/consultations/patient', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            displayConsultations(result.data);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

function displayConsultations(consultations) {
    const container = document.getElementById('consultationsList');
    container.innerHTML = '';

    consultations.forEach(consultation => {
        const card = document.createElement('div');
        card.className = 'consultation-card';
        card.innerHTML = `
            <div class="consultation-header">
                <span class="numero">${consultation.numero_file}</span>
                <span class="statut ${consultation.statut}">${consultation.statut}</span>
            </div>
            <div class="consultation-body">
                <p><strong>Service:</strong> ${consultation.service_nom}</p>
                <p><strong>Date:</strong> ${new Date(consultation.heure_arrivee).toLocaleString()}</p>
                ${consultation.medecin_nom ? 
                    `<p><strong>Médecin:</strong> Dr. ${consultation.medecin_nom}</p>` : ''}
                ${consultation.numero_salle ? 
                    `<p><strong>Salle:</strong> ${consultation.numero_salle} - Bât. ${consultation.batiment}</p>` : ''}
                <p><strong>Motif:</strong> ${consultation.motif}</p>
            </div>
            ${consultation.statut === 'en_attente' ? 
                `<button onclick="cancelConsultation(${consultation.id_consultation})" class="btn btn-danger">
                    Annuler
                </button>` : ''}
        `;
        container.appendChild(card);
    });
}

async function cancelConsultation(id) {
    if (!confirm('Voulez-vous vraiment annuler cette consultation ?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:5000/api/consultations/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            alert('Consultation annulée');
            loadMyConsultations(); // Recharger
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'annulation');
    }
}

loadMyConsultations();
</script>
```

## 🎨 CSS Suggestions

```css
.service-card {
    border: 1px solid #ddd;
    padding: 20px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.service-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
}

.numero-file {
    font-size: 48px;
    font-weight: bold;
    color: var(--primary);
    text-align: center;
    padding: 30px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 20px 0;
}

.consultation-card {
    border: 1px solid #ddd;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 8px;
}

.statut {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
}

.statut.en_attente {
    background: #ffc107;
    color: white;
}

.statut.en_cours {
    background: #17a2b8;
    color: white;
}

.statut.terminee {
    background: #28a745;
    color: white;
}

.statut.annulee {
    background: #dc3545;
    color: white;
}
```

## ✅ Checklist de Migration

- [ ] Mettre à jour register.html avec les nouveaux champs
- [ ] Adapter le script.js pour l'inscription
- [ ] Simplifier login.html
- [ ] Créer consultation.html et consultation.js
- [ ] Créer mes-consultations.html
- [ ] Ajouter le CSS pour les nouveaux éléments
- [ ] Tester l'inscription complète
- [ ] Tester la connexion
- [ ] Tester la création de consultation
- [ ] Tester la visualisation des consultations

---

Votre frontend est maintenant prêt à communiquer avec la nouvelle API ! 🎉
