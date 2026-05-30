import { ClientError } from 'graphql-request';

/**
 * Asserts that a GraphQL operation rejects with at least one error whose
 * message matches `messageMatcher`. Returns the matched message so callers can
 * make further assertions if needed.
 *
 * graphql-request throws a `ClientError` for GraphQL-level errors (the HTTP
 * response is 200 but the body carries an `errors` array). This helper unwraps
 * that structure so individual specs don't have to.
 */
export async function expectGraphQLError(
  operation: Promise<unknown>,
  messageMatcher: RegExp | string,
): Promise<string> {
  try {
    await operation;
  } catch (error) {
    if (!(error instanceof ClientError)) {
      throw new Error(
        `Expected a GraphQL ClientError but received: ${String(error)}`,
      );
    }

    const messages = (error.response.errors ?? []).map((e) => e.message);
    expect(messages.length).toBeGreaterThan(0);

    const matcher =
      typeof messageMatcher === 'string'
        ? new RegExp(escapeRegExp(messageMatcher), 'i')
        : messageMatcher;

    const matched = messages.find((message) => matcher.test(message));
    if (!matched) {
      throw new Error(
        `No GraphQL error matched ${matcher}. Actual errors: ${JSON.stringify(messages)}`,
      );
    }
    return matched;
  }

  throw new Error('Expected the operation to throw a GraphQL error, but it resolved.');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
