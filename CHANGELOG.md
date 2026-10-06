# Changelog

## Stage 1 — Project setup

### Done

- Next.js (App Router) with TypeScript and Tailwind CSS
- Prisma ORM 7.10.0 configured for PostgreSQL (`prisma/schema.prisma` datasource only, `prisma.config.ts`, `@prisma/adapter-pg` client helper)
- ESLint (Next.js) + Prettier
- `.env.example` with placeholders (no real secrets)
- README local run instructions
- `prisma generate` verified without a live database

### Remaining (later stages)

- Stages 3–11: public pages, checkout, Paynow, tickets, notifications, scanner, dashboards, hardening

## Stage 2 — Database schema & seed data (SPEC sections 6 & 12)

### Schema (prisma/schema.prisma)

- Implemented full data model per SPEC section 6 with **7 enums** and **9 models**:
  - **Enums:** `UserRole`, `OrganizerStatus`, `EventStatus`, `OrderStatus`, `TicketStatus`, `PayoutStatus`, `Currency` (USD + ZIG)
  - **Models:** `Organizer`, `User`, `Event`, `TicketType`, `Order`, `OrderItem`, `Ticket`, `PaymentEvent`, `Payout`
- All money values stored as `Int` — integer cents for both USD and ZIG (100ths). No floats or decimals anywhere.
- Added `TicketType.quantityReserved Int @default(0)` so the database can track both firm sales and in-cart reservations separately.
- Unique constraints for integrity:
  - `Ticket.code @unique` (unguessable random; never sequential IDs)
  - `Order.paymentReference @unique` (when present)
  - `PaymentEvent @@unique([provider, providerEventId])` — idempotent webhook recording so the same provider event cannot be recorded twice
