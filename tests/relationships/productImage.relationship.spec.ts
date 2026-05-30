import { config } from '../../src/config';
import { TenantApi } from '../../src/helpers/api';
import { ResourceTracker } from '../../src/helpers/cleanup';
import { buildImageInput, buildProductInput } from '../../src/helpers/factories';

describe('Product <-> Image relationships', () => {
  const api = new TenantApi(config.tenants.a);
  const tracker = new ResourceTracker();

  afterEach(async () => {
    await tracker.cleanup();
  });

  it('exposes attached images through the product.images relation', async () => {
    const product = await api.createProduct(buildProductInput());
    tracker.trackProduct(api, product.id);

    const first = await api.createImage(
      buildImageInput({ productId: Number(product.id), priority: 100 }),
    );
    const second = await api.createImage(
      buildImageInput({ productId: Number(product.id), priority: 200 }),
    );
    tracker.trackImage(api, first.id);
    tracker.trackImage(api, second.id);

    const withImages = await api.getProductWithImages(product.id);
    const imageIds = (withImages.images ?? []).map((i) => i.id).sort();

    expect(imageIds).toEqual([first.id, second.id].sort());
  });

  it('exposes the parent product through the image.product relation', async () => {
    const product = await api.createProduct(buildProductInput());
    tracker.trackProduct(api, product.id);

    const image = await api.createImage(
      buildImageInput({ productId: Number(product.id) }),
    );
    tracker.trackImage(api, image.id);

    const withProduct = await api.getImageWithProduct(image.id);

    expect(withProduct.product?.id).toBe(product.id);
    expect(withProduct.product?.name).toBe(product.name);
  });

  it('returns an empty image collection for a product with no images', async () => {
    const product = await api.createProduct(buildProductInput());
    tracker.trackProduct(api, product.id);

    const withImages = await api.getProductWithImages(product.id);

    expect(withImages.images ?? []).toEqual([]);
  });

  it('treats an orphan image as having no product', async () => {
    const orphan = await api.createImage(buildImageInput());
    tracker.trackImage(api, orphan.id);

    const fetched = await api.getImageWithProduct(orphan.id);

    expect(fetched.productId == null).toBe(true);
    expect(fetched.product == null).toBe(true);
  });

  it('reassigns an image from one product to another', async () => {
    const productA = await api.createProduct(buildProductInput());
    const productB = await api.createProduct(buildProductInput());
    tracker.trackProduct(api, productA.id);
    tracker.trackProduct(api, productB.id);

    const image = await api.createImage(
      buildImageInput({ productId: Number(productA.id) }),
    );
    tracker.trackImage(api, image.id);

    await api.updateImage(image.id, { productId: Number(productB.id) });

    const movedFrom = await api.getProductWithImages(productA.id);
    const movedTo = await api.getProductWithImages(productB.id);

    expect((movedFrom.images ?? []).map((i) => i.id)).not.toContain(image.id);
    expect((movedTo.images ?? []).map((i) => i.id)).toContain(image.id);
  });

  it('leaves the parent product intact when one of its images is deleted', async () => {
    const product = await api.createProduct(buildProductInput());
    tracker.trackProduct(api, product.id);

    const image = await api.createImage(
      buildImageInput({ productId: Number(product.id) }),
    );

    await api.deleteImage(image.id);

    const stillThere = await api.getProduct(product.id);
    expect(stillThere.id).toBe(product.id);
  });
});
