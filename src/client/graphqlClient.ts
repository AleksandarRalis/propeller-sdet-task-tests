import { GraphQLClient } from 'graphql-request';
import { config } from '../config';

/**
 * Builds a GraphQLClient bound to a single tenant.
 *
 * Every request the returned client makes carries the `x-tenant-id` header,
 * which is how the API scopes data per tenant. Passing `undefined` produces a
 * client with no tenant header, which is useful for exercising the API's
 * default-tenant fallback behaviour.
 */
export function clientFor(tenantId?: string): GraphQLClient {
  return new GraphQLClient(config.apiUrl, {
    headers: tenantId ? { 'x-tenant-id': tenantId } : {},
  });
}
