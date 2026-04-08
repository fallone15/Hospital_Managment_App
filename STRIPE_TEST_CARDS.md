# 🧪 Guide des cartes de test Stripe

⚠️ **IMPORTANT: MODE TEST UNIQUEMENT - SIMULATION**

❌ Aucune vraie carte bancaire n'est utilisée  
❌ Aucun argent réel n'est débité  
✅ Ces cartes sont des **numéros fictifs** pour tester en développement  
✅ Fonctionnent UNIQUEMENT avec les clés `sk_test_` et `pk_test_`

---

## 📋 Table des cartes de test

### ✅ Cartes acceptées (mode TEST)

| N° de Carte           | Type             | Statut      | Paramètres            |
| --------------------- | ---------------- | ----------- | --------------------- |
| `4242 4242 4242 4242` | Visa             | ✅ Acceptée | Exp: 12/25, CVC: 123  |
| `4111 1111 1111 1111` | Visa             | ✅ Acceptée | Exp: 12/25, CVC: 123  |
| `5555 5555 5555 4444` | Mastercard       | ✅ Acceptée | Exp: 12/25, CVC: 123  |
| `2223 0031 2000 3222` | Mastercard       | ✅ Acceptée | Exp: 12/25, CVC: 123  |
| `5200 0282 5928 7846` | Mastercard       | ✅ Acceptée | Exp: 12/25, CVC: 123  |
| `378282246310005`     | American Express | ✅ Acceptée | Exp: 12/25, CVC: 1234 |
| `371449635398431`     | American Express | ✅ Acceptée | Exp: 12/25, CVC: 1234 |
| `3714 496353 98431`   | American Express | ✅ Acceptée | Exp: 12/25, CVC: 1234 |
| `6011 1111 1111 1117` | Discover         | ✅ Acceptée | Exp: 12/25, CVC: 123  |
| `6011 0009 9013 9424` | Discover         | ✅ Acceptée | Exp: 12/25, CVC: 123  |

### ❌ Cartes refusées (mode TEST)

| N° de Carte           | Type             | Statut     | Raison              |
| --------------------- | ---------------- | ---------- | ------------------- |
| `4000 0000 0000 0002` | Visa             | ❌ Refusée | Paiement décliné    |
| `5555 5555 5555 2020` | Mastercard       | ❌ Refusée | Autres déclinaisons |
| `3782 822463 10005`   | American Express | ❌ Refusée | Paiement décliné    |

### ⚠️ Cartes avec erreurs (mode TEST)

| N° de Carte           | Type | Erreur       | Utilisation              |
| --------------------- | ---- | ------------ | ------------------------ |
| `4000 0000 0000 0069` | Visa | ⚠️ Expirée   | Tester expiration        |
| `4000 0000 0000 0127` | Visa | 🔐 3D Secure | Tester authentification  |
| `4000 0000 0000 3220` | Visa | 🔐 3D Secure | Authentification requise |

---

## 🎯 Scénarios de test

### 1️⃣ Test de paiement réussi

```
Scénario: Patient paie avec succès une consultation
Carte: 4242 4242 4242 4242
Montant: 250 MAD
Résultat: ✅ Paiement accepté
Vérifier: RDV statut passé à 'confirme'
```

### 2️⃣ Test de paiement refusé

```
Scénario: Carte déclinée par la banque
Carte: 4000 0000 0000 0002
Montant: 250 MAD
Résultat: ❌ Paiement refusé
Vérifier: RDV reste en statut 'en_attente_paiement'
          Patient peut réessayer
```

### 3️⃣ Test de carte expirée

```
Scénario: Client utilise une carte expirée
Carte: 4000 0000 0000 0069
Montant: 250 MAD
Résultat: ⚠️ Erreur carte expirée
Vérifier: Message d'erreur clair affiché
          Patient peut réessayer avec autre carte
```

### 4️⃣ Test de différentes marques

```
Visas:
- 4242 4242 4242 4242 → Succès standard
- 4111 1111 1111 1111 → Alternative Visa

Mastercards:
- 5555 5555 5555 4444 → Succès standard
- 2223 0031 2000 3222 → Alternative Mastercard

American Express:
- 378282246310005 → Succès (CVC: 4 chiffres)
```

---

## 👥 Informations à utiliser

### Données de test valides

```
Nom du titulaire: Test User (ou n'importe quel nom)
Email: test@example.com (ou test+stripe@example.com)
Pays: France (ou n'importe quel pays)
Adresse: 123 Test Street, Paris, 75000, France
Code postal: 75000
```

### Dates de test

```
Date d'expiration: 12/25 (ou toute date future)
Date du paiement: Aujourd'hui (le système utilise la date actuelle)
Date du RDV: N'importe quelle date future
```

### Montants de test

```
✅ 250 MAD (montant standard consultation)
✅ 300 MAD (consultation spécialisant)
✅ 100 MAD (montant minimum)
✅ 1000 MAD (montant maximum)

Tous les montants < 5000 MAD fonctionnent en mode TEST
```

---

## 💳 Utilisation dans le formulaire

### Screenshot du formulaire de paiement

```
┌────────────────────────────────────────┐
│  💳 Paiement Sécurisé               │
├────────────────────────────────────────┤
│ 👨‍⚕️ Médecin: Dr. Ahmed Al-Mansouri  │
│ 📅 Date: lundi 15 avril 2024         │
│ 🕐 Heure: 10:30                      │
│ 💰 Montant: 250 MAD                  │
├────────────────────────────────────────┤
│                                        │
│ Numéro de carte:                       │
│ │ 4242 4242 4242 4242                 │
│                                        │
│ Expiration: │ 12 / 25                 │
│ CVC:        │ 123                     │
│                                        │
│ [💳 Payer maintenant]                 │
└────────────────────────────────────────┘
```

