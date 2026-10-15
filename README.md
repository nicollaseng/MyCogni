# MyCogniAI

Self-tracking app for anxiety and depression: validated screening (PHQ-9, GAD-7, WHO-5), daily mood check-ins and trends over time.

> MyCogniAI is a screening and self-awareness tool, not a diagnostic tool. If you are in crisis in Brazil, call **CVV 188** (24h, free) or **SAMU 192**.

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
packages/   shared code: config (tsconfig), contracts (Zod schemas shared by the API and the web app)
            and domain (PHQ-9 and GAD-7 forms, scoring and the self-harm risk rule)
```

## Getting started

Requirements: Node.js 24, pnpm through Corepack, Docker and the Supabase CLI.

```bash
corepack enable
pnpm install
pnpm db:start
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @mycogni/api db:migrate
pnpm dev
```

The web app runs on `http://localhost:3000` and the API on `http://localhost:3333`, with a health check at `GET /health`.

## Local Supabase

`pnpm db:start` runs Postgres and Auth locally through the Supabase CLI, on ports that do not clash with other Supabase projects:

| Service          | URL                                                       |
| ---------------- | --------------------------------------------------------- |
| Auth             | `http://127.0.0.1:55321`                                  |
| Postgres         | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` |
| Studio           | `http://127.0.0.1:55323`                                  |
| Mailpit (emails) | `http://127.0.0.1:55324`                                  |

`pnpm db:stop` stops it. The API tests run against this database, so it must be running for `pnpm test`.

The Supabase Data API (PostgREST) is turned off: every read and write goes through the Fastify API, which scores questionnaires and checks onboarding on the server. Turn it off in the hosted projects too (Project Settings → Data API), otherwise a signed-in user could write to their own rows directly with the public key.

The hosted staging project is declared in the same file under `[remotes.staging]` (project `kbqfcicmszsmvbxrbcgq`, us-west-2): Data API off, the return URL, 6-digit codes and the password rules. Apply it with `supabase config push --project-ref kbqfcicmszsmvbxrbcgq`. The email templates in `supabase/templates` can only be pushed once the project has its own SMTP (Resend), because the Free plan blocks template changes on the default email sender.

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

Routes under `/v1` require a Supabase access token (`Authorization: Bearer <token>`). The API verifies it against the project's JWKS (`SUPABASE_URL/auth/v1/.well-known/jwks.json`), checking issuer and audience, so no shared secret is needed.

| Route                                           | Purpose                                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `GET /v1/me`, `PATCH /v1/me`                    | Read and update the profile (name, time zone)                                                                         |
| `GET /v1/consents`                              | Consents granted for the current version of the legal documents                                                       |
| `POST /v1/consents`                             | Grant consents (`terms`, `privacy`, `health_data`, `adult`, optional `ai_processing`)                                 |
| `GET /v1/assessments`                           | PHQ-9 and GAD-7 results, newest first                                                                                 |
| `POST /v1/assessments`                          | Submit answers; the server computes total, severity and the PHQ-9 item 9 risk flag                                    |
| `POST /v1/onboarding/complete`                  | Marks onboarding as done once the required consents and both screenings exist (422 before)                            |
| `POST /v1/check-ins`                            | Record mood (0–6), emotions, context and an optional note                                                             |
| `GET /v1/check-ins`                             | Records, newest first, with optional `since`, `before` and `limit` (up to 200)                                        |
| `POST /v1/professional`, `GET /v1/professional` | Register and read a professional profile (type, name, council registration), which starts as `pending` until verified |

Errors always answer with `{ code, message }`, plus `issues` for validation errors. Unexpected errors are logged and answered with a generic 500 that never leaks details.

### Database and RLS

