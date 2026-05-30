import { config } from '../../src/config';
import { CREATE_IMAGE } from '../../src/client/operations';
import { TenantApi } from '../../src/helpers/api';
import { ResourceTracker } from '../../src/helpers/cleanup';
import { buildImageInput } from '../../src/helpers/factories';
import { expectGraphQLError } from '../../src/helpers/errors';

/**
 * Per the API docs, `priority` has a minimum of 1, a maximum of 1000 and a
 * default of 100. These specs encode that contract plus schema-level checks.
 */
describe('Image input validation and edge cases', () => {
  const api = new TenantApi(config.tenants.a);
  const tracker = new ResourceTracker();

  afterEach(async () => {
    await tracker.cleanup();
  });

  describe('schema-level enforcement', () => {
    it('rejects creation when the required url is missing', async () => {
      await expectGraphQLError(
        api.raw(CREATE_IMAGE, { input: { priority: 100 } }),
        /url/i,
      );
    });
  });

  describe('priority defaulting and bounds', () => {
    it('defaults priority to 100 when omitted', async () => {
      const image = await api.createImage({
        url: 'https://cdn.example.com/no-priority.jpg',
      });
      tracker.trackImage(api, image.id);

      expect(image.priority).toBe(100);
    });

    it('accepts the minimum valid priority (1)', async () => {
      const image = await api.createImage(buildImageInput({ priority: 1 }));
      tracker.trackImage(api, image.id);

      expect(image.priority).toBe(1);
    });

    it('accepts the maximum valid priority (1000)', async () => {
      const image = await api.createImage(buildImageInput({ priority: 1000 }));
      tracker.trackImage(api, image.id);

      expect(image.priority).toBe(1000);
    });

    it('rejects a priority below the minimum', async () => {
      await expectGraphQLError(
        api.createImage(buildImageInput({ priority: 0 })),
        /priority/i,
      );
    });

    it('rejects a priority above the maximum', async () => {
      await expectGraphQLError(
        api.createImage(buildImageInput({ priority: 1001 })),
        /priority/i,
      );
    });
  });

  describe('relationship integrity', () => {
    it('rejects linking an image to a non-existent product', async () => {
      await expectGraphQLError(
        api.createImage(buildImageInput({ productId: 999999999 })),
        /\S/,
      );
    });
  });
});
