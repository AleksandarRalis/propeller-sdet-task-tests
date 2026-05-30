import { gql } from 'graphql-request';
import { config } from '../../src/config';
import { GET_PRODUCT, UPDATE_PRODUCT } from '../../src/client/operations';
import { TenantApi } from '../../src/helpers/api';
import { expectGraphQLError } from '../../src/helpers/errors';

describe('Error handling for invalid operations', () => {
  const api = new TenantApi(config.tenants.a);
  const NON_EXISTENT_ID = 999999999;

  describe('not-found semantics', () => {
    it('returns a not-found error when querying a non-existent product', async () => {
      await expectGraphQLError(
        api.getProduct(NON_EXISTENT_ID),
        new RegExp(`Product with ID ${NON_EXISTENT_ID} not found`, 'i'),
      );
    });

    it('returns a not-found error when querying a non-existent image', async () => {
      await expectGraphQLError(
        api.getImage(NON_EXISTENT_ID),
        new RegExp(`Image with ID ${NON_EXISTENT_ID} not found`, 'i'),
      );
    });

    it('returns a not-found error when updating a non-existent product', async () => {
      await expectGraphQLError(
        api.updateProduct(NON_EXISTENT_ID, { name: 'Ghost' }),
        /not found/i,
      );
    });

    it('returns a not-found error when deleting a non-existent product', async () => {
      await expectGraphQLError(api.deleteProduct(NON_EXISTENT_ID), /not found/i);
    });
  });

  describe('malformed and invalid requests', () => {
    it('rejects a syntactically malformed query', async () => {
      await expectGraphQLError(
        api.raw('query { products { id '),
        /syntax|expected|unexpected/i,
      );
    });

    it('rejects a query for a field that does not exist on the type', async () => {
      await expectGraphQLError(
        api.raw(gql`
          query {
            products {
              id
              nonExistentField
            }
          }
        `),
        /nonExistentField|cannot query field/i,
      );
    });

    it('rejects a wrongly typed argument (string where Int is required)', async () => {
      await expectGraphQLError(
        api.raw(GET_PRODUCT, { id: 'not-a-number' }),
        /Int|type/i,
      );
    });

    it('rejects a query that omits a required argument', async () => {
      await expectGraphQLError(
        api.raw(gql`
          query {
            product {
              id
            }
          }
        `),
        /id|required|argument/i,
      );
    });

    it('rejects an operation against an unknown root field', async () => {
      await expectGraphQLError(
        api.raw(gql`
          query {
            unknownRootQuery {
              id
            }
          }
        `),
        /unknownRootQuery|cannot query field/i,
      );
    });

    it('rejects an update with no resolvable variables', async () => {
      await expectGraphQLError(
        api.raw(UPDATE_PRODUCT, { id: NON_EXISTENT_ID }),
        /input|required|variable/i,
      );
    });
  });
});
