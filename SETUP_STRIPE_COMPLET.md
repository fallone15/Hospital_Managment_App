# 🚀 SETUP COMPLET - Stripe Paiement RDV

## ⚡ Setup en 10 minutes

### ÉTAPE 1: Créer un compte Stripe gratuit (5 min)

```bash
1. Allez sur: https://dashboard.stripe.com/register
2. Remplissez le formulaire:
   - Email: votre-email@gmail.com
   - Mot de passe: sécurisé
   - Pays: France (ou n'importe quel pays supporté par Stripe)
3. Vérifiez votre email
4. Acceptez les conditions
```

### ÉTAPE 2: Obtenir les clés de test (2 min)

```bash
1. Connectez-vous à Stripe
2. En haut à droite: "Test mode" doit être ACTIVÉ (toggle bleu)
3. Allez sur: Settings → API Keys
4. Cherchez:
   ✅ Publishable Key (pk_test_...)
   ✅ Secret Key (sk_test_...)
5. Copiez les deux clés
```

### ÉTAPE 3: Mettre à jour le fichier .env (1 min)

```bash
# Ouvrir: Back_end/.env
# Remplacer les valeurs existantes:

STRIPE_SECRET_KEY=sk_test_51Pu9rv...     ← COLLEZ VOTRE CLÉ SECRET
STRIPE_PUBLISHABLE_KEY=pk_test_51Pu9rv...  ← COLLEZ VOTRE CLÉ PUBLIQUE
```

### ÉTAPE 4: Redémarrer le serveur (1 min)

```bash
cd Back_end
npm start
# Vous devriez voir: "Server running on port 5000"
# Pas d'erreurs Stripe!
```

### ÉTAPE 5: Tester le flux (1 min)

```bash
# Ouvrir dans le navigateur:
http://localhost:5000/appointment-booking-with-payment.html

# Ou créer un RDV:
1. Sélectionner un médecin
2. Choisir une date/heure
3. Ajouter un motif
4. Cliquer "Créer RDV et Payer"
5. Remplir avec: 4242 4242 4242 4242
6. Expiration: 12/25, CVC: 123
7. Cliquer "Payer maintenant"

✅ Succès!!
```

---

## 📁 Fichiers créés/modifiés

### ✨ Nouveaux fichiers

```
Front_end/
├── payment-checkout.html                 (Page de paiement Stripe)
└── appointment-booking-with-payment.html (Formulaire RDV avec paiement)

Back_end/
├── stripe-integration.js                 (Fonctions JavaScript)
├── STRIPE_INTEGRATION.md                 (Documentation complète)
├── QUICKSTART_STRIPE.md                  (Démarrage rapide)
└── STRIPE_TEST_CARDS.md                  (Cartes de test)

Root/
└── STRIPE_IMPLEMENTATION_SUMMARY.md      (Résumé complet)
```

### ✅ Fichiers modifiés

```
Back_end/
├── .env                                  (Clés Stripe)
├── controllers/rdvController.js          (Paiement obligatoire)
└── controllers/paiementController.js     (Confirmation paiement)
```

---

## 🧪 Cartes de test rapides

⚠️ **MODE TEST UNIQUEMENT - SIMULATION**

Ces cartes sont des **numéros fictifs** qui fonctionnent UNIQUEMENT en mode TEST Stripe pour simuler les paiements!

```
✅ SUCCÈS (Toujours utiliser pour tester):
   4242 4242 4242 4242
   Expiration: 12/25
   CVC: 123
   Résultat: Paiement simulé accepté ✅

❌ REFUSÉE (Pour tester les erreurs):
   4000 0000 0000 0002
   Expiration: 12/25
   CVC: 123
   Résultat: Paiement simulé refusé ❌
```

---

## 🔍 Vérifier que tout fonctionne

### 1. Vérifier la configuration

```bash
# Dans Back_end/.env, vérifier:
✅ STRIPE_SECRET_KEY commence par sk_test_
✅ STRIPE_PUBLISHABLE_KEY commence par pk_test_
✅ Les clés ne sont pas vides
```

### 2. Vérifier les fichiers

```bash
# Tous ces fichiers doivent exister:
✅ Front_end/payment-checkout.html
✅ Front_end/appointment-booking-with-payment.html
✅ Back_end/stripe-integration.js
✅ Back_end/STRIPE_INTEGRATION.md
```

### 3. Vérifier le serveur

```bash
# Vérifier que le serveur démarre sans erreur:
npm start

# Vous devriez voir:
✅ "Server running on port 5000"
✅ "Database connection successful" (ou similaire)
✅ AUCUNE erreur Stripe
```

### 4. Vérifier le frontend

```bash
# Accéder à:
http://localhost:5000/appointment-booking-with-payment.html

# Vérifier que:
✅ La page charge sans erreurs
✅ Les médecins sont visibles
✅ Les sélecteurs de date/heure fonctionnent
✅ Le prix s'affiche
```

---

## 💻 Code minimal pour intégrer

### Dans votre formulaire RDV existant

```html
<!-- Remplacer le bouton existant -->
<button onclick="window.location.href='appointment-booking-with-payment.html'">
  💳 Réserver et Payer
</button>
```

