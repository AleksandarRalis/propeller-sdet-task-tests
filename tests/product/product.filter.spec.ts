import { config } from '../../src/config';
import { TenantApi } from '../../src/helpers/api';
import { ResourceTracker } from '../../src/helpers/cleanup';
import { buildProductInput, uniqueToken } from '../../src/helpers/factories';
import { Product, ProductStatus } from '../../src/types/api';

/**
 * Filtering is verified against a private set of products that all share a
 * unique name token. Filtering by that token isolates this suite's data from
 * any seed data, so the assertions stay deterministic.
 */
describe('Product filtering', () => {
  const api = new TenantApi(config.tenants.a);
  const tracker = new ResourceTracker();
  const token = uniqueToken();

  let cheapActive: Product;
  let midActive: Product;
  let expensiveInactive: Product;

  beforeAll(async () => {
    cheapActive = await api.createProduct(
      buildProductInput({ name: `${token} Widget`, price: 10, status: ProductStatus.ACTIVE }),
    );
    midActive = await api.createProduct(
      buildProductInput({ name: `${token} Gadget`, price: 50, status: ProductStatus.ACTIVE }),
    );
    expensiveInactive = await api.createProduct(
      buildProductInput({ name: `${token} Gizmo`, price: 100, status: ProductStatus.INACTIVE }),
    );

    [cheapActive, midActive, expensiveInactive].forEach((p) =>
      tracker.trackProduct(api, p.id),
    );
  });

  afterAll(async () => {
    await tracker.cleanup();
  });

  const idsOf = (products: Product[]) => products.map((p) => p.id).sort();

  describe('by name', () => {
    it('matches a partial substring', async () => {
      const results = await api.listProducts({ name: token });
      expect(idsOf(results)).toEqual(
        idsOf([cheapActive, midActive, expensiveInactive]),
      );
    });

    it('is case-insensitive', async () => {
      const results = await api.listProducts({ name: token.toUpperCase() });
      expect(idsOf(results)).toEqual(
        idsOf([cheapActive, midActive, expensiveInactive]),
      );
    });

    it('returns an empty list when nothing matches', async () => {
      const results = await api.listProducts({ name: `no-such-product-${uniqueToken()}` });
      expect(results).toEqual([]);
    });
  });

  describe('by status', () => {
    it('returns only ACTIVE products when filtering by ACTIVE', async () => {
      const results = await api.listProducts({ name: token, status: ProductStatus.ACTIVE });

      expect(results.every((p) => p.status === ProductStatus.ACTIVE)).toBe(true);
      expect(idsOf(results)).toEqual(idsOf([cheapActive, midActive]));
    });

    it('returns only INACTIVE products when filtering by INACTIVE', async () => {
      const results = await api.listProducts({ name: token, status: ProductStatus.INACTIVE });

      expect(results.every((p) => p.status === ProductStatus.INACTIVE)).toBe(true);
      expect(idsOf(results)).toEqual(idsOf([expensiveInactive]));
    });
  });

  describe('by price range', () => {
    it('applies minPrice (inclusive lower bound)', async () => {
      const results = await api.listProducts({ name: token, minPrice: 50 });
      expect(idsOf(results)).toEqual(idsOf([midActive, expensiveInactive]));
    });

    it('applies maxPrice (inclusive upper bound)', async () => {
      const results = await api.listProducts({ name: token, maxPrice: 50 });
      expect(idsOf(results)).toEqual(idsOf([cheapActive, midActive]));
    });

    it('applies a combined min/max price window', async () => {
      const results = await api.listProducts({ name: token, minPrice: 40, maxPrice: 60 });
      expect(idsOf(results)).toEqual(idsOf([midActive]));
    });
  });

  describe('combined filters', () => {
    it('intersects name, status and price filters', async () => {
      const results = await api.listProducts({
        name: token,
        status: ProductStatus.ACTIVE,
        minPrice: 40,
      });
      expect(idsOf(results)).toEqual(idsOf([midActive]));
    });
  });
});
