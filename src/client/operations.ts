import { gql } from 'graphql-request';

/**
 * GraphQL documents for every query and mutation under test.
 *
 * Shared field selections are factored into fragments so the documents stay
 * consistent and a schema change only needs to be made in one place.
 */

const PRODUCT_FIELDS = gql`
  fragment ProductFields on Product {
    id
    name
    price
    status
    tenantId
  }
`;

const IMAGE_FIELDS = gql`
  fragment ImageFields on Image {
    id
    url
    priority
    tenantId
    productId
  }
`;

/* ----------------------------- Product queries ---------------------------- */

export const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilterInput, $page: Int, $pageSize: Int) {
    products(filter: $filter, page: $page, pageSize: $pageSize) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: Int!) {
    product(id: $id) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export const GET_PRODUCT_WITH_IMAGES = gql`
  query GetProductWithImages($id: Int!) {
    product(id: $id) {
      ...ProductFields
      images {
        ...ImageFields
      }
    }
  }
  ${PRODUCT_FIELDS}
  ${IMAGE_FIELDS}
`;

/* ---------------------------- Product mutations --------------------------- */

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: Int!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      ...ProductFields
    }
  }
  ${PRODUCT_FIELDS}
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: Int!) {
    deleteProduct(id: $id)
  }
`;

/* ------------------------------ Image queries ----------------------------- */

export const GET_IMAGES = gql`
  query GetImages($productId: Int) {
    images(productId: $productId) {
      ...ImageFields
    }
  }
  ${IMAGE_FIELDS}
`;

export const GET_IMAGE = gql`
  query GetImage($id: Int!) {
    image(id: $id) {
      ...ImageFields
    }
  }
  ${IMAGE_FIELDS}
`;

export const GET_IMAGE_WITH_PRODUCT = gql`
  query GetImageWithProduct($id: Int!) {
    image(id: $id) {
      ...ImageFields
      product {
        ...ProductFields
      }
    }
  }
  ${IMAGE_FIELDS}
  ${PRODUCT_FIELDS}
`;

/* ----------------------------- Image mutations ---------------------------- */

export const CREATE_IMAGE = gql`
  mutation CreateImage($input: CreateImageInput!) {
    createImage(input: $input) {
      ...ImageFields
    }
  }
  ${IMAGE_FIELDS}
`;

export const UPDATE_IMAGE = gql`
  mutation UpdateImage($id: Int!, $input: UpdateImageInput!) {
    updateImage(id: $id, input: $input) {
      ...ImageFields
    }
  }
  ${IMAGE_FIELDS}
`;

export const DELETE_IMAGE = gql`
  mutation DeleteImage($id: Int!) {
    deleteImage(id: $id)
  }
`;
