# 🎯 Guide d'Intégration Stripe - Paiement RDV

⚠️ **MODE TEST - SIMULATION UNIQUEMENT**

Ce guide configure Stripe en **mode TEST** avec des cartes fictives pour simuler les paiements.  
Aucun argent réel n'est débité. Idéal pour faire du développement et des tests.

---

Ce guide vous explique comment intégrer Stripe pour les paiements de rendez-vous médicaux.

## 📋 Table des matières

1. [Configuration initiale](#configuration-initiale)
2. [Obtenir les clés Stripe](#obtenir-les-clés-stripe)
3. [Architecture de paiement](#architecture-de-paiement)
4. [Workflow du paiement](#workflow-du-paiement)
5. [Cartes de test](#cartes-de-test)
6. [Déploiement en production](#déploiement-en-production)

---

## 🔧 Configuration initiale

### 1. Installation des dépendances

```bash
npm install stripe
# Déjà inclus dans le package.json
```

### 2. Variables d'environnement (.env)

```env
# Mode TEST (Développement)
STRIPE_SECRET_KEY=sk_test_REDACTED
STRIPE_PUBLISHABLE_KEY=pk_test_REDACTED
STRIPE_WEBHOOK_SECRET=whsec_test_... (optionnel pour webhooks)
```

### 3. Structure de la base de données

La table `paiements` doit avoir la colonne:

```sql
stripe_payment_id VARCHAR(255) -- ID du PaymentIntent Stripe
```

---

## 🔐 Obtenir les clés Stripe

### Créer un compte Stripe gratuit

1. Allez sur [stripe.com](https://stripe.com)
2. Cliquez sur "Sign Up"
3. Remplissez le formulaire (email, mot de passe, pays, etc.)
4. Vérifiez votre adresse email

### Obtenir les clés de test

1. Connectez-vous à votre tableau de bord Stripe
2. Allez sur **Settings** → **API Keys**
3. Assurez-vous que **Test mode** est activé (toggle en haut à droite)
4. Copiez les clés:
   - **Publishable Key** (pk*test*...)
   - **Secret Key** (sk*test*...)

### Exemple de clés TEST (NE JAMAIS utiliser en production)

```
Publishable Key: pk_test_REDACTED
Secret Key:      sk_test_REDACTED
```

---

## 🏗️ Architecture de paiement

### Flux de paiement intégré

```
Patient
   ↓
[1] Sélectionne rendez-vous
   ↓
[2] Crée RDV (statut: en_attente_paiement)
   ↓
[3] Redirige vers payment-checkout.html
   ↓
[4] Remplit formulaire Stripe
   ↓
[5] Envoie au backend via /api/paiements (POST)
   ↓
[6] Backend crée PaymentIntent Stripe
   ↓
[7] Frontend confirme paiement avec confirmCardPayment
   ↓
[8] Envoie au backend /api/paiements/confirm (POST)
   ↓
[9] Webhook Stripe confirme (optionnel)
   ↓
[10] RDV statut → 'confirme'
```

---

## 📊 Workflow du paiement

### Phase 1: Création du RDV (avec paiement requis)

**Endpoint:** `POST /api/rdv`

```javascript
// Request
{
  "medecin_id": 1,
  "date_rdv": "2024-04-15",
  "heure_rdv": "10:30",
  "motif": "Consultation générale",
  "id_member": null
}

// Response
{
  "success": true,
  "message": "Rendez-vous créé. Veuillez procéder au paiement pour confirmer.",
  "data": {
    "rendez_vous": {
      "id": 123,
      "patient_id": 5,
      "medecin_id": 1,
      "date_rdv": "2024-04-15",
      "heure_rdv": "10:30",
      "statut": "en_attente_paiement"
    },
    "paiement_requis": {
      "montant": 250,
      "devise": "MAD",
      "description": "Consultation avec Dr. Ahmed Al-Mansouri (Cardiologie)",
      "medecin": {
        "nom": "Al-Mansouri",
        "prenom": "Ahmed",
        "specialite": "Cardiologie"
      }
    }
  }
}
```

### Phase 2: Créer un PaymentIntent Stripe

**Endpoint:** `POST /api/paiements`

```javascript
// Request
{
  "montant": 250,
  "methode_paiement": "stripe",
  "rendez_vous_id": 123,
  "description": "Consultation avec Dr. Ahmed Al-Mansouri"
}

// Response
{
  "success": true,
  "message": "Paiement créé avec succès",
  "data": {
    "paiement": {
      "id": 456,
      "patient_id": 5,
      "rendez_vous_id": 123,
      "montant": 250,
      "statut": "en_attente",
      "stripe_payment_id": "pi_1234567890abcdefg"
    },
    "clientSecret": "pi_1234567890abcdefg_secret_xyzabc123"
  }
}
```

### Phase 3: Confirmer le paiement et activer le RDV

**Endpoint:** `POST /api/paiements/confirm`

```javascript
// Request
{
  "payment_intent_id": "pi_1234567890abcdefg"
}

// Response
{
  "success": true,
  "message": "Paiement confirmé et rendez-vous activé",
  "data": {
    "paiement": {
      "id": 456,
      "statut": "confirme",
      "date_paiement": "2024-04-10T15:30:00Z"
    },
    "rendez_vous": {
      "id": 123,
      "statut": "confirme"
    }
  }
}
```

---

## 🧪 Cartes de test

### Cartes de test Stripe (Mode TEST uniquement)

| Cas de test  | Numéro              | Expiration | CVC  | Résultat            |
| ------------ | ------------------- | ---------- | ---- | ------------------- |
| ✅ Succès    | 4242 4242 4242 4242 | 12/25      | 123  | Paiement accepté    |
| ❌ Décliné   | 4000 0000 0000 0002 | 12/25      | 123  | Paiement refusé     |
| ⚠️ Expirée   | 4000 0000 0000 0069 | 12/22      | 123  | Carte expirée       |
| 🔐 3D Secure | 4000 2500 3010 4010 | 12/25      | 123  | Authentification 3D |
| 💳 Amex      | 378282246310005     | 12/25      | 1234 | Succès amex         |

**⚠️ IMPORTANT:** Ces numéros fonctionnent UNIQUEMENT en mode TEST avec la clé `pk_test_...`

---

## 💻 Implémentation Frontend

### Page de paiement (payment-checkout.html)

La page `Front_end/payment-checkout.html` inclut:

- ✅ Formulaire Stripe intégré (Elements)
- ✅ Affichage des détails du RDV
- ✅ Deux méthodes de paiement (Stripe & Virement)
- ✅ Cartes de test Stripe visibles
- ✅ Gestion des erreurs
- ✅ Messages de confirmation

### Variables de session requises

Avant de rediriger vers `payment-checkout.html`, stockez:

```javascript
// Dans votre formulaire de RDV (dashboard.html ou similar)
sessionStorage.setItem(
  "appointmentData",
  JSON.stringify({
    id: rdvResponse.data.rendez_vous.id,
    medecin_nom: "Al-Mansouri",
    medecin_prenom: "Ahmed",
    date_rdv: "2024-04-15",
    heure_rdv: "10:30",
    service_nom: "Cardiologie",
    montant: 250,
    patient_nom: "Dupont",
    patient_email: "patient@example.com",
  }),
);

// Rediriger vers le paiement
window.location.href = "payment-checkout.html";
```

---

## 🔌 Webhooks Stripe (Avancé)

### Configurer un webhook pour l'authentification

1. Allez sur **Developers** → **Webhooks**
2. Cliquez sur **Add endpoint**
3. URL: `https://votre-domaine.com/api/paiements/webhook`
4. Événements à sélectionner:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### Récupérer le secret du webhook

Dans **Developers** → **Webhooks**, copiez le **Signing Secret**:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🚀 Déploiement en production

### Étape 1: Obtenir les clés LIVE

1. Dans le tableau de bord Stripe, désactivez **Test mode**
2. Allez sur **Settings** → **API Keys**
3. Copiez les clés LIVE:
   - `pk_live_...`
   - `sk_live_...`

### Étape 2: Mettre à jour les variables d'environnement

```env
# Production .env
STRIPE_SECRET_KEY=sk_live_votre_vraie_cle_live
STRIPE_PUBLISHABLE_KEY=pk_live_votre_vraie_cle_publique_live
STRIPE_WEBHOOK_SECRET=whsec_live_...
```

### Étape 3: Activer 3D Secure (recommandé)

1. Allez sur **Settings** → **Payment methods**
2. Activez **3D Secure** pour tous les paiements

### Étape 4: SSL/HTTPS obligatoire

- Tous les paiements DOIVENT être sur HTTPS
- Les clés LIVE ne fonctionnent qu'en HTTPS

---

## 🐛 Dépannage

### Erreur: "Invalid API Key"

- Vérifiez que vous utilisez la bonne clé (sk*test* ou sk*live*)
- Vérifiez que les clés sont dans le fichier `.env`

### Erreur: "Card declined"

- Utilisez une carte de test qui accepte les paiements
- Vérifiez qu'elle est au format correct

### Webhook non reçu

- Vérifiez l'URL du webhook dans le tableau de bord Stripe
- Vérifiez que le serveur est accessible publiquement
- Vérifiez les logs dans **Events** dans Stripe

### Paiement réussi mais RDV pas confirmé

- Le paiement a réussi mais la confirmation était lente
- Attendez 5 secondes et rafraîchissez la page
- Vérifiez la base de données directement

---

## 📞 Support Stripe

- **Documentation:** https://stripe.com/docs
- **Discussion:** https://support.stripe.com
- **Statut du service:** https://status.stripe.com

---

## ✅ Checklist de déploiement

- [ ] Clés Stripe générées et testées
- [ ] `.env` mis à jour avec les clés
- [ ] Page `payment-checkout.html` déployée
- [ ] Backend et frontend en HTTPS
- [ ] Webhooks configurés (optionnel)
- [ ] Cartes de test testées en mode TEST
- [ ] Paiement real avec cartes LIVE en production
- [ ] Notifications email configurées après paiement
- [ ] Logs Stripe vérifiés

---

**Version:** 1.0  
**Dernière mise à jour:** Avril 2024  
**Auteur:** Système Hôpital Fakhsash
