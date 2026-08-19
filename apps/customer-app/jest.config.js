/**
 * Tests here cover pure logic only (no React Native renderer), so ts-jest in a
 * node environment is enough and avoids the heavyweight RN preset.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    // expo-constants ships ESM and needs a native runtime; unit tests here are
    // pure logic, so a stub keeps them running without the RN jest preset.
    '^expo-constants$': '<rootDir>/src/test/expo-constants-stub.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { module: 'commonjs', strict: true, esModuleInterop: true } },
    ],
  },
}
