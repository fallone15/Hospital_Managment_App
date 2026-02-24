const { query } = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Créer un paiement
const createPaiement = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const {
      montant,
      methode_paiement,
      rendez_vous_id,
      description
    } = req.body;

    let paiement;

    // Si le paiement est par Stripe
    if (methode_paiement === 'stripe') {
      // Créer un PaymentIntent Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(montant * 100), // Stripe utilise les centimes
        currency: 'mad', // Dirham marocain
        metadata: {
          patient_id,
          rendez_vous_id: rendez_vous_id || 'N/A',
          description: description || 'Paiement Fakhsash'
        }
      });

      // Enregistrer le paiement en base de données
      const result = await query(
        `INSERT INTO paiements 
         (patient_id, rendez_vous_id, montant, methode_paiement, statut, stripe_payment_id, description) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING *`,
        [patient_id, rendez_vous_id, montant, methode_paiement, 'en_attente', paymentIntent.id, description]
      );

      paiement = result.rows[0];

      return res.status(201).json({
        success: true,
        message: 'Paiement créé avec succès',
        data: {
          paiement,
          clientSecret: paymentIntent.client_secret
        }
      });
    }

    // Pour les autres méthodes de paiement (espèces, virement, etc.)
    const result = await query(
      `INSERT INTO paiements 
       (patient_id, rendez_vous_id, montant, methode_paiement, statut, description) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [patient_id, rendez_vous_id, montant, methode_paiement, 'en_attente', description]
    );

    paiement = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: paiement
    });
  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du paiement'
    });
  }
};

// Confirmer un paiement Stripe
const confirmPaiement = async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    // Récupérer le PaymentIntent depuis Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status === 'succeeded') {
      // Mettre à jour le statut du paiement en base de données
      const result = await query(
        `UPDATE paiements 
         SET statut = 'confirme', date_paiement = CURRENT_TIMESTAMP 
         WHERE stripe_payment_id = $1 
         RETURNING *`,
        [payment_intent_id]
      );

      if (result.rows.length > 0) {
        const paiement = result.rows[0];

        // Créer une notification
        await query(
          `INSERT INTO notifications (patient_id, titre, message, type) 
           VALUES ($1, $2, $3, $4)`,
          [
            paiement.patient_id,
            'Paiement confirmé',
            `Votre paiement de ${paiement.montant} MAD a été confirmé`,
            'paiement'
          ]
        );

        return res.json({
          success: true,
          message: 'Paiement confirmé avec succès',
          data: paiement
        });
      }
    }

    res.status(400).json({
      success: false,
      message: 'Le paiement n\'a pas été confirmé'
    });
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement'
    });
  }
};

// Récupérer l'historique des paiements d'un patient
const getHistoriquePaiements = async (req, res) => {
  try {
    const patient_id = req.user.id;

    const result = await query(
      `SELECT p.*, 
              r.date_rdv, r.heure_rdv,
              m.nom as medecin_nom, m.prenom as medecin_prenom
       FROM paiements p
       LEFT JOIN rendez_vous r ON p.rendez_vous_id = r.id
       LEFT JOIN medecins m ON r.medecin_id = m.id
       WHERE p.patient_id = $1
       ORDER BY p.date_paiement DESC`,
      [patient_id]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

// Obtenir un paiement spécifique
const getPaiement = async (req, res) => {
  try {
    const { id } = req.params;
    const patient_id = req.user.id;

    const result = await query(
      `SELECT p.*, 
              r.date_rdv, r.heure_rdv,
              m.nom as medecin_nom, m.prenom as medecin_prenom
       FROM paiements p
       LEFT JOIN rendez_vous r ON p.rendez_vous_id = r.id
       LEFT JOIN medecins m ON r.medecin_id = m.id
       WHERE p.id = $1 AND p.patient_id = $2`,
      [id, patient_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paiement non trouvé'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du paiement'
    });
  }
};

// Webhook Stripe pour les notifications de paiement
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Erreur webhook Stripe:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les différents types d'événements Stripe
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Mettre à jour le statut du paiement
      await query(
        `UPDATE paiements 
         SET statut = 'confirme', date_paiement = CURRENT_TIMESTAMP 
         WHERE stripe_payment_id = $1`,
        [paymentIntent.id]
      );
      
      console.log('Paiement réussi:', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      // Mettre à jour le statut du paiement
      await query(
        `UPDATE paiements 
         SET statut = 'echoue' 
         WHERE stripe_payment_id = $1`,
        [failedPayment.id]
      );
      
      console.log('Paiement échoué:', failedPayment.id);
      break;

    default:
      console.log(`Type d'événement non géré: ${event.type}`);
  }

  res.json({ received: true });
};

// Obtenir les tarifs de consultation
const getTarifs = async (req, res) => {
  try {
    // Ces tarifs peuvent être stockés en base de données ou dans un fichier de configuration
    const tarifs = {
      consultation_generale: 200,
      consultation_specialiste: 300,
      consultation_urgence: 400,
      examens: {
        radiographie: 150,
        echographie: 200,
        scanner: 500,
        irm: 800,
        analyses_sang: 100
      }
    };

    res.json({
      success: true,
      data: tarifs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tarifs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des tarifs'
    });
  }
};

module.exports = {
  createPaiement,
  confirmPaiement,
  getHistoriquePaiements,
  getPaiement,
  stripeWebhook,
  getTarifs
};
