# Copilot Instructions for Studio Admin

## Build, lint, and verification commands

Use npm in this repository.

| Task                             | Command                                   |
| -------------------------------- | ----------------------------------------- |
| Install dependencies             | `npm install`                             |
| Run dev server                   | `npm run dev`                             |
| Production build                 | `npm run build`                           |
| Run production server            | `npm run start`                           |
| Lint only                        | `npm run lint`                            |
| Lint + format checks             | `npm run check`                           |
| Auto-fix lint/format issues      | `npm run check:fix`                       |
| Format codebase                  | `npm run format`                          |
| Regenerate theme preset metadata | `npm run generate:presets`                |
| Run checks for one file          | `npx @biomejs/biome check <path-to-file>` |

There is currently **no test runner / `test` script** configured in `package.json`, so there is no single-test command yet.

## High-level architecture

This is a Next.js 16 App Router dashboard template with a **colocation-first route structure**:

- `src/app/(main)/dashboard/**`: feature routes (default, crm, finance, analytics, etc.), each with its own `_components` folder.
- `src/app/(main)/auth/**`: authentication variants.
- `src/app/layout.tsx`: global shell and providers.

The app shell is driven by a **preferences pipeline** spread across server, client state, and CSS:

1. `src/lib/preferences/preferences-config.ts` defines preference keys, defaults, and persistence strategy.
2. `src/scripts/theme-boot.tsx` runs in `<head>` before hydration and applies persisted preference values to `<html>` data attributes and dark mode.
3. `src/stores/preferences/preferences-provider.tsx` + `preferences-store.ts` keep client-side Zustand state synced with DOM state.
4. `src/lib/preferences/theme-utils.ts` and `layout-utils.ts` are the only utilities that should mutate global theme/layout attributes.
5. `src/server/server-actions.ts` exposes cookie-backed server actions used by dashboard layout SSR (`getPreference`).

Dashboard chrome is **config-driven**:

- `src/navigation/sidebar/sidebar-items.ts` defines sidebar/nav structure (groups, items, subitems, flags like `comingSoon`).
- `src/app/(main)/dashboard/_components/sidebar/*` renders shell components from that config.

Theme presets are **CSS-driven + generated TypeScript metadata**:

- Preset CSS files live in `src/styles/presets/*.css`.
- `src/scripts/generate-theme-presets.ts` parses those files and rewrites the generated block in `src/lib/preferences/theme.ts`.
- `src/app/globals.css` imports preset CSS files and maps global variables used across components.

## Key conventions in this repo

- Follow the colocation pattern: keep route-specific UI under that route’s `_components`; only promote truly shared parts to `src/components`.
- Keep imports on project aliases from `components.json` (`@/components`, `@/lib`, `@/hooks`, etc.), not deep relative paths.
- When changing preferences from UI controls, keep the same sequence used in sidebar controls:
  1. Apply to DOM (`applyThemeMode`, `applyContentLayout`, etc.)
  2. Update Zustand store
  3. Persist via `persistPreference`
- Treat `sidebar_variant` and `sidebar_collapsible` as SSR-critical settings (must remain cookie-readable for server layouts).
- If you add/rename a theme preset:
  1. Add/update the preset CSS in `src/styles/presets/`
  2. Ensure `label:` and `value:` comments are present in the CSS
  3. Update preset imports in `src/app/globals.css`
  4. Run `npm run generate:presets`
- `src/components/ui` contains shadcn-sourced UI files and is intentionally excluded from Biome checks in `biome.json`; prefer extending behavior in route/shared components instead of broad rewrites there.
- Pre-commit hook (`.husky/pre-commit`) runs `npm run generate:presets`, stages `src/lib/preferences/theme.ts`, then runs `lint-staged`.

## Execution expectations for Copilot sessions in this repo

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
