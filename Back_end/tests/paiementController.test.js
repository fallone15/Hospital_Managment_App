// Configurer le mock stripe avant de require le controlleur
const mockPaymentIntentsCreate = jest.fn();
const mockPaymentIntentsRetrieve = jest.fn();
const mockWebhooksConstructEvent = jest.fn();

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
      retrieve: mockPaymentIntentsRetrieve,
    },
    webhooks: {
      constructEvent: mockWebhooksConstructEvent,
    },
  }));
});

const paiementController = require('../controllers/paiementController');
const { query } = require('../config/database');

// Mock database query helper
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('paiementController - Tests Unitaires', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      query: {},
      params: {},
      user: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('createPaiement', () => {
    it('devrait créer un PaymentIntent pour Stripe et retourner le clientSecret', async () => {
      req.user = { id: 42 };
      req.body = {
        montant: 300,
        methode_paiement: 'stripe',
        rendez_vous_id: 12,
        description: 'Consultation Cardiologie',
      };

      mockPaymentIntentsCreate.mockResolvedValueOnce({
        id: 'pi_mock_123',
        client_secret: 'secret_mock_123',
      });

      await paiementController.createPaiement(req, res);

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith({
        amount: 30000,
        currency: 'mad',
        metadata: {
          patient_id: 42,
          rendez_vous_id: 12,
          description: 'Consultation Cardiologie',
          montant: 300,
          methode_paiement: 'stripe',
        },
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PaymentIntent créé',
        data: {
          clientSecret: 'secret_mock_123',
          paymentIntentId: 'pi_mock_123',
        },
      });
    });

    it('devrait insérer directement en DB si la méthode est autre que Stripe (ex: espèces)', async () => {
      req.user = { id: 42 };
      req.body = {
        montant: 300,
        methode_paiement: 'especes',
        rendez_vous_id: 12,
        description: 'Paiement guichet',
      };

      const mockPaiement = {
        id: 1,
        patient_id: 42,
        rendez_vous_id: 12,
        montant: 300,
        statut: 'en_attente',
      };
      query.mockResolvedValueOnce({ rows: [mockPaiement] });

      await paiementController.createPaiement(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO paiements'),
        [42, 12, 300, 'especes', 'en_attente', 'Paiement guichet']
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Paiement enregistré en attente',
        data: mockPaiement,
      });
    });
  });

  describe('confirmPaiement', () => {
    it('devrait rejeter si le paiement n\'a pas réussi côté Stripe', async () => {
      req.user = { id: 42 };
      req.body = { payment_intent_id: 'pi_mock_failed' };

      mockPaymentIntentsRetrieve.mockResolvedValueOnce({
        status: 'requires_payment_method',
      });

      await paiementController.confirmPaiement(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Le paiement n'a pas été confirmé par Stripe",
      });
    });

    it('devrait confirmer le paiement en DB, mettre à jour le rdv et créer une notification', async () => {
      req.user = { id: 42 };
      req.body = { payment_intent_id: 'pi_mock_success' };

      mockPaymentIntentsRetrieve.mockResolvedValueOnce({
        status: 'succeeded',
        metadata: {
          rendez_vous_id: '12',
          montant: '315',
          methode_paiement: 'stripe',
          description: 'Consultation Cardiologie',
        },
      });

      query
        .mockResolvedValueOnce({ rows: [{ id: 5, montant: 315 }] }) // insert paiement confirme
        .mockResolvedValueOnce({ rows: [] }) // update rdv
        .mockResolvedValueOnce({ rows: [] }) // insert notification
        .mockResolvedValueOnce({ rows: [{ id: 12, statut: 'confirme', date_rdv: '2026-05-18' }] }); // select rdv details

      await paiementController.confirmPaiement(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO paiements'),
        [42, 12, 315, 'stripe', 'confirme', 'pi_mock_success', 'Consultation Cardiologie']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rendez_vous'),
        [12, 42]
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'confirme'"),
        [12, 42]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Paiement confirmé avec succès',
        data: expect.objectContaining({
          paiement: expect.objectContaining({ id: 5 }),
          rendez_vous: expect.objectContaining({ id: 12 }),
        }),
      });
    });
  });

  describe('getTarifs', () => {
    it('devrait retourner le dictionnaire statique des tarifs', async () => {
      await paiementController.getTarifs(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          consultation_generale: 200,
          consultation_specialiste: 300,
        }),
      });
    });

    it('devrait retourner une erreur 500 en cas de crash (ex: res.json plante)', async () => {
      res.json.mockImplementationOnce(() => {
        throw new Error('Crash');
      });

      await paiementController.getTarifs(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getHistoriquePaiements', () => {
    it('devrait retourner l\'historique des paiements d\'un patient', async () => {
      req.user = { id: 42 };
      const mockHistory = [{ id: 1, montant: 300, statut: 'confirme' }];
      query.mockResolvedValueOnce({ rows: mockHistory });

      await paiementController.getHistoriquePaiements(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FROM paiements'),
        [42]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      req.user = { id: 42 };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await paiementController.getHistoriquePaiements(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPaiement', () => {
    it('devrait retourner une erreur 404 si le paiement n\'existe pas pour ce patient', async () => {
      req.user = { id: 42 };
      req.params.id = '12';
      query.mockResolvedValueOnce({ rows: [] });

      await paiementController.getPaiement(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait retourner le paiement s\'il est trouvé', async () => {
      req.user = { id: 42 };
      req.params.id = '12';
      const mockPaiement = { id: 12, patient_id: 42, montant: 315 };
      query.mockResolvedValueOnce({ rows: [mockPaiement] });

      await paiementController.getPaiement(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPaiement,
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      req.user = { id: 42 };
      req.params.id = '12';
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await paiementController.getPaiement(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('stripeWebhook', () => {
    it('devrait échouer si la signature Stripe est invalide', async () => {
      req.headers['stripe-signature'] = 'invalid_sig';
      req.body = 'raw_body';

      mockWebhooksConstructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      await paiementController.stripeWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('Webhook Error: Invalid signature')
      );
    });

    it('devrait mettre à jour le paiement au statut confirme si payment_intent.succeeded', async () => {
      req.headers['stripe-signature'] = 'valid_sig';
      req.body = 'raw_body';

      const mockEvent = {
        type: 'payment_intent.succeeded',
        data: {
          object: { id: 'pi_123' },
        },
      };
      mockWebhooksConstructEvent.mockReturnValueOnce(mockEvent);
      query.mockResolvedValueOnce({ rows: [] });

      await paiementController.stripeWebhook(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE paiements'),
        ['pi_123']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'confirme'"),
        ['pi_123']
      );
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('devrait mettre à jour le paiement au statut echoue si payment_intent.payment_failed', async () => {
      req.headers['stripe-signature'] = 'valid_sig';
      req.body = 'raw_body';

      const mockEvent = {
        type: 'payment_intent.payment_failed',
        data: {
          object: { id: 'pi_123' },
        },
      };
      mockWebhooksConstructEvent.mockReturnValueOnce(mockEvent);
      query.mockResolvedValueOnce({ rows: [] });

      await paiementController.stripeWebhook(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE paiements'),
        ['pi_123']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'echoue'"),
        ['pi_123']
      );
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });
});
