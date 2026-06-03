const authController = require('../controllers/authController');
const { query } = require('../config/database');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/mailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock des dépendances
jest.mock('../config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../utils/mailer', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendResetPinEmail: jest.fn().mockResolvedValue(true),
}));

describe('authController - Tests Unitaires', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('registerPatient', () => {
    it('devrait échouer si l\'âge est inférieur à 16 ans', async () => {
      // Date de naissance d'un enfant de 10 ans
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 10);

      req.body = {
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: birthDate.toISOString().split('T')[0],
        email: 'jean.dupont@email.com',
        code_pin: '1234',
      };

      await authController.registerPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "La création de compte nécessite d'avoir au moins 16 ans.",
        })
      );
    });

    it('devrait échouer si l\'email est déjà utilisé', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      req.body = {
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: birthDate.toISOString().split('T')[0],
        email: 'jean.dupont@email.com',
        code_pin: '1234',
        cin: 'AB12345',
      };

      // Simuler que l'email est trouvé (DELETE de nettoyage retourne vide, SELECT email check trouve un patient)
      query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id_patient: 1 }] });

      await authController.registerPatient(req, res);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id_patient FROM patients WHERE email = $1'),
        ['jean.dupont@email.com']
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Cet email est déjà utilisé',
        })
      );
    });

    it('devrait s\'inscrire avec succès et envoyer un email de vérification', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      req.body = {
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: birthDate.toISOString().split('T')[0],
        sexe: 'M',
        adresse: '123 Rue de la Paix',
        code_postal: '75001',
        ville: 'Paris',
        email: 'jean.dupont@email.com',
        telephone: '0612345678',
        code_pin: '1234',
        cin: 'AB12345',
      };

      // Simuler que l'email et le CIN ne sont pas utilisés
      query
        .mockResolvedValueOnce({ rows: [] }) // DELETE pending expirés (ou query de nettoyage)
        .mockResolvedValueOnce({ rows: [] }) // Email check
        .mockResolvedValueOnce({ rows: [] }) // CIN check
        .mockResolvedValueOnce({ rows: [{ email: 'jean.dupont@email.com' }] }); // Insert pending

      await authController.registerPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Inscription en attente. Vérifiez votre email pour confirmer votre inscription.',
        })
      );
      expect(sendVerificationEmail).toHaveBeenCalled();
    });

    it('devrait échouer si le CIN existe déjà', async () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);

      req.body = {
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: birthDate.toISOString().split('T')[0],
        email: 'jean.dupont@email.com',
        code_pin: '1234',
        cin: 'AB12345',
      };

      query
        .mockResolvedValueOnce({ rows: [] }) // DELETE pending expirés
        .mockResolvedValueOnce({ rows: [] }) // Email check ok
        .mockResolvedValueOnce({ rows: [{ id_patient: 2 }] }); // CIN check trouve un doublon

      await authController.registerPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Ce CIN/Passeport est déjà enregistré',
        })
      );
    });

    it('devrait échouer si le patient a presque 16 ans mais pas tout à fait (mois/jour diff négatif)', async () => {
      const birthDate = new Date();
      // Anniversaire dans un mois (donc 15 ans révolus)
      birthDate.setFullYear(birthDate.getFullYear() - 16);
      birthDate.setMonth(birthDate.getMonth() + 1);

      req.body = {
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: birthDate.toISOString().split('T')[0],
        email: 'jean.dupont@email.com',
        code_pin: '1234',
      };

      await authController.registerPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "La création de compte nécessite d'avoir au moins 16 ans.",
        })
      );
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      req.body = {
        nom: 'Dupont',
        prenom: 'Jean',
        date_naissance: '1990-01-01',
        email: 'jean@test.com',
        code_pin: '1234',
      };

      query.mockRejectedValueOnce(new Error('Erreur de connexion DB'));

      await authController.registerPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Erreur lors de la création du compte',
        })
      );
    });
  });

  describe('verifyEmail', () => {
    it('devrait échouer si le token ou email est manquant', async () => {
      req.body = { token: 'token123' }; // email manquant

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token et email sont obligatoires',
        })
      );
    });

    it('devrait échouer si aucun enregistrement en attente n\'est trouvé', async () => {
      req.body = { token: 'token123', email: 'test@test.com' };
      query.mockResolvedValueOnce({ rows: [] });

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Token invalide ou expiré. Veuillez vous réinscrire.',
        })
      );
    });

    it('devrait insérer le patient et supprimer la ligne pending si valide', async () => {
      req.body = { token: 'token123', email: 'test@test.com' };
      query
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              email: 'test@test.com',
              registration_data: {
                nom: 'Dupont',
                prenom: 'Jean',
                date_naissance: '1990-01-01',
                carte_rfid: 'PAT1234',
                code_pin_hashed: 'hashed_pin',
              },
            },
          ],
        }) // pending result
        .mockResolvedValueOnce({
          rows: [
            {
              id_patient: 42,
              carte_rfid: 'PAT1234',
              nom: 'Dupont',
              prenom: 'Jean',
              email: 'test@test.com',
            },
          ],
        }) // insert patient result
        .mockResolvedValueOnce({ rows: [] }); // delete pending

      await authController.verifyEmail(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Email vérifié avec succès! Vous pouvez maintenant vous connecter.',
        })
      );
      expect(sendWelcomeEmail).toHaveBeenCalled();
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      req.body = { token: 'token123', email: 'test@test.com' };
      query.mockRejectedValueOnce(new Error('Erreur de connexion DB'));

      await authController.verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Erreur lors de la vérification de l\'email',
        })
      );
    });
  });

  describe('loginPatient', () => {
    it('devrait échouer si l\'email n\'est pas encore vérifié', async () => {
      req.body = { identifier: 'test@test.com', code_pin: '1234' };
      query.mockResolvedValueOnce({
        rows: [
          {
            id_patient: 1,
            email: 'test@test.com',
            code_pin: 'hashed_correct_pin',
            email_verified: false,
            actif: true,
          },
        ],
      });

      await authController.loginPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Veuillez d'abord vérifier votre email. Consultez votre boîte de réception.",
        })
      );
    });
    it('devrait échouer si le patient n\'existe pas', async () => {
      req.body = { identifier: 'notfound@test.com', code_pin: '1234' };
      query.mockResolvedValueOnce({ rows: [] });

      await authController.loginPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Identifiants incorrects',
        })
      );
    });

    it('devrait échouer si le code PIN est incorrect', async () => {
      req.body = { identifier: 'test@test.com', code_pin: 'wrong_pin' };
      query.mockResolvedValueOnce({
        rows: [
          {
            id_patient: 1,
            email: 'test@test.com',
            code_pin: 'hashed_correct_pin',
            email_verified: true,
            actif: true,
          },
        ],
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      await authController.loginPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('devrait se connecter avec succès si PIN correct et email vérifié', async () => {
      req.body = { identifier: 'test@test.com', code_pin: '1234' };
      query.mockResolvedValueOnce({
        rows: [
          {
            id_patient: 1,
            email: 'test@test.com',
            code_pin: 'hashed_pin',
            email_verified: true,
            actif: true,
            nom: 'Dupont',
            prenom: 'Jean',
          },
        ],
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
      jest.spyOn(jwt, 'sign').mockReturnValueOnce('mocked_jwt_token');

      await authController.loginPatient(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Connexion réussie',
          data: expect.objectContaining({
            token: 'mocked_jwt_token',
          }),
        })
      );
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      req.body = { identifier: 'test@test.com', code_pin: '1234' };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await authController.loginPatient(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors de la connexion',
      });
    });
  });

  describe('getProfile', () => {
    it('devrait retourner le profil du patient connecté', async () => {
      req.user = { id: 42, type: 'patient' };
      query.mockResolvedValueOnce({
        rows: [{ id_patient: 42, nom: 'Dupont', prenom: 'Jean', type: 'patient' }],
      });

      await authController.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id_patient: 42 }),
        })
      );
    });

    it('devrait retourner le profil du médecin connecté', async () => {
      req.user = { id: 3, type: 'medecin' };
      query.mockResolvedValueOnce({
        rows: [{ id_medecin: 3, nom: 'Alami', prenom: 'Dr', type: 'medecin' }],
      });

      await authController.getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id_medecin: 3 }),
        })
      );
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      req.user = { id: 42, type: 'patient' };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await authController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors de la récupération du profil',
      });
    });
  });

  describe('loginMedecin', () => {
    it('devrait échouer si le médecin n\'existe pas', async () => {
      req.body = { identifier: 'notfound@medecin.com', code_pin: '1234' };
      query.mockResolvedValueOnce({ rows: [] });

      await authController.loginMedecin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('devrait se connecter avec succès si PIN correct', async () => {
      req.body = { identifier: 'dr.alami@test.com', code_pin: '1234' };
      query.mockResolvedValueOnce({
        rows: [
          {
            id_medecin: 3,
            email: 'dr.alami@test.com',
            code_pin: 'hashed_pin',
            actif: true,
            nom: 'Alami',
            prenom: 'Dr',
          },
        ],
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
      jest.spyOn(jwt, 'sign').mockReturnValueOnce('mocked_jwt_token_medecin');

      await authController.loginMedecin(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: 'mocked_jwt_token_medecin',
          }),
        })
      );
    });

    it('devrait échouer si le PIN est incorrect', async () => {
      req.body = { identifier: 'dr.alami@test.com', code_pin: 'wrong_pin' };
      query.mockResolvedValueOnce({
        rows: [
          {
            id_medecin: 3,
            email: 'dr.alami@test.com',
            code_pin: 'hashed_correct_pin',
            actif: true,
          },
        ],
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      await authController.loginMedecin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      req.body = { identifier: 'dr.alami@test.com', code_pin: '1234' };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await authController.loginMedecin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors de la connexion',
      });
    });
  });

  describe('requestResetPin', () => {
    it('devrait retourner un message de succès même si le patient n\'est pas trouvé (sécurité)', async () => {
      req.body = { identifier: 'unknown@test.com' };
      query.mockResolvedValueOnce({ rows: [] });

      await authController.requestResetPin(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Si un compte correspond à cet identifiant, un email de réinitialisation a été envoyé.',
      });
    });

    it('devrait générer un token de réinitialisation et appeler sendResetPinEmail', async () => {
      req.body = { identifier: 'patient@test.com' };
      query
        .mockResolvedValueOnce({
          rows: [{ id_patient: 1, email: 'patient@test.com', nom: 'Dupont', prenom: 'Jean' }],
        })
        .mockResolvedValueOnce({ rows: [] }); // update patient token

      await authController.requestResetPin(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Si un compte correspond à cet identifiant, un email de réinitialisation a été envoyé.',
      });
    });

    it('devrait échouer si aucun email n\'est associé au compte trouvé', async () => {
      req.body = { identifier: 'patient_no_email' };
      query.mockResolvedValueOnce({
        rows: [{ id_patient: 1, email: null, nom: 'Dupont', prenom: 'Jean' }],
      });

      await authController.requestResetPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Aucun email associé à ce compte pour la récupération.',
      });
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      req.body = { identifier: 'patient@test.com' };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await authController.requestResetPin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors de la demande de réinitialisation',
      });
    });
  });

  describe('resetPin', () => {
    it('devrait échouer si des champs requis sont manquants', async () => {
      req.body = { token: 'tok123' }; // email et code_pin manquants

      await authController.resetPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('devrait échouer si le token est invalide ou expiré', async () => {
      req.body = { token: 'tok123', email: 'test@test.com', code_pin: '1234' };
      query.mockResolvedValueOnce({ rows: [] });

      await authController.resetPin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token invalide ou expiré',
      });
    });

    it('devrait réinitialiser le PIN avec succès si le token est valide', async () => {
      req.body = { token: 'tok123', email: 'test@test.com', code_pin: '1234' };
      query
        .mockResolvedValueOnce({ rows: [{ id_patient: 42 }] }) // token valide
        .mockResolvedValueOnce({ rows: [] }); // update pin

      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('new_hashed_pin');

      await authController.resetPin(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Votre code PIN a été réinitialisé avec succès.',
      });
    });

    it('devrait retourner une erreur 500 en cas de problème de base de données', async () => {
      req.body = { token: 'tok123', email: 'test@test.com', code_pin: '1234' };
      query.mockRejectedValueOnce(new Error('Erreur DB'));

      await authController.resetPin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors de la réinitialisation du code PIN',
      });
    });
  });
});

