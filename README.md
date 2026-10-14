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

Requirements: Node.js 24 and pnpm through Corepack.

```bash
corepack enable
pnpm install
pnpm build
```

## Branches

- `main` deploys to production
- `staging` deploys to staging; feature branches target `staging`

## Conventions

- One-line Conventional Commits
- Strict TypeScript, no `any`
- At most 650 lines per file

## Legacy

The original 2018 Rails app is preserved at the `legacy-rails-2018` tag.