### Ou utiliser directement les fonctions

```javascript
// Importer les fonctions
<script src="/stripe-integration.js"></script>

<script>
// Au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  initializeStripePayment();
  setupAppointmentForm();
});

// Optionnel: Charger les données
function loadAppointmentData() {
  loadMedecins();
  loadFamilyMembers();
}
</script>
```

---

## 🚨 Erreurs courantes et solutions

### Erreur 1: "Cannot find module 'stripe'"

```
❌ Error: Cannot find module 'stripe'

✅ Solution:
cd Back_end
npm install stripe
npm start
```

### Erreur 2: "Invalid API Key provided"

```
❌ Error: Invalid API Key provided to Stripe()

✅ Solution:
1. Vérifier STRIPE_SECRET_KEY dans .env
2. S'assurer qu'elle commence par sk_test_
3. Pas d'espaces au début/fin
4. Redémarrer le serveur
```

### Erreur 3: Stripe is not defined (en frontend)

```
❌ Uncaught ReferenceError: Stripe is not defined

✅ Solution:
Vérifier que payment-checkout.html contient:
<script src="https://js.stripe.com/v3/"></script>
```

### Erreur 4: Paiement réussi mais RDV pas confirmé

```
❌ Paiement OK mais statut RDV = 'en_attente_paiement'

✅ Solution:
1. Attendre quelques secondes
2. Rafraîchir la page
3. Vérifier les logs du serveur
4. Vérifier la base de données directement
```

---

## 📊 Tester complètement

### Plan de test

```
1️⃣ Test de paiement réussi
   Carte: 4242 4242 4242 4242
   Résultat attendu: ✅ Paiement accepté + RDV confirmé

2️⃣ Test de paiement refusé
   Carte: 4000 0000 0000 0002
   Résultat attendu: ❌ Message d'erreur + RDV en attente

3️⃣ Test de différentes méthodes
   Carte: 5555 5555 5555 4444 (Mastercard)
   Résultat attendu: ✅ Succès avec Mastercard

4️⃣ Test du webhook (avancé)
   Configurer webhook dans Stripe
   Vérifier que le paiement est confirmé automatiquement
```

---

## 🔒 Mode Production (plus tard)

```bash
# Quand vous êtes prêt pour la production:

1. Obtenir les clés LIVE
   - Dans Stripe Dashboard, désactiver "Test mode"
   - Copier les clés pk_live_ et sk_live_

2. Mettre à jour .env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...

3. HTTPS obligatoire
   - Les clés LIVE ne fonctionnent qu'en HTTPS

4. Appliquer les tarifs réels
   - Changer les montants en fonction de votre politique
```

---

## 📞 Support

### Documentation

- **Stripe Docs:** https://stripe.com/docs
- **Cartes de test:** https://stripe.com/docs/testing
- **API Reference:** https://stripe.com/docs/api

### Nos guides

- `STRIPE_INTEGRATION.md` - Guide complet
- `QUICKSTART_STRIPE.md` - Démarrage rapide
- `STRIPE_TEST_CARDS.md` - Cartes de test

### Problèmes?

1. Vérifier les logs du serveur
2. Consulter les guides (fichiers .md)
3. Tester avec une carte de test
4. Vérifier sur Stripe Dashboard

---

## ✅ Checklist final

Avant d'utiliser en production:

- [ ] Clés Stripe configurées dans .env
- [ ] Serveur redémarré après modification .env
- [ ] Payment-checkout.html accessible
- [ ] Formulaire RDV fonctionne
- [ ] Paiement réussi avec 4242 4242 4242 4242
- [ ] RDV statut passé à 'confirme'
- [ ] Paiement refusé avec 4000 0000 0000 0002
- [ ] Message d'erreur affiché
- [ ] Redirection correcte après succès
- [ ] Base de données mise à jour
- [ ] Logs sans erreur en **MODE TEST** (SIMULATION):

✅ Un système de paiement simulé avec Stripe (cartes fictives)  
✅ Paiement obligatoire avant confirmation RDV (simulation)  
✅ Deux méthodes de paiement (Carte fictive + Virement)  
✅ Cartes de test simulées pour développement  
✅ Documentation complète  
✅ Code prêt à utiliser

⚠️ **IMPORTANT**: Aucun argent réel n'est débité en mode TEST avec les cartes fictives
✅ Un système de paiement sécurisé avec Stripe  
✅ Paiement obligatoire avant confirmation RDV  
✅ Deux méthodes de paiement (Carte + Virement)  
✅ Cartes de test pour développement  
✅ Documentation complète  
✅ Code prêt à utiliser

**Prochaines étapes optionnelles:**

- Configurer les webhooks
- Améliorer les notifications email
- Ajouter historique des paiements
- Passer en mode production

---

**Date:** Avril 2026  
**Status:** ✅ Prêt à l'emploi (MODE TEST)  
**Mode:** 🧪 TEST UNIQUEMENT - Simulation avec cartes fictives, aucun vrai paiement**Date:** Avril 2024  
**Status:** ✅ Prêt à l'emploi

Pour des questions, consultez les fichiers de documentation ou contactez le support Stripe.