### Remplissage de test

```javascript
// Dans la console du navigateur (F12):

// 1. Ouvrir payment-checkout.html
http://localhost:5000/payment-checkout.html

// 2. Remplir les données
Numéro: 4242 4242 4242 4242
Expiration: 12/25
CVC: 123
Nom: John Doe
Email: test@example.com

// 3. Cliquer sur "Payer maintenant"
// 4. Le paiement devrait réussir en 2-3 secondes
```

---

## 📊 Vérifier les paiements

### Dans votre application Vue

```javascript
// Ouvrir le Developer Tools (F12)
// Allez dans l'onglet Network
// Vous devriez voir:

POST /api/paiements
Response: {
  "success": true,
  "data": {
    "paiement": {
      "id": 456,
      "statut": "en_attente",
      "stripe_payment_id": "pi_1234567890"
    }
  }
}

POST /api/paiements/confirm
Response: {
  "success": true,
  "data": {
    "rendez_vous": {
      "id": 123,
      "statut": "confirme"
    }
  }
}
```

### Dans le tableau de bord Stripe

```
1. Allez sur https://dashboard.stripe.com
2. Cliquez sur "Payments" (à gauche)
3. Vous verrez tous les paiements de test:

   Payment ID: pi_1234567890abcdefg
   Amount: 250 MAD
   Status: Succeeded
   Customer: test@example.com
   Date: Apr 10, 2024

4. Cliquez sur le paiement pour voir les détails
```

---

## 🔄 Tester différents scénarios

### Scénario 1: Paiement complet réussi

```bash
1. Ouvrir appointment-booking-with-payment.html
2. Sélectionner: Médecin, Date, Heure, Motif
3. Cliquer "Créer RDV et Payer"
4. Remplir avec: 4242 4242 4242 4242
5. Cliquer "Payer maintenant"
✅ Résultat: Paiement réussi + RDV confirmé
```

### Scénario 2: Paiement refusé

```bash
1. Même étapes, mais avec: 4000 0000 0000 0002
2. Cliquer "Payer maintenant"
❌ Résultat: Message d'erreur "Carte refusée"
             Patient peut réessayer
             RDV reste en attente de paiement
```

### Scénario 3: Essai de stripe avec webhook

```bash
1. Configurer un webhook Stripe
2. Faire un paiement
3. Stripe enverra un événement au webhook
4. Le paiement sera confirmé automatiquement
```

---

## 🚨 Troubleshooting

### Erreur: "Invalid API Key provided"

```
Cause: Clés Stripe non configurées dans .env
Solution: Vérifiez que STRIPE_SECRET_KEY et STRIPE_PUBLISHABLE_KEY
          sont configurées dans Back_end/.env
```

### Erreur: "No API key provided"

```
Cause: STRIPE_SECRET_KEY manquante ou vide
Solution:
STRIPE_SECRET_KEY=sk_test_51Pu9rvFi0n4...
Ne pas oublier de redémarrer le serveur
```

### Erreur: "Stripe is not defined"

```
Cause: Stripe.js (v3) n'est pas chargé
Solution: Vérifier que payment-checkout.html contient:
<script src="https://js.stripe.com/v3/"></script>
```

### Paiement réussi mais RDV pas confirmé

```
Cause: Webhook non configuré ou retard réseau
Solution:
1. Attendre 5 secondes et rafraîchir
2. Vérifier la base de données directement
3. Configurer le webhook Stripe
```

---

## 📱 Tests mobiles

### Sur un téléphone

```
1. Accéder à: http://[votre-ip]:5000
   (remplacer [votre-ip] par l'IP de votre machine)

2. Utilisez une carte de test:
   4242 4242 4242 4242

3. Testez le responsive design
   - Portrait et Landscape
   - Petit écran et grand écran
```

---

## 📋 Checklist complète de test

### Configuration

- [ ] Clés Stripe dans .env
- [ ] Serveur Node.js redémarré
- [ ] CORS activé
- [ ] Base de données connectée

### Paiements

- [ ] Test avec 4242 4242 4242 4242 → Succès
- [ ] Test avec 4000 0000 0000 0002 → Refusée
- [ ] Test avec 4000 0000 0000 0069 → Expirée
- [ ] Test avec Mastercard 5555 5555 5555 4444
- [ ] Test avec American Express 378282246310005

### Vérifications

- [ ] RDV créé avec statut 'en_attente_paiement'
- [ ] Page de paiement affichée
- [ ] Paiement accepté → RDV statut 'confirme'
- [ ] Paiement refusé → Message d'erreur
- [ ] Notification créée en BD
- [ ] Email envoyé au patient
- [ ] Redirection correcte

### Dashboard

- [ ] Paiement visible sur Stripe Dashboard
- [ ] Montant correct (250 MAD)
- [ ] Statut correct (succeeded ou failed)
- [ ] Métadonnées correctes

---

**💡 Conseil:** Pour un test rapide, utilisez toujours:

```
Carte: 4242 4242 4242 4242
Exp: 12/25
CVC: 123
Nom: Test User
Email: test@example.com
```

**⚠️ Important:** Ces cartes fonctionnent UNIQUEMENT en mode TEST avec les clés `pk_test_...` et `sk_test_...`

En mode LIVE (clés `pk_live_...`), aucune carte de test ne fonctionne!

---

**Dernière mise à jour:** Avril 2024  
**Stripe API Version:** v2024  
**Mode:** TEST (Development)
