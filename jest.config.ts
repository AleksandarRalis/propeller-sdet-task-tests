import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.spec.ts'],
  setupFiles: ['<rootDir>/src/setup.ts'],
  testTimeout: 30000,
  clearMocks: true,
  verbose: true,
};

export default config;
