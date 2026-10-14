/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }] },
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  // Swap the expo-sqlite DataSource for an in-memory better-sqlite3 one in every import.
  moduleNameMapper: { '^(\\.{1,2}/)+(db/)?data-source$': '<rootDir>/src/tests/test-data-source.ts' },
};