- Indexes on lookup fields:
  - Event: `status`, `startsAt`, `(organizerId, status)`
  - Order: `status`, `expiresAt`, `buyerPhone`, `(status, expiresAt)`
  - Payout: `(organizerId, status)`
  - (All FK columns already indexed by Prisma's PostgreSQL provider; `Ticket.code` is covered by the `@unique` constraint.)
- Timestamps in UTC: `createdAt` on every model; `updatedAt` on Organizer, User, Event, TicketType, and Payout (entities that are updated during normal operation).

### Integrity rule: anti-oversell CHECK constraint (in migration SQL)

- Prisma schema syntax does not support PostgreSQL `CHECK` constraints natively, so the rule is applied as raw SQL inside the `20261002161116_init` migration:

```sql
ALTER TABLE "TicketType"
  ADD CONSTRAINT "TicketType_quantity_bounds"
  CHECK (
    "quantitySold" >= 0
    AND "quantityReserved" >= 0
    AND "quantitySold" + "quantityReserved" <= "quantityTotal"
  );
```

- In plain language: Postgres will reject any INSERT or UPDATE on TicketType that makes any of `quantitySold`, `quantityReserved`, or their sum exceed legal bounds. This is the database-level backstop against overselling — even under concurrent checkout races or app bugs.

### Migrations

- `20261002160818_init`: creates all 7 enum types, all 9 tables, all foreign keys, all unique constraints, all lookup indexes. (Applied to Neon first; checksum of file on disk equals stored checksum in `_prisma_migrations`.)
- `20261002161116_init`: adds the `TicketType_quantity_bounds` CHECK constraint via an idempotent PL/pgSQL `DO` block so the same migration is safe whether run on a fresh database or applied retroactively to the existing development Neon database. (CHECK constraint confirmed present on Neon; migration already applied.)

### Seed (prisma/seed.ts, runner: `tsx prisma/seed.ts` in prisma.config.ts)

- `assertNotProduction()` guard throws and refuses to run if `NODE_ENV === "production"`.
- Fully re-runnable via upserts on **fixed deterministic ids**:
  `seed-organizer-1`, `seed-user-organizer-1`, `seed-event-{1,2,3}`, and `seed-tt-{...}` for the 8 ticket types. Safe to execute any number of times without creating duplicates.
- Uses `@prisma/adapter-pg` (same pattern as the runtime app client) with `connectionTimeoutMillis: 30_000` and prefers `DIRECT_DATABASE_URL` for the direct Neon connection.
- `TicketType.upsert` intentionally OMITs `quantitySold` and `quantityReserved` from the `update` block and writes them only in `create`, so re-running the seed can never overwrite real sales or reservation counts once live data accumulates.
- Seeded data:
  - **1 Organizer:** "Harare Live Promotions" (ACTIVE, fake +263 phone, placeholder payout details)
  - **1 User:** `organizer@example.com` role ORGANIZER, linked to the organizer.
    Password hash is the literal string
    `FAKE_PASSWORD_HASH_FOR_SEED_ONLY_DO_NOT_USE_IN_PRODUCTION_000000000000`
    — clearly fake, never usable for login; replace via actual sign-up / Auth.js flow in later stages.
  - **3 published events:**
    1. "Harare Summer Music Festival" — Harare Gardens, 2026-11-21 UTC
    2. "Bulawayo Comedy Night" — Large City Hall, 2026-12-05 UTC
    3. "Mutare Business Expo 2026" — Mutare Showgrounds, 2026-11-28 UTC
  - **8 ticket types total (2–3 per event), mixing USD and ZIG:**
    - Event 1: Early Bird $10.00 USD (200), Regular $15.00 USD (500), VIP $30.00 USD (100)
    - Event 2: Regular ZiG 500.00 (300), VIP ZiG 1,500.00 (50)
    - Event 3: Standard Entry $20.00 USD (400), Premium $40.00 USD (100), Company Group (5) $90.00 USD (30)
  - All quantities / prices are integer cents (USD cents or ZIG cents).
  - Phone numbers use the Zimbabwe country code `+263` with clearly fake numbers. No real personal data, no real passwords, no real emails.
- Confirmation output:
  `seed: complete. { organizers: 1, users: 1, events: 3, ticketTypes: 8 }`

### Configuration

- `prisma.config.ts`:
  - `DIRECT_DATABASE_URL ?? DATABASE_URL` for all CLI operations (migrate, generate, seed). For Neon, `DIRECT_DATABASE_URL` MUST be the direct (non-pooler) connection string; missing either URL throws a clear error (never falls back to empty string).
  - Seed command registered as `migrations.seed = "tsx prisma/seed.ts"`.
- `.env.example`: split into two PostgreSQL URL placeholders (both using `?sslmode=require`):
  - `DATABASE_URL` — pooled connection URL for the running app (Neon pooler URL on Neon).
  - `DIRECT_DATABASE_URL` — direct (non-pooler) connection URL for the Prisma CLI (migrate, generate, db seed). Required for Neon; for Supabase or local Postgres, same value as `DATABASE_URL` works.
- `.prettierrc.json`: added `"endOfLine": "auto"` so Prettier accepts Git-autocrlf-written CRLF working copies on Windows as canonical (fixes 14 false-positive format:check failures after stage 1).

### Tooling

- Added `tsx@4.19.4` as a devDependency (exact pinned, no `^` / `~`). Prisma 7 needs a TS runner to execute a TypeScript seed file via `tsx prisma/seed.ts`, and tsx is the current standard minimal choice for that role.
- Prisma pinned at exactly `7.10.0` (unchanged; no Prisma 8 usage).

### Verification performed

- `npx prisma validate` — passed.
- `npx prisma generate` — passed; Prisma Client 7.10.0 regenerated in `src/generated/prisma/`.
- `npx prisma migrate status` — up to date (2/2 migrations applied, no drift; SHA256 of `20261002160818_init/migration.sql` matches the stored checksum in `_prisma_migrations`).
- `npx prisma migrate deploy` — applied the pending `20261002161116_init` migration on Neon (idempotent CHECK constraint DO block; confirmed `TicketType_quantity_bounds` present on the database).
- `npx prisma db seed` — passed (exit 0), counts confirmed above.
- `npm run lint` — passed.
- `npm run format:check` — passed (endOfLine: auto + seed.ts formatted).
- `npm run build` — passed. 4 static pages generated successfully.

### NOT done (deferred to later stages)

- Runtime query implementations, Next.js route handlers, UI
- AUTH/Auth.js integration (Stage 9)
- Payment integrations (Stage 5)
- Ticket scanning / notifications / payouts operational flows (later stages)

## Stage 3 — Public pages and event categories

### Done

- New migration `20261004145507_add_event_category`: `EventCategory` enum (CONCERT, PARTY, COMEDY, CONFERENCE, SPORT), `Event.category` (default CONCERT) and an index on (status, category, startsAt). The seed assigns categories to the three seeded events.
- Event list with search and category filter, and an event page with ticket tiers, availability, sale windows, a quantity selector and a running total. The selector is client-side only: no orders, reservations or payments are created.
- Public pages render on request so availability is always current.
- Brand name, money and date helpers live in `src/lib/site.ts`. The `t()` helper is a pass-through placeholder; Shona and Ndebele are not wired yet.

### Notes

- The Stage 9 organizer form must require an explicit category. The CONCERT default exists only so existing rows migrate.
- Verification: lint, format:check and build pass.

## Stage 3b — Public landing page and shared site shell

### Done

- New home page for TicketZw with a landing-page hero, organiser-focused value props, and spotlighted upcoming events.
- Shared header and footer added to the app shell so all public pages share one navigation and footer structure.
- Event discovery moved from the root page to `/events`, while the root page now acts as the public landing page.
- Reusable event query helpers extracted to `src/lib/events.ts` to keep route logic consistent between `/` and `/events`.
- Placeholder organizer, terms, and privacy pages created to satisfy footer and route coverage without crossing into checkout/auth scope.
- `CONTACT_EMAIL` added to `.env.example` for placeholder contact links.

### Verification

- `npm run lint` — passed after cleaning the public-page warnings.
- `npm run build` — passed; generated routes include `/`, `/events`, `/events/[id]`, `/organizers`, `/terms`, and `/privacy`.

### Launch note

- Landing-page copy and hero marketing should be rechecked before public launch to confirm the tone and messaging match the final brand direction.
- Terms and Privacy are placeholders and must be written by a lawyer before launch.