- Every table holding user data enables row level security, with owner-only policies declared next to the table in the Drizzle schema, so they ship inside the migrations.
- User queries run through `withUser(db, userId, work)`, which opens a transaction as the `authenticated` role with the user's JWT claims. Postgres enforces the policies even if a query forgets to filter by user.
- A trigger on `auth.users` creates the `profiles` row on sign up; deleting the account cascades to every user table.
- Professionals and patients:
  - `professional_profiles`: the professional's type and council registration. Only the Cogni team can set `verified`, from the database. Only verified professionals can create `invitations`
  - An invitation lasts 72 hours, enforced by a check. Whoever opens the link claims it through `claim_invitation(code)`. Invitations sent to a confirmed email are attached by `attach_invitations_by_email()`. Both notify the person in `notifications`
  - `invitation_preview(code)` lets anyone holding the code see only who is inviting, the status and the expiry
  - Only the patient creates a `care_links` row, and only after accepting. Either side can end it
  - A professional reads a patient's profile, check-ins and screenings only while the link is active. Records from before the link are visible only when the patient chose to share history
  - Column-level grants restrict which fields each update can touch, so status changes cannot alter anything else
- `pnpm --filter @mycogni/api db:generate` creates a migration from schema changes; `db:migrate` applies pending migrations.

## Web

`apps/web` is a Next.js App Router app, mobile first, styled with Tailwind CSS v4 and shadcn/ui conventions.

The visual language is editorial, closer to a notebook than a dashboard: Newsreader for titles and personal content, Schibsted Grotesk for the interface, hairline rules instead of cards, and navigation in words (Hoje, Registros, Padrões, Você). The palette is a sage paper with forest and slate accents. Color carries meaning only for mood, on a diverging scale from blue on difficult days to green on good days, with a neutral gray in the middle.

```
src/
  app/         routes only: (marketing) for public pages, (app) for the signed-in shell
  features/    one folder per feature (components, hooks, data access)
  shared/      ui primitives, shared components and utilities
e2e/           Playwright specs, run on a mobile and a desktop profile
```

- Behavior tests with Jest and React Testing Library live next to the components (`*.test.tsx`) and query by role and accessible name
- End-to-end tests: `pnpm --filter @mycogni/web exec playwright install chromium` once, then `pnpm --filter @mycogni/web test:e2e`. They need the local Supabase running; Playwright starts the API and the web app if they are not up. A setup project signs in once with a person who already finished onboarding, auth tests read codes from Mailpit, and every test user is removed at the end
- Light and dark themes follow the system preference
- Crisis help (CVV 188, SAMU 192) is one tap away on every screen
- Authentication with Supabase Auth: sign up with email and password confirmed by a 6-digit code, sign in, password reset with a code, and sign out. Server actions talk to Supabase, `proxy.ts` refreshes the session cookies, and the app routes check the session on the server. The email being confirmed travels in an `httpOnly` cookie, never in the URL
- Locally, every auth email lands in Mailpit at `http://127.0.0.1:55324`. Templates live in `supabase/templates`
- Sign in and sign up with Google, through Supabase Auth with PKCE, opening Google's account picker. New Google accounts go through onboarding like any other, with the name taken from Google. Credentials:
  - Create an OAuth client of type Web application in Google Cloud Console → APIs & Services → Credentials, with `http://127.0.0.1:55321/auth/v1/callback` as an authorized redirect URI (add `https://<project-ref>.supabase.co/auth/v1/callback` for each hosted project)
  - Locally, copy `supabase/.env.example` to `supabase/.env` (ignored by git), fill in the client id and secret, then restart with `pnpm db:stop && pnpm db:start`
  - In hosted projects, set the same values in Authentication → Providers → Google, and add `https://<domain>/auth/callback` to the allowed redirect URLs
- The web server calls the API on behalf of the signed-in person, forwarding the Supabase access token (`API_URL` in `.env.local`, `http://127.0.0.1:3333` locally)
- Onboarding at `/onboarding`, required before any app route: consents (18+, terms and privacy, health data, and AI as optional), name, then PHQ-9 and GAD-7 one question per screen. A crisis support screen appears right after PHQ-9 when item 9 is above zero. The results explain each score as screening, not diagnosis. Leaving midway resumes at the right step
- Check-in at `/check-in`: a contour map that tightens on difficult days and loosens on good ones, a 7-level scale, then emotions and context picked from suggestions, groups and search, with no scrolling even on small phones. The record is saved through the API, then shows up in Registros, grouped by day in the person's time zone, and in the 14-day strip on Hoje.
- Routes are typed (`typedRoutes`), so links to missing pages fail the typecheck

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
