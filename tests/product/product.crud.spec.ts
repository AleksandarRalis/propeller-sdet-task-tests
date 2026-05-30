import { config } from '../../src/config';
import { TenantApi } from '../../src/helpers/api';
import { ResourceTracker } from '../../src/helpers/cleanup';
import { buildProductInput } from '../../src/helpers/factories';
import { expectGraphQLError } from '../../src/helpers/errors';
import { ProductStatus } from '../../src/types/api';

describe('Product CRUD', () => {
  const api = new TenantApi(config.tenants.a);
  const tracker = new ResourceTracker();

  afterEach(async () => {
    await tracker.cleanup();
  });

  describe('createProduct', () => {
    it('creates a product and returns it with a generated id and tenant scope', async () => {
      const input = buildProductInput({ name: 'Crud Create Product', price: 50 });

      const product = await api.createProduct(input);
      tracker.trackProduct(api, product.id);

      expect(product.id).toBeDefined();
      expect(Number(product.id)).toBeGreaterThan(0);
      expect(product.name).toBe(input.name);
      expect(product.price).toBe(input.price);
      expect(product.status).toBe(ProductStatus.ACTIVE);
      expect(product.tenantId).toBe(config.tenants.a);
    });

    it('defaults status to ACTIVE when none is provided', async () => {
      const product = await api.createProduct({
        name: `Default Status ${Date.now()}`,
        price: 10,
      });
      tracker.trackProduct(api, product.id);

      expect(product.status).toBe(ProductStatus.ACTIVE);
    });

    it('honours an explicit INACTIVE status', async () => {
      const product = await api.createProduct(
        buildProductInput({ status: ProductStatus.INACTIVE }),
      );
      tracker.trackProduct(api, product.id);

      expect(product.status).toBe(ProductStatus.INACTIVE);
    });
  });

  describe('product / products (read)', () => {
    it('reads a single product back by id', async () => {
      const created = await api.createProduct(buildProductInput());
      tracker.trackProduct(api, created.id);

      const fetched = await api.getProduct(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.name).toBe(created.name);
    });

    it('includes a newly created product in the products listing', async () => {
      const created = await api.createProduct(
        buildProductInput({ name: `Listable ${Date.now()}` }),
      );
      tracker.trackProduct(api, created.id);

      const products = await api.listProducts({ name: created.name });
      const ids = products.map((p) => p.id);

      expect(ids).toContain(created.id);
    });
  });

  describe('updateProduct', () => {
    it('updates name, price and status', async () => {
      const created = await api.createProduct(buildProductInput());
      tracker.trackProduct(api, created.id);

      const updated = await api.updateProduct(created.id, {
        name: 'Renamed Product',
        price: 130,
        status: ProductStatus.INACTIVE,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Renamed Product');
      expect(updated.price).toBe(130);
      expect(updated.status).toBe(ProductStatus.INACTIVE);
    });

    it('performs partial updates without clobbering untouched fields', async () => {
      const created = await api.createProduct(
        buildProductInput({ name: 'Keep My Name', price: 50 }),
      );
      tracker.trackProduct(api, created.id);

      const updated = await api.updateProduct(created.id, { price: 75 });

      expect(updated.name).toBe('Keep My Name');
      expect(updated.price).toBe(75);
    });

    it('persists updates so a subsequent read reflects them', async () => {
      const created = await api.createProduct(buildProductInput());
      tracker.trackProduct(api, created.id);

      await api.updateProduct(created.id, { name: 'Persisted Name' });
      const reread = await api.getProduct(created.id);

      expect(reread.name).toBe('Persisted Name');
    });
  });

  describe('deleteProduct', () => {
    it('returns true and removes the product so it can no longer be read', async () => {
      const created = await api.createProduct(buildProductInput());

      const result = await api.deleteProduct(created.id);
      expect(result).toBe(true);

      await expectGraphQLError(api.getProduct(created.id), /not found/i);
    });
  });
});
