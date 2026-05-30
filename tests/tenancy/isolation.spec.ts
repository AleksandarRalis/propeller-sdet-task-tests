import { config } from '../../src/config';
import { TenantApi } from '../../src/helpers/api';
import { ResourceTracker } from '../../src/helpers/cleanup';
import { buildImageInput, buildProductInput, uniqueToken } from '../../src/helpers/factories';
import { expectGraphQLError } from '../../src/helpers/errors';

/**
 * Data isolation is enforced via the `x-tenant-id` header. Tenant A owns the
 * fixtures below; tenant B (and an anonymous/default client) must never be able
 * to read or mutate them.
 */
describe('Multi-tenant data isolation', () => {
  const tenantA = new TenantApi(config.tenants.a);
  const tenantB = new TenantApi(config.tenants.b);
  const anonymous = new TenantApi(undefined);
  const tracker = new ResourceTracker();
  const token = uniqueToken();

  let productA: Awaited<ReturnType<TenantApi['createProduct']>>;
  let imageA: Awaited<ReturnType<TenantApi['createImage']>>;

  beforeAll(async () => {
    productA = await tenantA.createProduct(
      buildProductInput({ name: `${token} Tenant A Product` }),
    );
    imageA = await tenantA.createImage(
      buildImageInput({ productId: Number(productA.id) }),
    );
    tracker.trackImage(tenantA, imageA.id);
    tracker.trackProduct(tenantA, productA.id);
  });

  afterAll(async () => {
    await tracker.cleanup();
  });

  describe('products', () => {
    it('lets the owning tenant read its own product', async () => {
      const fetched = await tenantA.getProduct(productA.id);
      expect(fetched.id).toBe(productA.id);
    });

    it('hides another tenant\'s product on direct lookup', async () => {
      await expectGraphQLError(tenantB.getProduct(productA.id), /not found/i);
    });

    it('hides another tenant\'s product from anonymous/default clients', async () => {
      await expectGraphQLError(anonymous.getProduct(productA.id), /not found/i);
    });

    it('excludes another tenant\'s product from listings', async () => {
      const results = await tenantB.listProducts({ name: token });
      expect(results.map((p) => p.id)).not.toContain(productA.id);
    });

    it('forbids another tenant from updating the product', async () => {
      await expectGraphQLError(
        tenantB.updateProduct(productA.id, { name: 'Hijacked' }),
        /not found/i,
      );
    });

    it('forbids another tenant from deleting the product', async () => {
      await expectGraphQLError(tenantB.deleteProduct(productA.id), /not found/i);
    });
  });

  describe('images', () => {
    it('lets the owning tenant read its own image', async () => {
      const fetched = await tenantA.getImage(imageA.id);
      expect(fetched.id).toBe(imageA.id);
    });

    it('hides another tenant\'s image on direct lookup', async () => {
      await expectGraphQLError(tenantB.getImage(imageA.id), /not found/i);
    });

    it('forbids another tenant from updating the image', async () => {
      await expectGraphQLError(
        tenantB.updateImage(imageA.id, { priority: 5 }),
        /not found/i,
      );
    });

    it('forbids another tenant from deleting the image', async () => {
      await expectGraphQLError(tenantB.deleteImage(imageA.id), /not found/i);
    });
  });
});
