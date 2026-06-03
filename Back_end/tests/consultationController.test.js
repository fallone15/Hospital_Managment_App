const consultationController = require('../controllers/consultationController');
const { query } = require('../config/database');

// Mock database helper
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('consultationController - Tests Unitaires', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      query: {},
      params: {},
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createConsultation', () => {
    it('devrait échouer si le membre de la famille n\'appartient pas au titulaire', async () => {
      req.user = { id: 42 };
      req.body = { id_service: 1, motif: 'Urgence', id_member: 99 };

      // Simuler que le membre de famille n'est pas trouvé
      query.mockResolvedValueOnce({ rows: [] });

      await consultationController.createConsultation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Membre familial introuvable.',
      });
    });

    it('devrait créer une consultation avec numéro de file d\'attente correct', async () => {
      req.user = { id: 42 };
      req.body = { id_service: 2, motif: 'Fièvre' };

      query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // count pour file d'attente
        .mockResolvedValueOnce({
          rows: [
            {
              id_consultation: 10,
              id_patient: 42,
              id_service: 2,
              numero_file: 'S2-006',
              motif: 'Fièvre',
              statut: 'en_attente',
            },
          ],
        }) // insert result
        .mockResolvedValueOnce({
          rows: [{ nom: 'Pédiatrie', tarif: 250, duree_moyenne: 30 }],
        }); // service info result

      await consultationController.createConsultation(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO consultations'),
        [42, null, 2, 'S2-006', 'Fièvre']
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            numero_file: 'S2-006',
          }),
        })
      );
    });
  });

  describe('updateConsultation', () => {
    it('devrait échouer si la consultation n\'existe pas', async () => {
      req.user = { id: 3 }; // médecin
      req.params.id_consultation = '999';
      req.body = { observations: 'Tout va bien' };

      query.mockResolvedValueOnce({ rows: [] }); // consultation non trouvée

      await consultationController.updateConsultation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Consultation non trouvée',
      });
    });

    it('devrait échouer si aucun champ de mise à jour n\'est fourni', async () => {
      req.user = { id: 3 };
      req.params.id_consultation = '10';
      req.body = {};

      query.mockResolvedValueOnce({ rows: [{ id_consultation: 10, id_medecin: 3 }] }); // consultation existe déjà affectée au médecin

      await consultationController.updateConsultation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Aucune mise à jour fournie',
      });
    });

    it('devrait mettre à jour dynamiquement la consultation et assigner le médecin', async () => {
      req.user = { id: 3 }; // medecin_id
      req.params.id_consultation = '10';
      req.body = {
        statut: 'en_cours',
        observations: 'Patient stable',
      };

      query
        .mockResolvedValueOnce({ rows: [{ id_consultation: 10, id_medecin: null }] }) // consultation existe mais pas de médecin assigné
        .mockResolvedValueOnce({
          rows: [
            {
              id_consultation: 10,
              id_medecin: 3,
              statut: 'en_cours',
              observations: 'Patient stable',
            },
          ],
        }); // update result

      await consultationController.updateConsultation(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE consultations SET id_medecin = $2, statut = $3, heure_debut = CURRENT_TIMESTAMP, observations = $4 WHERE id_consultation = $1 RETURNING *'),
        ['10', 3, 'en_cours', 'Patient stable']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Consultation mise à jour avec succès',
        data: expect.objectContaining({
          id_consultation: 10,
          id_medecin: 3,
        }),
      });
    });
  });

  describe('cancelConsultation', () => {
    it('devrait échouer si la consultation n\'appartient pas au patient', async () => {
      req.user = { id: 42 };
      req.params.id_consultation = '10';

      query.mockResolvedValueOnce({ rows: [] }); // non trouvée pour ce patient

      await consultationController.cancelConsultation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait annuler avec succès la consultation', async () => {
      req.user = { id: 42 };
      req.params.id_consultation = '10';

      query
        .mockResolvedValueOnce({ rows: [{ id_consultation: 10, id_patient: 42 }] }) // trouve
        .mockResolvedValueOnce({ rows: [{ id_consultation: 10, statut: 'annulee' }] }); // update

      await consultationController.cancelConsultation(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE consultations'),
        ['10']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("statut = 'annulee'"),
        ['10']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Consultation annulée avec succès',
        data: { id_consultation: 10, statut: 'annulee' },
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      req.user = { id: 42 };
      req.params.id_consultation = '10';
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await consultationController.cancelConsultation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getFileAttente', () => {
    it('devrait retourner la file d\'attente d\'un service', async () => {
      req.params.id_service = '2';
      req.query.date = '2026-05-18';
      const mockQueue = [{ id_consultation: 1, numero_file: 'S2-001' }];
      query.mockResolvedValueOnce({ rows: mockQueue });

      await consultationController.getFileAttente(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.id_service = $1'),
        ['2', '2026-05-18']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockQueue,
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      req.params.id_service = '2';
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await consultationController.getFileAttente(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getConsultationsPatient', () => {
    it('devrait retourner l\'historique des consultations du patient', async () => {
      req.user = { id: 42 };
      req.query = { statut: 'en_attente', id_member: '1' };
      query.mockResolvedValueOnce({ rows: [] });

      await consultationController.getConsultationsPatient(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('c.id_patient = $1'),
        [42, '1', 'en_attente']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('c.id_member = $2'),
        [42, '1', 'en_attente']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('c.statut = $3'),
        [42, '1', 'en_attente']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      req.user = { id: 42 };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await consultationController.getConsultationsPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getConsultationsMedecin', () => {
    it('devrait retourner les consultations d\'un médecin filtrées', async () => {
      req.user = { id: 3 };
      req.query = { date: '2026-05-18', statut: 'terminee' };
      query.mockResolvedValueOnce({ rows: [] });

      await consultationController.getConsultationsMedecin(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('c.id_medecin = $1'),
        [3, '2026-05-18', 'terminee']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DATE(c.heure_arrivee) = $2'),
        [3, '2026-05-18', 'terminee']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('c.statut = $3'),
        [3, '2026-05-18', 'terminee']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      req.user = { id: 3 };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await consultationController.getConsultationsMedecin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getServices', () => {
    it('devrait retourner la liste des services actifs', async () => {
      const mockServices = [{ id_service: 1, nom: 'Urgences' }];
      query.mockResolvedValueOnce({ rows: mockServices });

      await consultationController.getServices(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockServices,
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await consultationController.getServices(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getSallesDisponibles', () => {
    it('devrait retourner les salles libres filtrées', async () => {
      req.query = { id_service: '2', id_medecin: '3' };
      query.mockResolvedValueOnce({ rows: [] });

      await consultationController.getSallesDisponibles(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND id_service = $1 AND id_medecin = $2'),
        ['2', '3']
      );
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await consultationController.getSallesDisponibles(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

