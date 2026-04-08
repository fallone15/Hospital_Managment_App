# 🚀 Quick Start - Intégration Stripe Rendez-vous

⚠️ **MODE TEST - SIMULATION UNIQUEMENT**

Cette intégration utilise Stripe en **mode TEST** avec des cartes fictives pour simuler les paiements.  
Aucun argent réel n'est débité. Utilisez-le pour développement et test.

---

## ⚡ Démarrage Rapide (5 minutes)

### 1️⃣ Obtenir vos clés Stripe de TEST

```bash
1. Allez sur https://stripe.com/docs/testing
2. Créez un compte gratuit ou connectez-vous
3. Les clés TEST sont générées automatiquement en mode TEST
4. Voici un exemple de clés TEST valides:

STRIPE_SECRET_KEY=sk_test_REDACTED
STRIPE_PUBLISHABLE_KEY=pk_test_REDACTED
```

### 2️⃣ Mettre à jour `.env`

Modifiez votre fichier `Back_end/.env`:

```env
STRIPE_SECRET_KEY=sk_test_REDACTED
STRIPE_PUBLISHABLE_KEY=pk_test_REDACTED
```

### 3️⃣ Redémarrer le serveur

```bash
cd Back_end
npm start
# Le serveur devrait démarrer sans erreurs Stripe
```

### 4️⃣ Tester le flux complet

#### Étape A: Créer un rendez-vous (depuis le frontend)

```javascript
// Ouvrez la console du navigateur (F12) et exécutez:

const token = localStorage.getItem("token");

fetch("/api/rdv", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    medecin_id: 1,
    date_rdv: "2024-04-15",
    heure_rdv: "10:30",
    motif: "Consultation générale",
  }),
})
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ RDV créé:", data);
    // Stocker pour le paiement
    sessionStorage.setItem(
      "appointmentData",
      JSON.stringify({
        id: data.data.rendez_vous.id,
        montant: data.data.paiement_requis.montant,
        medecin_prenom: data.data.paiement_requis.medecin.prenom,
        medecin_nom: data.data.paiement_requis.medecin.nom,
        date_rdv: data.data.rendez_vous.date_rdv,
        heure_rdv: data.data.rendez_vous.heure_rdv,
      }),
    );
  });
```

#### Étape B: Aller à la page de paiement

```
http://localhost:5000/payment-checkout.html
```

#### Étape C: Remplir le formulaire avec une carte de test

```
Numéro de carte: 4242 4242 4242 4242
Expiration: 12/25
CVC: 123
Nom: N'importe quel nom
Email: test@example.com
```

#### Étape D: Cliquer sur "Payer maintenant"

Le paiement devrait réussir ✅

---

## 🧪 Cartes de test Stripe

### Paiements réussis

| Cas                 | Numéro              | Statut                 |
| ------------------- | ------------------- | ---------------------- |
| ✅ Succès standard  | 4242 4242 4242 4242 | Accepté                |
| ✅ Visa             | 4000 0000 0000 0002 | Refusé (tester erreur) |
| ✅ Mastercard       | 5555 5555 5555 4444 | Accepté                |
| ✅ American Express | 378282246310005     | Accepté                |

**Expiration:** 12/25 (futur)  
**CVC:** N'importe quel numéro à 3 chiffres

### Cartes de test - Cas spéciaux

```
❌ PAIEMENT REFUSÉ
   Numéro: 4000 0000 0000 0002
   Message: Votre carte a été refusée

⚠️ CARTE EXPIRÉE
   Numéro: 4000 0000 0000 0069
   Message: Votre carte a expiré

⚠️ ERREUR 3D SECURE
   Numéro: 4000 0000 0000 3220
   (Nécessite authentification supplémentaire)

💳 VISA VALIDE
   Numéro: 4111 1111 1111 1111
   Résultat: Accepté
```

---

## 📊 Vérifier les paiements

### Dans les logs de la console

