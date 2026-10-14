# MyCogni

Self-tracking app for anxiety and depression: validated screening (PHQ-9, GAD-7, WHO-5), daily mood check-ins and trends over time.

> MyCogni is a screening and self-awareness tool, not a diagnostic tool. If you are in crisis in Brazil, call **CVV 188** (24h, free) or **SAMU 192**.

## Stack

- **Web:** Next.js, TypeScript, Tailwind CSS, shadcn/ui
- **API:** Node.js, Fastify, Drizzle ORM
- **Data:** Supabase (Postgres, Auth, Storage) with RLS on every table
- **Jobs:** Redis and BullMQ
- **Email:** Resend
- **Hosting:** Railway (US East) and Supabase (us-east-1)

## Repository

```
apps/       deployable applications (web, api)
packages/   shared code (config, contracts, domain, emails)
```

## Getting started

Requirements: Node.js 24, pnpm through Corepack, Docker and the Supabase CLI.

```bash
corepack enable
pnpm install
pnpm db:start
cp apps/api/.env.example apps/api/.env
pnpm --filter @mycogni/api db:migrate
pnpm dev
```

The API listens on `http://localhost:3333`, with a health check at `GET /health`.

## Local Supabase

`pnpm db:start` runs Postgres and Auth locally through the Supabase CLI, on ports that do not clash with other Supabase projects:

| Service          | URL                                                       |
| ---------------- | --------------------------------------------------------- |
| API (Auth, REST) | `http://127.0.0.1:55321`                                  |
| Postgres         | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` |
| Studio           | `http://127.0.0.1:55323`                                  |
| Mailpit (emails) | `http://127.0.0.1:55324`                                  |

`pnpm db:stop` stops it. The API tests run against this database, so it must be running for `pnpm test`.

## API

`apps/api` is a Fastify modular monolith running TypeScript directly on Node.js 24 in development and compiled to `dist` for production.

```
src/
  config/    environment validated with Zod at boot
  modules/   one folder per domain module (routes, service, repository)
  plugins/   cross-cutting concerns (security, error handling)
  shared/    errors and HTTP types
  db/        Drizzle schema, client, RLS helper and migrator
  scripts/   one-off entrypoints such as migrations
  app.ts     builds the Fastify instance
  server.ts  process entrypoint with graceful shutdown
drizzle/     generated SQL migrations
test/
  unit/      pure logic
  e2e/       HTTP and database behavior against real dependencies
```

Errors always answer with `{ code, message }`, plus `issues` for validation errors. Unexpected errors are logged and answered with a generic 500 that never leaks details.

### Database and RLS

- Every table holding user data enables row level security, with owner-only policies declared next to the table in the Drizzle schema, so they ship inside the migrations.
- User queries run through `withUser(db, userId, work)`, which opens a transaction as the `authenticated` role with the user's JWT claims. Postgres enforces the policies even if a query forgets to filter by user.
- A trigger on `auth.users` creates the `profiles` row on sign up; deleting the account cascades to every user table.
- `pnpm --filter @mycogni/api db:generate` creates a migration from schema changes; `db:migrate` applies pending migrations.

## Branches

- `main` deploys to production
- `staging` deploys to staging; feature branches target `staging`

## Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `pnpm lint`         | ESLint with type-aware rules on the monorepo |
| `pnpm format`       | Prettier on every supported file             |
| `pnpm format:check` | Prettier check without writing               |
| `pnpm typecheck`    | TypeScript check on every package            |
| `pnpm build`        | Build every package                          |
| `pnpm test`         | Test every package                           |

## Conventions

Enforced by tooling through Git hooks:

- One-line Conventional Commits, no body or trailers (commitlint)
- Strict TypeScript, no `any` (typescript-eslint)
- No comments in code, inline ESLint directives disabled (ESLint)
- At most 650 lines per file (ESLint)
- Formatting with Prettier (lint-staged)

## Legacy

The original 2018 Rails app is preserved at the `legacy-rails-2018` tag.
