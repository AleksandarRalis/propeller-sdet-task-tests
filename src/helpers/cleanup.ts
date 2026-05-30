import { TenantApi } from './api';

interface TrackedResource {
  api: TenantApi;
  id: number | string;
}

/**
 * Tracks records created during a test so they can be removed afterwards,
 * keeping the database clean and tests independent of one another.
 *
 * Images are deleted before products to respect the foreign-key relationship,
 * and all deletions are best-effort: a record already removed by the test
 * itself (e.g. a delete-flow spec) is silently ignored.
 */
export class ResourceTracker {
  private readonly products: TrackedResource[] = [];
  private readonly images: TrackedResource[] = [];

  trackProduct(api: TenantApi, id: number | string): void {
    this.products.push({ api, id });
  }

  trackImage(api: TenantApi, id: number | string): void {
    this.images.push({ api, id });
  }

  async cleanup(): Promise<void> {
    await this.removeAll(this.images, (r) => r.api.deleteImage(r.id));
    await this.removeAll(this.products, (r) => r.api.deleteProduct(r.id));
    this.images.length = 0;
    this.products.length = 0;
  }

  private async removeAll(
    resources: TrackedResource[],
    remove: (resource: TrackedResource) => Promise<unknown>,
  ): Promise<void> {
    await Promise.all(
      resources.map(async (resource) => {
        try {
          await remove(resource);
        } catch {
          // Already gone or not owned by this tenant; nothing to clean up.
        }
      }),
    );
  }
}
