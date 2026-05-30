import { randomUUID } from 'crypto';
import {
  CreateImageInput,
  CreateProductInput,
  ProductStatus,
} from '../types/api';

/**
 * Returns a short, unique token used to make created records individually
 * identifiable. This lets list/filter assertions target exactly the data a
 * test created, regardless of any pre-existing seed data.
 */
export function uniqueToken(): string {
  return randomUUID().slice(0, 8);
}

/**
 * Builds a valid CreateProductInput with unique, recognisable defaults.
 * Override any field via `overrides`.
 */
export function buildProductInput(
  overrides: Partial<CreateProductInput> = {},
): CreateProductInput {
  return {
    name: `Test Product ${uniqueToken()}`,
    price: 50,
    status: ProductStatus.ACTIVE,
    ...overrides,
  };
}

/**
 * Builds a valid CreateImageInput with unique, recognisable defaults.
 * Override any field via `overrides`.
 */
export function buildImageInput(
  overrides: Partial<CreateImageInput> = {},
): CreateImageInput {
  return {
    url: `https://cdn.example.com/${uniqueToken()}.jpg`,
    priority: 100,
    ...overrides,
  };
}
