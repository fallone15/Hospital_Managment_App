module.exports = {
  // Spécifie l'environnement de test (Node.js pour notre backend)
  testEnvironment: 'node',

  // Dossiers à ignorer lors de la recherche de tests
  testPathIgnorePatterns: ['/node_modules/'],

  // Expression régulière pour trouver les fichiers de test
  testMatch: ['**/tests/**/*.test.js'],

  // Collecte de la couverture de code
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],

  // Configuration de l'environnement (variables fictives pour éviter les crashs)
  setupFiles: ['./tests/setup.js'],

  // Mode verbeux
  verbose: true,
};
