import { config } from '../../src/config';
import { TenantApi } from '../../src/helpers/api';
import { ResourceTracker } from '../../src/helpers/cleanup';
import { buildProductInput, uniqueToken } from '../../src/helpers/factories';
import { Product } from '../../src/types/api';

/**
 * Pagination is verified against a private, ordered set of products sharing a
 * unique name token. We assume the API returns rows in ascending id order
 * (insertion order), which holds for a freshly created, isolated set.
 */
describe('Product pagination', () => {
  const api = new TenantApi(config.tenants.a);
  const tracker = new ResourceTracker();
  const token = uniqueToken();
  const TOTAL = 5;

  let createdIdsAsc: number[] = [];

  beforeAll(async () => {
    const created: Product[] = [];
    for (let i = 0; i < TOTAL; i++) {
      const product = await api.createProduct(
        buildProductInput({ name: `${token} Page Item ${i}`, price: 10 + i }),
      );
      created.push(product);
      tracker.trackProduct(api, product.id);
    }
    createdIdsAsc = created.map((p) => Number(p.id)).sort((a, b) => a - b);
  });

  afterAll(async () => {
    await tracker.cleanup();
  });

  const pageIds = (products: Product[]) => products.map((p) => Number(p.id));

  it('limits a page to pageSize results', async () => {
    const page = await api.listProducts({ name: token }, 1, 2);
    expect(page.length).toBeLessThanOrEqual(2);
  });

  it('returns the earliest items on the first page (offset starts at zero)', async () => {
    const page = await api.listProducts({ name: token }, 1, 2);
    const expectedFirstPage = createdIdsAsc.slice(0, 2);

    expect(pageIds(page).sort((a, b) => a - b)).toEqual(expectedFirstPage);
  });

  it('walks every record across pages with no gaps or overlaps', async () => {
    const pageSize = 2;
    const seen: number[] = [];

    for (let page = 1; page <= Math.ceil(TOTAL / pageSize); page++) {
      const results = await api.listProducts({ name: token }, page, pageSize);
      seen.push(...pageIds(results));
    }

    expect(seen.sort((a, b) => a - b)).toEqual(createdIdsAsc);
    expect(new Set(seen).size).toBe(TOTAL);
  });

  it('returns an empty page once results are exhausted', async () => {
    const beyondLastPage = Math.ceil(TOTAL / 2) + 2;
    const results = await api.listProducts({ name: token }, beyondLastPage, 2);
    expect(results).toEqual([]);
  });
});
