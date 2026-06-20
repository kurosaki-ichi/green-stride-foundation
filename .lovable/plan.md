## Hack2Skill Score Optimization Plan

Current: **79.57** — biggest gaps are **Testing (0)** and **Accessibility (45)**. Security (96), Efficiency (100), and Problem Alignment (99) are already excellent and risk regressions if heavily refactored. I'll focus effort where it actually moves the score.

### Estimated score impact

| Category | Now | Target | Strategy |
|---|---|---|---|
| Testing | 0 | 75–85 | Add Vitest + RTL, unit/integration tests for hooks, utils, components |
| Accessibility | 45 | 85–95 | aria-labels, alt text, semantic HTML, focus, headings, contrast tokens |
| Code Quality | 71 | 80+ | Targeted refactors, dead-code removal, stronger types |
| Security | 96 | 96+ | Light input-validation hardening only |
| Efficiency | 100 | 100 | Preserve — no risky bundle changes |
| Alignment | 99 | 99 | Preserve — no feature changes |
| **Overall** | **79.57** | **~90+** | |

### Phase A — Audit (single sweep, reported in chat, no separate doc)
Scan with `rg` for: icon-only buttons missing `aria-label`, images missing `alt`, hardcoded colors (`text-gray-*`, `bg-white`), `h-screen` vs `h-dvh`, `div onClick`, duplicate ids, oversized components (>400 LOC).

### Phase B — Testing infrastructure (biggest score lever)
- Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `@vitest/coverage-v8`.
- Add `vitest.config.ts` (jsdom, setup file, path alias, coverage v8 with text+html+lcov reporters).
- Add `src/test/setup.ts` (jest-dom, mock matchMedia, ResizeObserver, IntersectionObserver, supabase client).
- Add `package.json` scripts: `test`, `test:watch`, `test:coverage`.
- Write tests:
  - **Utils**: `lib/utils.ts` (cn), `lib/carbon.ts` (emission math, edge cases).
  - **Components**: `VerificationBadge`, `EmptyState`, `BottomNav`, `StatCard`, `RewardCard`, `BadgeCard`, `CouponQR`, `PostCard`, `SustainabilityScoreCard`, `ForecastCard`, `RecommendationsList`.
  - **Hooks** (with mocked supabase): `use-auth`, `use-profile`, `use-stats`, `use-trust`, `use-rewards` reducers/selectors where pure.
  - **Integration**: login form validation, onboarding form, post composer validation, reward redeem flow (mocked RPC), AI chat message send (mocked fetch).
  - **Edge cases**: empty states, error states, overdraft on spend_points, invalid form input.
- Target ≥ 60 tests covering ≥ 90% of `src/lib`, `src/components`, key hooks.

### Phase C — Accessibility sweep (second biggest lever)
- Replace `text-gray-*` / arbitrary placeholder colors with semantic tokens (`text-foreground`, `text-muted-foreground`).
- Add `aria-label` to every icon-only Button across `BottomNav`, dashboard, leaderboard, community, AI coach, profile pages.
- Add `alt` text for every `<img>` (avatars → "Avatar of {name}", icons → empty alt where decorative).
- Ensure single `<main>` per route via `AppShell`; verify route components don't nest a second `<main>`.
- Replace `h-screen` → `h-dvh` where present.
- Heading hierarchy audit: each page exactly one `<h1>`; no skipped levels.
- Form labels: every `<Input>`/`<Textarea>` gets `<Label htmlFor>` or `aria-label`.
- `<html lang="en">` already present — verify.
- Focus-visible: confirm shadcn defaults render visible rings (no overrides removing them).
- Verify dialog/sheet primitives have accessible titles (add `DialogTitle` where missing, `VisuallyHidden` where title is decorative).

### Phase D — Code quality (targeted, low-risk)
- Remove obviously unused imports / dead code surfaced by audit.
- Extract any >400-LOC route component into smaller pieces only where it doesn't touch business logic.
- Strengthen types on hooks that use `any`.
- No mass refactor — guard against regressions.

### Phase E — Security (light pass)
- Add Zod validation on PostComposer + edit-profile (length caps, trim).
- Verify no service-role key references in client code (already audited clean).
- Add `rel="noopener noreferrer"` to any `target="_blank"` anchors.

### Phase F — Performance
- Keep current bundle. TanStack auto-code-splits routes already. Only add `React.lazy` for clearly heavy non-route components if any are found during audit (e.g., globe.gl already route-scoped → leave it).

### Phase G — Documentation
- Add `README.md` with: project overview, tech stack, setup (`bun install`, `bun dev`), env vars, scripts, test instructions, architecture diagram (ASCII), deployment notes.
- Add `TESTING.md` brief.

### Phase H — Final verification
- Run `bun test --coverage`, report numbers.
- Run `bun run lint` if available.
- Spot-check a11y with screen-reader-style review of key routes.
- Closing report: files modified, tests added, a11y fixes, estimated new score.

### What I will NOT do
- Rewrite working features or migrations.
- Change UI/UX visually beyond a11y attribute additions.
- Touch the AI Gateway, Supabase auto-gen files, or route tree.
- Aggressive refactors that risk breaking Phase 1–9 features.

### Scope check before I start
This will be a large multi-turn implementation (~30–50 file changes, mostly new test files). Confirm:
1. Proceed with this scope?
2. Any files/routes you want me to skip?
