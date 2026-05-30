# Propeller GraphQL API — Automated Test Suite

Automated API tests for the Propeller multi-tenant e-commerce GraphQL API
(**Products** and **Images**). This is a standalone project that exercises the
API over the network — it does **not** import or depend on the API's source
code, so the two applications stay fully decoupled.

- **Runner:** [Jest](https://jestjs.io/) + [ts-jest](https://kulshekhar.github.io/ts-jest/)
- **GraphQL client:** [graphql-request](https://github.com/jasonkuhrt/graphql-request)
- **Language:** TypeScript

## What is covered

| Area | Spec |
| --- | --- |
| Product CRUD | [`tests/product/product.crud.spec.ts`](tests/product/product.crud.spec.ts) |
| Product filtering (name, status, price, combined) | [`tests/product/product.filter.spec.ts`](tests/product/product.filter.spec.ts) |
| Product pagination | [`tests/product/product.pagination.spec.ts`](tests/product/product.pagination.spec.ts) |
| Product input validation & edge cases | [`tests/product/product.validation.spec.ts`](tests/product/product.validation.spec.ts) |
| Image CRUD | [`tests/image/image.crud.spec.ts`](tests/image/image.crud.spec.ts) |
| Image input validation & edge cases | [`tests/image/image.validation.spec.ts`](tests/image/image.validation.spec.ts) |
| Product ↔ Image relationships | [`tests/relationships/productImage.relationship.spec.ts`](tests/relationships/productImage.relationship.spec.ts) |
| Multi-tenant data isolation | [`tests/tenancy/isolation.spec.ts`](tests/tenancy/isolation.spec.ts) |
| Error handling for invalid operations | [`tests/errors/errorHandling.spec.ts`](tests/errors/errorHandling.spec.ts) |

## Prerequisites

- Node.js 20+
- A running instance of the GraphQL API, reachable at `http://localhost:3000/graphql`
  (see the API project's README — typically `docker compose up --build`).

## Install

```bash
npm install
```

## Configure

Configuration is read from environment variables (a `.env` file is supported).
Copy the example and adjust if needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
| --- | --- | --- |
| `API_URL` | `http://localhost:3000/graphql` | Base URL of the API under test |
| `TENANT_A` | `tenant-a` | Primary tenant used in most specs |
| `TENANT_B` | `tenant-b` | Second tenant used for isolation checks |

## Run the tests

```bash
# Make sure the API is running first, then:
npm test

# Watch mode
npm run test:watch

# Type-check only (no tests)
npm run build
```

Tests run with `--runInBand` (serially) so that shared-tenant data and cleanup
remain deterministic.

## Test design notes

- **Self-contained data.** Every spec creates the records it needs through
  mutations and removes them afterwards via a `ResourceTracker`
  ([`src/helpers/cleanup.ts`](src/helpers/cleanup.ts)). Tests do **not** rely on
  the API's seed data, so they are safe to run repeatedly against any
  environment.
- **Isolation by unique tokens.** Filtering/pagination specs tag their records
  with a random name token so assertions target only their own data and ignore
  anything else already in the database.
- **Thin typed client.** [`src/helpers/api.ts`](src/helpers/api.ts) wraps the
  GraphQL documents in [`src/client/operations.ts`](src/client/operations.ts)
  into a small per-tenant facade, keeping the specs readable.
- **Tests encode the documented contract.** Assertions reflect the behaviour
  promised by the API's README/schema. Where the implementation deviates, the
  test fails on purpose — that is how the suite surfaces bugs (see below).

## Bugs surfaced by these tests

These tests assert the **correct, documented** behaviour. Against the current
API build, the following specs fail and point at real defects in the API source
(fixes belong in the API repository, not here):

| Symptom (failing test) | Suspected root cause |
| --- | --- |
| Decimal product price is truncated (`product.validation` → "preserves decimal precision") | `Product.price` is stored as `@Column({ type: 'int' })` though the docs say it supports decimals. |
| Filtering by `status: ACTIVE` returns INACTIVE products and vice-versa (`product.filter` → "by status") | The status filter branch in `product.service.ts` inverts the requested status before querying. |
| First page omits the earliest records / records become unreachable (`product.pagination`) | Pagination uses `skip(page * pageSize)` instead of `skip((page - 1) * pageSize)`, so page 1 already skips a full page. |
| Image `priority` defaults to `0`, and out-of-range values are accepted (`image.validation`) | The entity default is `0` (docs say `100`) and there is no `min: 1 / max: 1000` validation; no global `ValidationPipe` is registered. |
| Negative price / empty name are accepted (`product.validation`) | No value-level input validation on the create/update DTOs. |
| Reassigning an image to a different product does not persist (`relationships` → "reassigns an image") | `updateImage` returns the new `productId`, but a re-read shows the old one. The service loads the `product` relation before `Object.assign`, so the stale relation overwrites the updated `productId` column on save. |

> If you point the suite at an API where these bugs are fixed, the corresponding
> tests will pass.

## Assumptions

- The API is already running and reachable at `API_URL` before `npm test`.
- Tenants `tenant-a` and `tenant-b` are valid tenant identifiers (any string is
  accepted by the `x-tenant-id` header; these two are simply used consistently).
- Pagination/ordering specs assume the API returns rows in ascending `id`
  (insertion) order for a freshly created, isolated set of records.
- A missing `x-tenant-id` header maps to a `default` tenant that owns none of
  the other tenants' data.

## Continuous Integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and
pull request. It installs dependencies, type-checks, clones the API repository,
starts it with Docker Compose, waits for the GraphQL endpoint, seeds the
database, and runs the suite.

Set the following repository variables so CI can locate the API:

- `API_REPO_URL` — Git URL of the API repository.
- `API_REF` *(optional)* — branch/tag to test against (defaults to `main`).
