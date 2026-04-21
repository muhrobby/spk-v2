# AGENTS.md

Use `npm` in this repo.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Start prod server: `npm run start`
- Lint only: `npm run lint`
- Lint + format checks: `npm run check`
- Auto-fix lint/format: `npm run check:fix`
- Format: `npm run format`
- Check one file: `npx @biomejs/biome check <path-to-file>`
- Regenerate theme preset metadata: `npm run generate:presets`
- Drizzle generate/migrate: `npm run db:generate && npm run db:migrate`
- Seed default weights: `npm run db:seed`
- Seed admin user: `npm run db:seed:admin`
- There is no `test` script and no dedicated `typecheck` script in `package.json`.
- Practical verification is `npm run check && npm run build`.

## Setup gotchas

- Copy `.env.example` to `.env` and set `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`.
- `drizzle.config.ts` defaults `DATABASE_URL` to `mysql://root:password@localhost:3306/spk` if unset; Better Auth env vars do not have defaults.
- Seed scripts and `generate:presets` run through `ts-node -P tsconfig.scripts.json`.

## Architecture

- This is a Next.js 16 App Router app with route colocation.
- Main feature routes live under `src/app/(main)/dashboard/**`; keep route-specific UI in each route's `_components` folder.
- Auth variants live under `src/app/(main)/auth/**`.
- Global shell and providers start in `src/app/layout.tsx`.
- Dashboard shell/auth gate live in `src/app/(main)/dashboard/layout.tsx`; it reads SSR-critical sidebar prefs and calls `requireAuthSession()`.
- `src/proxy.ts` protects `/dashboard/*` using Better Auth session cookies and redirects unauthenticated users to `/auth/login`.
- Server-side mutations and SPK/domain logic live under `src/actions/*`.

## Preference and theme pipeline

- Preference keys/defaults/persistence strategy: `src/lib/preferences/preferences-config.ts`.
- Early DOM boot before hydration: `src/scripts/theme-boot.tsx`.
- Client state sync: `src/stores/preferences/preferences-provider.tsx` and `preferences-store.ts`.
- Only `src/lib/preferences/theme-utils.ts` and `layout-utils.ts` should mutate global theme/layout DOM attributes.
- Cookie-backed SSR preference reads live in `src/server/server-actions.ts`.
- Treat `sidebar_variant` and `sidebar_collapsible` as SSR-critical; they must stay cookie-readable.
- When UI changes a preference, keep the existing order: apply to DOM, update Zustand store, then `persistPreference`.

## Config-driven UI

- Sidebar/navigation structure is defined in `src/navigation/sidebar/sidebar-items.ts`; sidebar components render from that config.
- Theme presets are CSS-first: preset files live in `src/styles/presets/*.css`, `src/app/globals.css` imports them, and `src/scripts/generate-theme-presets.ts` rewrites the generated block in `src/lib/preferences/theme.ts`.
- If you add or rename a preset: update `src/styles/presets/*.css`, keep the `label:` and `value:` comments, update imports in `src/app/globals.css`, then run `npm run generate:presets`.

## Conventions

- Use path aliases from `components.json` (`@/components`, `@/lib`, `@/hooks`, `@/components/ui`) instead of deep relative imports.
- `src/components/ui` contains shadcn-sourced components and is excluded from Biome via `biome.json`; prefer wrapping/extending in route or shared components instead of large rewrites there.
- Biome ignores `.github`, `.husky`, build output, and `src/components/ui`; do not assume those paths are covered by `npm run check`.
- The repo-local OpenCode config only enables the shadcn MCP (`opencode.json`).
- Pre-commit runs `npm run generate:presets`, stages `src/lib/preferences/theme.ts`, then runs `lint-staged`.

## WAJIB

- Work like a **senior software architect + senior programmer**: design first, then implement in small, modular, systematic changes.
- Prioritize security for any server/API/auth/data change:
  1. Validate all external input at boundaries (prefer Zod schemas).
  2. Use parameterized queries / ORM-safe APIs only (never concatenate SQL).
  3. Add CSRF protections for state-changing, cookie-authenticated endpoints.
  4. Use secure cookie/session settings (`httpOnly`, `secure`, `sameSite`) and avoid exposing sensitive data.
- Keep implementations clean and maintainable: small focused functions, clear naming, no duplicated logic, and explicit error handling.
- Before coding, give a brief implementation approach (short plan), then execute.
- When specialized skills/tools are available (for example shadcn, security, docs, testing), use the relevant one instead of ad-hoc implementation.
- Before implementing any change, identify and use the relevant MCP to fetch the latest official documentation; do not rely on memory or outdated references.
