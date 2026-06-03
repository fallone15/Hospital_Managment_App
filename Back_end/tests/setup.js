// Configuration des variables d'environnement pour l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_jsonwebtoken_validation';
process.env.JWT_EXPIRES_IN = '24h';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.DB_NAME = 'hospital_test';
process.env.FRONTEND_URL = 'http://localhost:5502';

// Mocker console.log et console.error dans les tests pour éviter de polluer la console
console.log = jest.fn();
console.error = jest.fn();
