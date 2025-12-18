module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['/node_modules/', '/frontend/'],
  testMatch: ['**/__tests__/**/*.test.js'], // Only run .test.js files
  verbose: true,
  testTimeout: 30000, // 30 seconds for MongoDB memory server
  forceExit: true,
  detectOpenHandles: true
};