Vous devriez voir les messages:

```
✅ Paiement créé avec succès
   ↓
🔄 Traitement en cours...
   ↓
✅ Paiement réussi!
   ↓
✅ Rendez-vous confirmé
```

### Dans le tableau de bord Stripe

1. Allez sur https://dashboard.stripe.com
2. Cliquez sur **Payments**
3. Vous devriez voir vos paiements de test listés

---

## 💻 Structure des fichiers

```
Back_end/
├── controllers/
│   ├── rdvController.js          ✅ Mis à jour pour paiement obligatoire
│   └── paiementController.js     ✅ Mis à jour confirmPaiement()
├── routes/
│   ├── rendezvous.js
│   └── paiements.js
├── stripe-integration.js         ✨ Nouveau - Fonctions JS utilesÀJavaScript utilities
├── STRIPE_INTEGRATION.md         ✨ Nouveau - Documentation complète
├── QUICKSTART_STRIPE.md          ✨ Nouveau - Ce fichier
└── .env                          ✅ Mis à jour avec clés TEST

Front_end/
└── payment-checkout.html         ✨ Nouveau - Page de paiement Stripe
```

---

## 🔄 Workflow complet

```
1. Patient clique sur "Réserver un RDV"
   ↓
2. Sélectionne: Médecin, Date, Heure, Motif
   ↓
3. Clique "Réserver et Payer"
   ↓
4. Backend crée RDV avec statut 'en_attente_paiement'
   ↓
5. Frontend affiche page de paiement (payment-checkout.html)
   ↓
6. Patient remplit formulaire de carte
   ↓
7. Clique "Payer maintenant"
   ↓
8. Frontend crée PaymentIntent (/api/paiements)
   ↓
9. Stripe traite le paiement
   ↓
10. Frontend confirme au backend (/api/paiements/confirm)
    ↓
11. Backend active RDV (statut = 'confirme')
    ↓
12. Patient reçoit confirmation par email
```

---

## ✅ Checklist de test

- [ ] Clés Stripe configurées dans `.env`
- [ ] Serveur Node.js redémarré
- [ ] Page `payment-checkout.html` accessible
- [ ] Création de RDV réussit
- [ ] Paiement accepté avec 4242 4242 4242 4242
- [ ] RDV statut passe à 'confirme'
- [ ] Notification créée en base de données
- [ ] Redirection vers la page de confirmation

---

## 🐛 Troubles?

### Erreur: "Cannot find module 'stripe'"

```bash
cd Back_end
npm install stripe
```

### Erreur: "Invalid API Key"

- Vérifiez que les clés dans `.env` commencent par `sk_test_` ou `sk_live_`
- Vérifiez qu'il n'y a pas d'espaces au début ou à la fin

### Erreur: "Card declined" en test

- Utilisez exactement: `4242 4242 4242 4242`
- Expiration: `12/25` (ou toute date future)
- CVC: `123` (ou n'importe quel numéro)

### Paiement réussi mais RDV pas confirmé

- Le webhook peut ne pas être configuré
- Attendez quelques secondes et rafraîchissez
- Vérifiez directement la base de données

---

## 🎓 Ressources

- **Docs Stripe:** https://stripe.com/docs
- **Guide de test:** https://stripe.com/docs/testing
- **Cartes de test:** https://stripe.com/docs/payments/test-data
- **Stripe Elements:** https://stripe.com/docs/js/elements_object/create

---

## 🚀 Prochaines étapes

1. ✅ Mettre à jour les clés avec vos vraies clés Stripe
2. ✅ Configurer les webhooks dans Stripe Dashboard
3. ✅ Tester avec d'autres méthodes de paiement (Virement)
4. ✅ Envoyer emails de confirmation
5. ✅ Afficher l'historique des paiements au patient

---

**Version:** 1.0  
**Testé avec:** Node.js 18+, Stripe API v2024+  
**Dernier test:** Avril 2024
