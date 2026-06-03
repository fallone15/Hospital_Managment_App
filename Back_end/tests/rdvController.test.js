const rdvController = require('../controllers/rdvController');
const { query } = require('../config/database');

// Mock des dépendances
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

describe('rdvController - Tests Unitaires', () => {
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

  describe('getSpecialites', () => {
    it('devrait retourner les spécialités actives', async () => {
      const mockSpecialites = [
        { specialite: 'Cardiologie', tarif: 300 },
        { specialite: 'Pédiatrie', tarif: 250 },
      ];
      query.mockResolvedValueOnce({ rows: mockSpecialites });

      await rdvController.getSpecialites(req, res);

      expect(query).toHaveBeenCalledWith(expect.stringContaining('FROM services s'));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockSpecialites,
      });
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await rdvController.getSpecialites(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getMedecins', () => {
    it('devrait retourner tous les médecins actifs', async () => {
      const mockMedecins = [
        { id: 1, nom: 'El Alami', prenom: 'Dr', specialite: 'Cardiologie', tarif: 300 },
      ];
      query.mockResolvedValueOnce({ rows: mockMedecins });

      await rdvController.getMedecins(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockMedecins,
      });
    });

    it('devrait filtrer les médecins par spécialité si fournie', async () => {
      req.query.specialite = 'Cardiologie';
      query.mockResolvedValueOnce({ rows: [] });

      await rdvController.getMedecins(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('AND m.specialite = $1'),
        ['Cardiologie']
      );
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await rdvController.getMedecins(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getDisponibilites', () => {
    it('devrait retourner les créneaux disponibles pour une date donnée', async () => {
      req.params.medecin_id = '3';
      req.query.date = '2026-05-18'; // Lundi (jour 1)

      query
        .mockResolvedValueOnce({
          rows: [{ heure_debut: '09:00', heure_fin: '10:00', duree_moyenne: '30' }],
        }) // disponibilites
        .mockResolvedValueOnce({
          rows: [{ heure_rdv: '09:30:00' }],
        }); // rdv pris

      await rdvController.getDisponibilites(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          disponible: true,
          creneaux: ['09:00'], // 09:30 est déjà pris
        },
      });
    });

    it('devrait indiquer si le médecin n\'est pas disponible ce jour-là', async () => {
      req.params.medecin_id = '3';
      req.query.date = '2026-05-18';
      query.mockResolvedValueOnce({ rows: [] }); // Aucune disponibilité

      await rdvController.getDisponibilites(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { disponible: false, message: "Le médecin n'est pas disponible ce jour-là" },
      });
    });

    it('devrait retourner toutes les disponibilités si aucune date n\'est spécifiée', async () => {
      req.params.medecin_id = '3';
      req.query.date = null;

      const mockDispos = [
        { jour_semaine: 1, heure_debut: '09:00', heure_fin: '17:00' },
      ];
      query.mockResolvedValueOnce({ rows: mockDispos });

      await rdvController.getDisponibilites(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('FROM disponibilites'),
        ['3']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDispos,
      });
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      req.params.medecin_id = '3';
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await rdvController.getDisponibilites(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createRendezVous', () => {
    it('devrait échouer si le créneau est déjà pris', async () => {
      req.user = { id: 42 };
      req.body = {
        medecin_id: 3,
        date_rdv: '2026-05-18',
        heure_rdv: '09:00',
        motif: 'Consultation annuelle',
      };

      query.mockResolvedValueOnce({ rows: [{ id: 100 }] }); // un rdv existe déjà sur ce créneau

      await rdvController.createRendezVous(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Ce créneau n'est plus disponible",
      });
    });

    it('devrait créer le rendez-vous au statut en_attente_paiement avec des frais de 15 MAD', async () => {
      req.user = { id: 42 };
      req.body = {
        medecin_id: 3,
        date_rdv: '2026-05-18',
        heure_rdv: '09:00',
        motif: 'Consultation annuelle',
      };

      query
        .mockResolvedValueOnce({ rows: [] }) // créneau dispo
        .mockResolvedValueOnce({
          rows: [{ nom: 'El Alami', prenom: 'Ahmed', specialite: 'Cardiologie', tarif: 300 }],
        }) // medecin info
        .mockResolvedValueOnce({
          rows: [{ nom: 'Dupont', prenom: 'Jean', email: 'jean@test.com' }],
        }) // patient info
        .mockResolvedValueOnce({
          rows: [
            {
              id: 99,
              patient_id: 42,
              medecin_id: 3,
              date_rdv: '2026-05-18',
              heure_rdv: '09:00',
              statut: 'en_attente_paiement',
              montant_total: 315,
            },
          ],
        }); // insert result

      await rdvController.createRendezVous(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO rendez_vous'),
        [42, null, 3, '2026-05-18', '09:00', 'Consultation annuelle', 315]
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paiement_requis: expect.objectContaining({
              montant: 315,
            }),
          }),
        })
      );
    });

    it('devrait échouer si le membre de la famille n\'est pas trouvé', async () => {
      req.user = { id: 42 };
      req.body = {
        medecin_id: 3,
        date_rdv: '2026-05-18',
        heure_rdv: '09:00',
        id_member: 99,
      };

      query.mockResolvedValueOnce({ rows: [] }); // membre de famille non trouvé

      await rdvController.createRendezVous(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Membre familial introuvable.',
      });
    });

    it('devrait échouer si le médecin n\'est pas trouvé', async () => {
      req.user = { id: 42 };
      req.body = {
        medecin_id: 999,
        date_rdv: '2026-05-18',
        heure_rdv: '09:00',
      };

      query
        .mockResolvedValueOnce({ rows: [] }) // créneau dispo ok
        .mockResolvedValueOnce({ rows: [] }); // médecin info non trouvé

      await rdvController.createRendezVous(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Médecin non trouvé',
      });
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      req.user = { id: 42 };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await rdvController.createRendezVous(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getRendezVousPatient', () => {
    it('devrait retourner la liste des rendez-vous du patient', async () => {
      req.user = { id: 42 };
      req.query = { statut: 'confirme', id_member: '1' };
      query.mockResolvedValueOnce({ rows: [{ id: 12, patient_id: 42 }] });

      await rdvController.getRendezVousPatient(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('r.patient_id = $1'),
        [42, '1', 'confirme']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('r.id_member = $2'),
        [42, '1', 'confirme']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('r.statut = $3'),
        [42, '1', 'confirme']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 12, patient_id: 42 }],
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      req.user = { id: 42 };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await rdvController.getRendezVousPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getRendezVousMedecin', () => {
    it('devrait retourner les rendez-vous du médecin filtrés par date et statut', async () => {
      req.user = { id: 3 };
      req.query = { date: '2026-05-18', statut: 'confirme' };
      query.mockResolvedValueOnce({ rows: [] });

      await rdvController.getRendezVousMedecin(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('r.medecin_id = $1'),
        [3, '2026-05-18', 'confirme']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('r.date_rdv = $2'),
        [3, '2026-05-18', 'confirme']
      );
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('r.statut = $3'),
        [3, '2026-05-18', 'confirme']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      req.user = { id: 3 };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await rdvController.getRendezVousMedecin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('cancelRendezVous', () => {
    it('devrait échouer si le rendez-vous n\'appartient pas à l\'utilisateur', async () => {
      req.user = { id: 42, type: 'patient' };
      req.params.id = '12';
      query.mockResolvedValueOnce({ rows: [] }); // rdv non trouvé pour ce patient

      await rdvController.cancelRendezVous(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('devrait annuler le rendez-vous avec succès', async () => {
      req.user = { id: 42, type: 'patient' };
      req.params.id = '12';
      query
        .mockResolvedValueOnce({ rows: [{ id: 12, patient_id: 42 }] }) // rdv trouvé
        .mockResolvedValueOnce({ rows: [{ id: 12, statut: 'annule' }] }); // update result

      await rdvController.cancelRendezVous(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE rendez_vous SET statut = 'annule'"),
        ['12']
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Rendez-vous annulé avec succès',
        data: { id: 12, statut: 'annule' },
      });
    });

    it('devrait retourner une erreur 500 si la base de données crash', async () => {
      req.user = { id: 42, type: 'patient' };
      req.params.id = '12';
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await rdvController.cancelRendezVous(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
