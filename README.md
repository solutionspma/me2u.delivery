# me2u.delivery

Me2U is a multi-tenant delivery and fulfillment control plane. Merchants, customers, couriers, and external systems connect to the platform through versioned APIs.

## Development

```sh
cp .env.example .env.local
npm install
npm run typecheck
npm test
npm run build
```

Apply `migrations/001_initial_platform.sql` through the approved database migration runner. `YAHBASE_SERVER_API_KEY` and `DATABASE_URL` are server-only; never expose them as `NEXT_PUBLIC_*` values.

## API contract

- `GET /api/v1/health`
- `POST /api/v1/deliveries` — creates a delivery request after server-side role and tenant checks.
- `POST /api/v1/deliveries/:id/transition` — validates delivery state transitions and blocks required-verification deliveries from reaching `DELIVERED` without a passed assertion.

Production authentication uses a YAHBASE bearer JWT (`/auth/me`) and resolves Me2U memberships from PostgreSQL. Header identity is available only when `ME2U_TEST_AUTH=true` outside production for automated tests.

Phase 2 operational routes include delivery creation/listing, tenant-scoped dispatch assignment, courier transitions, YAHBASE-backed POD upload metadata, courier tracking ingestion, persisted verification assertions, and tokenized customer-safe tracking. Apply migrations `001_initial_platform.sql` and `002_operational_fields.sql` in order.
