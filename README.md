# EcoRewards AI

A mobile-first sustainability platform that helps users track carbon emissions, climb sustainability leaderboards, earn real rewards for greener choices, get AI-powered recommendations, and contribute to community-wide environmental improvement.

> **Stack**: React 19 · TanStack Start · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Lovable Cloud) · Recharts · globe.gl · Lovable AI Gateway

---

## Features

- **Carbon tracking** — Manual, GPS, ticket and receipt-based trip logging across 8 transport modes with calibrated emission factors.
- **Trust-weighted ranking** — Eco Score formula blending points, CO₂ saved, trust score, verification percentage and challenges across global/state/city/area scopes.
- **Rewards marketplace** — Atomic point-spending RPC, coupon generation, QR redemption, membership tiers.
- **Community feed** — Posts, media uploads, reactions, comments, community challenges, top contributors.
- **AI Sustainability Coach** — Streaming chat backed by the Lovable AI Gateway with personalized user-data context.
- **Impact Globe** — 3D globe visualization of user activity and city clusters.
- **Public profiles** — Shareable `/user/$id` profile pages with verification badges.

## Project structure

```
src/
├─ routes/                  TanStack file-based routes (pages + server routes)
│  ├─ _authenticated/       Auth-gated routes
│  └─ api/                  HTTP endpoints (AI chat stream)
├─ components/              Feature & UI components
│  ├─ ui/                   shadcn primitives
│  ├─ cards/                Dashboard cards (StatCard, RewardCard, ...)
│  ├─ community/            Feed, composer, comments
│  └─ ai/                   Forecast, score, recommendations
├─ hooks/                   Data hooks (use-stats, use-rewards, use-ai, ...)
├─ lib/                     Pure utilities (carbon math, utils, AI gateway)
├─ integrations/supabase/   Auto-generated client + types
├─ test/                    Vitest setup (mocks, jest-dom)
└─ styles.css               Tailwind v4 + design tokens

supabase/migrations/        SQL migrations (RLS, RPCs, seed data)
```

## Setup

```bash
bun install
bun dev          # http://localhost:8080
```

Environment variables (already wired via Lovable Cloud):

| Var | Where |
|---|---|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | Server functions / SSR |
| `LOVABLE_API_KEY` | AI Gateway (server-only) |

## Scripts

| Script | Purpose |
|---|---|
| `bun dev` | Start dev server |
| `bun run build` | Production build |
| `bun run lint` | ESLint |
| `bun test` | Run unit & integration tests |
| `bun run test:watch` | Watch mode |
| `bun run test:coverage` | Coverage report (HTML + lcov) |

## Testing

Tests run on Vitest + React Testing Library + jsdom. Setup lives in
[`src/test/setup.ts`](src/test/setup.ts) and globally mocks the Supabase client
and TanStack Router primitives so component tests can render in isolation.

```bash
bun test                    # CI mode
bun run test:coverage       # outputs ./coverage
```

Covered areas: pure utilities (`lib/carbon`, `lib/utils`), UI primitives
(`StatCard`, `RewardCard`, `BadgeCard`, `EmptyState`, `VerificationBadge`,
`CouponQR`, `BottomNav`, `AppShell`).

## Accessibility

- WCAG 2.1 AA-targeted: semantic landmarks, single `<main>` per route,
  `aria-label` on icon-only controls, keyboard-navigable shadcn primitives.
- Uses `min-h-dvh` for full-height layouts (mobile-safe).
- Color uses design tokens (`text-foreground`, `text-muted-foreground`) so
  dark/light themes stay AA-compliant.

## Deployment

This project is deployed via Lovable Cloud (Cloudflare Workers SSR). Click
**Publish** in the Lovable editor to ship.

For self-hosting:

1. Provision a Supabase project, apply the SQL in `supabase/migrations/`.
2. Set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   in your runtime.
3. `bun run build` and deploy the `.output/` bundle to any Workers-compatible host.

## Architecture notes

```text
 Browser ──▶ TanStack Router ──▶ React 19 pages
                │
                ├─▶ supabase-js (RLS, user-scoped)
                │
                └─▶ /api/chat (TanStack server route)
                          │
                          └─▶ Lovable AI Gateway (Gemini)
```

- **Auth**: Supabase Auth (email/password + Google) gated via `_authenticated/route.tsx`.
- **Server functions**: `createServerFn` with the `requireSupabaseAuth` middleware
  for user-scoped writes; `attachSupabaseAuth` is registered globally in `src/start.ts`.
- **Database**: All tables enable RLS. Roles are stored in a dedicated table and
  checked via a `SECURITY DEFINER has_role()` function to prevent recursion.
- **Atomic spending**: `spend_points()` RPC prevents wallet overdraft via row locks.

## License

Private — competition project.
