import { clientFor } from '../client/graphqlClient';
import {
  CREATE_IMAGE,
  CREATE_PRODUCT,
  DELETE_IMAGE,
  DELETE_PRODUCT,
  GET_IMAGE,
  GET_IMAGES,
  GET_IMAGE_WITH_PRODUCT,
  GET_PRODUCT,
  GET_PRODUCTS,
  GET_PRODUCT_WITH_IMAGES,
  UPDATE_IMAGE,
  UPDATE_PRODUCT,
} from '../client/operations';
import {
  CreateImageInput,
  CreateProductInput,
  Image,
  Product,
  ProductFilterInput,
  UpdateImageInput,
  UpdateProductInput,
} from '../types/api';

/**
 * Thin, typed facade over the GraphQL client + operation documents.
 *
 * Each instance is bound to a single tenant so specs read naturally, e.g.
 * `tenantA.createProduct(...)`. This removes raw `request(...)` boilerplate
 * from the specs and keeps the operation/field selection in one place.
 */
export class TenantApi {
  private readonly client;

  constructor(public readonly tenantId?: string) {
    this.client = clientFor(tenantId);
  }

  /* ------------------------------- Products ------------------------------- */

  async listProducts(
    filter?: ProductFilterInput,
    page?: number,
    pageSize?: number,
  ): Promise<Product[]> {
    const data = await this.client.request<{ products: Product[] }>(GET_PRODUCTS, {
      filter,
      page,
      pageSize,
    });
    return data.products;
  }

  async getProduct(id: number | string): Promise<Product> {
    const data = await this.client.request<{ product: Product }>(GET_PRODUCT, {
      id: Number(id),
    });
    return data.product;
  }

  async getProductWithImages(id: number | string): Promise<Product> {
    const data = await this.client.request<{ product: Product }>(
      GET_PRODUCT_WITH_IMAGES,
      { id: Number(id) },
    );
    return data.product;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const data = await this.client.request<{ createProduct: Product }>(
      CREATE_PRODUCT,
      { input },
    );
    return data.createProduct;
  }

  async updateProduct(
    id: number | string,
    input: UpdateProductInput,
  ): Promise<Product> {
    const data = await this.client.request<{ updateProduct: Product }>(
      UPDATE_PRODUCT,
      { id: Number(id), input },
    );
    return data.updateProduct;
  }

  async deleteProduct(id: number | string): Promise<boolean> {
    const data = await this.client.request<{ deleteProduct: boolean }>(
      DELETE_PRODUCT,
      { id: Number(id) },
    );
    return data.deleteProduct;
  }

  /* -------------------------------- Images -------------------------------- */

  async listImages(productId?: number | string): Promise<Image[]> {
    const data = await this.client.request<{ images: Image[] }>(GET_IMAGES, {
      productId: productId === undefined ? undefined : Number(productId),
    });
    return data.images;
  }

  async getImage(id: number | string): Promise<Image> {
    const data = await this.client.request<{ image: Image }>(GET_IMAGE, {
      id: Number(id),
    });
    return data.image;
  }

  async getImageWithProduct(id: number | string): Promise<Image> {
    const data = await this.client.request<{ image: Image }>(
      GET_IMAGE_WITH_PRODUCT,
      { id: Number(id) },
    );
    return data.image;
  }

  async createImage(input: CreateImageInput): Promise<Image> {
    const data = await this.client.request<{ createImage: Image }>(CREATE_IMAGE, {
      input,
    });
    return data.createImage;
  }

  async updateImage(
    id: number | string,
    input: UpdateImageInput,
  ): Promise<Image> {
    const data = await this.client.request<{ updateImage: Image }>(UPDATE_IMAGE, {
      id: Number(id),
      input,
    });
    return data.updateImage;
  }

  async deleteImage(id: number | string): Promise<boolean> {
    const data = await this.client.request<{ deleteImage: boolean }>(
      DELETE_IMAGE,
      { id: Number(id) },
    );
    return data.deleteImage;
  }

  /* ------------------------------ Raw access ------------------------------ */

  /** Escape hatch for negative tests that need to send arbitrary documents. */
  raw<T = unknown>(document: string, variables?: Record<string, unknown>): Promise<T> {
    return this.client.request<T>(document, variables);
  }
}
