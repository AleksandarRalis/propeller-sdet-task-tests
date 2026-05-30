import { config } from '../../src/config';
import { TenantApi } from '../../src/helpers/api';
import { ResourceTracker } from '../../src/helpers/cleanup';
import { buildImageInput, buildProductInput } from '../../src/helpers/factories';
import { expectGraphQLError } from '../../src/helpers/errors';

describe('Image CRUD', () => {
  const api = new TenantApi(config.tenants.a);
  const tracker = new ResourceTracker();

  afterEach(async () => {
    await tracker.cleanup();
  });

  describe('createImage', () => {
    it('creates a standalone (orphan) image with no product attached', async () => {
      const input = buildImageInput({ priority: 25 });

      const image = await api.createImage(input);
      tracker.trackImage(api, image.id);

      expect(Number(image.id)).toBeGreaterThan(0);
      expect(image.url).toBe(input.url);
      expect(image.priority).toBe(25);
      expect(image.tenantId).toBe(config.tenants.a);
      expect(image.productId == null).toBe(true);
    });

    it('creates an image linked to a product', async () => {
      const product = await api.createProduct(buildProductInput());
      tracker.trackProduct(api, product.id);

      const image = await api.createImage(
        buildImageInput({ productId: Number(product.id) }),
      );
      tracker.trackImage(api, image.id);

      expect(image.productId).toBe(Number(product.id));
    });
  });

  describe('image / images (read)', () => {
    it('reads a single image back by id', async () => {
      const created = await api.createImage(buildImageInput());
      tracker.trackImage(api, created.id);

      const fetched = await api.getImage(created.id);

      expect(fetched.id).toBe(created.id);
      expect(fetched.url).toBe(created.url);
    });

    it('lists images filtered by productId', async () => {
      const product = await api.createProduct(buildProductInput());
      tracker.trackProduct(api, product.id);

      const linked = await api.createImage(
        buildImageInput({ productId: Number(product.id) }),
      );
      tracker.trackImage(api, linked.id);

      const orphan = await api.createImage(buildImageInput());
      tracker.trackImage(api, orphan.id);

      const images = await api.listImages(Number(product.id));
      const ids = images.map((i) => i.id);

      expect(ids).toContain(linked.id);
      expect(ids).not.toContain(orphan.id);
      expect(images.every((i) => i.productId === Number(product.id))).toBe(true);
    });
  });

  describe('updateImage', () => {
    it('updates url and priority', async () => {
      const created = await api.createImage(buildImageInput({ priority: 100 }));
      tracker.trackImage(api, created.id);

      const updated = await api.updateImage(created.id, {
        url: 'https://cdn.example.com/updated.jpg',
        priority: 250,
      });

      expect(updated.url).toBe('https://cdn.example.com/updated.jpg');
      expect(updated.priority).toBe(250);
    });
  });

  describe('deleteImage', () => {
    it('returns true and removes the image so it can no longer be read', async () => {
      const created = await api.createImage(buildImageInput());

      const result = await api.deleteImage(created.id);
      expect(result).toBe(true);

      await expectGraphQLError(api.getImage(created.id), /not found/i);
    });
  });
});
