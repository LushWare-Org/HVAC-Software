import type { Config } from 'jest';

const config: Config = {
  // TypeScript support
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Seed the CRM database once before all test suites run
  // (ensures company 'co-demo-001' exists — required by FK constraints)
  globalSetup: './helpers/global-setup.js',

  // Only match our numbered flow test files
  testMatch: ['**/?(*.)+(spec|test).ts'],

  // Run flow files in alphabetical (numerical) order
  // 01- before 02- before 03- etc.
  testSequencer: undefined,

  // Generous timeout — flows make real HTTP requests to running services
  testTimeout: 30000,

  // TypeScript transformation
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          strict: false,
          esModuleInterop: true,
          resolveJsonModule: true,
        },
      },
    ],
  },

  // Clean module cache between files (do NOT clearMocks — we need shared state)
  clearMocks: false,
  resetMocks: false,
  restoreMocks: false,

  // Pretty output
  verbose: true,

  // Exit after all tests complete (don't hang on open handles)
  forceExit: true,

  // Show individual test names
  displayName: {
    name: 'T&S CRM Flow Tests',
    color: 'cyan',
  },
};

export default config;
