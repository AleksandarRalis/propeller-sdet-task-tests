/**
 * TypeScript mirrors of the GraphQL schema types exposed by the API.
 * Kept intentionally small and explicit so test assertions stay readable.
 */

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Image {
  id: string;
  url: string;
  priority: number;
  tenantId: string;
  productId: number | null;
  product?: Product | null;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  status: ProductStatus;
  tenantId: string;
  images?: Image[] | null;
}

export interface CreateProductInput {
  name: string;
  price: number;
  status?: ProductStatus;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  status?: ProductStatus;
}

export interface ProductFilterInput {
  name?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateImageInput {
  url: string;
  priority?: number;
  productId?: number;
}

export interface UpdateImageInput {
  url?: string;
  priority?: number;
  productId?: number;
}
