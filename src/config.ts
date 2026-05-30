/**
 * Central configuration for the test suite, sourced from environment
 * variables with sensible defaults that match the API's docker-compose setup.
 */
export const config = {
  /** Base URL of the GraphQL API under test. */
  apiUrl: process.env.API_URL ?? 'http://localhost:3000/graphql',

  /** Two distinct tenants used to assert multi-tenant data isolation. */
  tenants: {
    a: process.env.TENANT_A ?? 'tenant-a',
    b: process.env.TENANT_B ?? 'tenant-b',
  },
} as const;
