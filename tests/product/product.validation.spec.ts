import { config } from '../../src/config';
import { CREATE_PRODUCT } from '../../src/client/operations';
import { TenantApi } from '../../src/helpers/api';
import { ResourceTracker } from '../../src/helpers/cleanup';
import { buildProductInput } from '../../src/helpers/factories';
import { expectGraphQLError } from '../../src/helpers/errors';

describe('Product input validation and edge cases', () => {
  const api = new TenantApi(config.tenants.a);
  const tracker = new ResourceTracker();

  afterEach(async () => {
    await tracker.cleanup();
  });

  describe('schema-level (non-null / typing) enforcement', () => {
    it('rejects creation when the required name is missing', async () => {
      await expectGraphQLError(
        api.raw(CREATE_PRODUCT, { input: { price: 10 } }),
        /name/i,
      );
    });

    it('rejects creation when the required price is missing', async () => {
      await expectGraphQLError(
        api.raw(CREATE_PRODUCT, { input: { name: 'No Price' } }),
        /price/i,
      );
    });

    it('rejects an invalid enum value for status', async () => {
      await expectGraphQLError(
        api.raw(CREATE_PRODUCT, {
          input: { name: 'Bad Status', price: 10, status: 'PURPLE' },
        }),
        /status|enum|PURPLE/i,
      );
    });
  });

  describe('value-level validation', () => {
    it('preserves decimal precision on price', async () => {
      const product = await api.createProduct(
        buildProductInput({ name: 'Decimal Price', price: 19.99 }),
      );
      tracker.trackProduct(api, product.id);

      expect(product.price).toBe(19.99);
    });

    it('rejects a negative price', async () => {
      await expectGraphQLError(
        api.createProduct(buildProductInput({ name: 'Negative Price', price: -5 })),
        /price/i,
      );
    });

    it('rejects an empty product name', async () => {
      await expectGraphQLError(
        api.createProduct(buildProductInput({ name: '', price: 10 })),
        /name/i,
      );
    });
  });
});
