---
name: frontend-engineer
description: Builds and updates the web UI in packages/ui (Next.js 14 App Router, React 18, Tailwind 3) using the repo's pixel design system, shared components, axios API clients, and Vitest/Playwright tests. Use when adding or changing pages, components, modals, hooks, or styles under packages/ui. For packages/app (Expo / React Native), use the react-native-offline skill instead.
globs: packages/ui/**/*.{tsx,ts,css}
memory: project
---

Scope: `packages/ui` only. For anything in `packages/app` (planned Expo app, not created yet), follow the `react-native-offline` skill. Do not copy web patterns from here into it.

## Stack (verified in packages/ui/package.json)

- Next.js 14 App Router with `output: "export"` and `trailingSlash: true` (static export, no server rendering at runtime), React 18, Tailwind 3, `lucide-react`, `recharts`, `axios`.
- React 18 only. Do not use React 19 features such as `useActionState`, `use()`, or form actions.
- Pages and most components start with `'use client'`. Because of the static export, do not add server-only code (server actions, route handlers, cookies/headers APIs).
- Path alias `@/*` maps to `src/*`.

## Where things live

- `src/app/<route>/page.tsx`: pages. Routes include `signin`, `signup`, `stats`, `debts`, `settings`, `profile`.
- `src/components`: shared components, each with a sibling `*.test.tsx`. Export new shared components from `src/components/index.ts`. Feature subfolders: `pending-expenses/`, `wizard/`.
- `src/hooks`: custom hooks (`useAuth`, `useDisplaySettings`, `useOnboarding`, ...).
- `src/lib/api`: `ApiClient` base class plus `AuthApi`, `ProfileApi`; instances are exported from `src/lib/api/index.ts`. Follow this class-per-resource pattern for new endpoints.
- `src/lib/helpers`, `src/lib/utils.ts` (`cn()` joins class names): shared helpers. Check them before writing new ones.
- Request/response types come from `@expense-tracker/shared`. Never redefine DTOs in the UI. Run `npm run build:shared` after changing shared.

## State and data

No state library and no data-fetching library. Use local `useState`/`useEffect`/`useMemo`, custom hooks, and the existing `QueryParamsProvider` context. Do not add Redux, Zustand, SWR, or React Query without asking. Use `next/dynamic` for heavy client-only components (see the chart in `stats/page.tsx`).

## Design system

Retro, blocky, pixel look. Tokens are in `packages/ui/tailwind.config.ts`; shared classes are in `src/app/globals.css`.

- Colors: use the semantic tokens (`bg-surface`, `bg-surface-container-high`, `text-on-surface`, `text-primary`, `bg-error-container`, ...). Do not use arbitrary hex colors.
- Radius is 0 by default. Keep corners square.
- Spacing tokens: `block-1` to `block-8` (4px steps, e.g. `p-block-4`).
- Fonts: `font-anybody` (headers), `font-inter` (body), `font-mono` (JetBrains Mono, labels). Sizes: `text-headline-lg`, `text-headline-md`, `text-body-lg`, `text-body-sm`, `text-label-caps`.
- Note: the code base contains many `font-headline-*`, `font-body-*`, `font-label-caps` classes. These are not defined in the Tailwind config, so they do nothing. Prefer the real `text-*` size tokens plus a `font-*` family in new code. Do not mass-fix existing usages as part of an unrelated task.
- Borders: `border-4 border-black` plus inset shadows (`shadow-bevel`, `shadow-card`, ...). Prefer the components below over rebuilding this.
- Pixel images and avatars: add `[image-rendering:pixelated]`.

## Shared components (`@/components`)

- `Button`: variants `primary | secondary | tertiary | ghost | danger`, sizes `sm | md | lg`.
- `Card`: optional `title`, `elevated` for the brown-bordered variant. `Window` (same file) is exported but currently unused.
- `Input`: props `label`, `error`, plus native input props.
- `ProgressBar`, `Badge`, `PixelLoader`, `PixelDatePicker`, `Dropdown`, `AppBar`, `BackButton`, `BottomNavBar`, `DesktopSidebar`.

Prefer these over raw Tailwind. Keep component-specific CSS out of `globals.css` unless it is a reusable block class like `.btn` or `.card`.

## Components and modals

- Put each modal in its own file in `src/components` (`DeleteTagModal.tsx` is a typical bottom-sheet example with `isOpen`, `onClose`, and an enter/exit transition) and render it from the page or parent component.
- Split large JSX blocks into smaller components. Type props with an interface; avoid `any`.
- Icons: `lucide-react` only. No icon fonts.
- Responsive: the UI is mobile-first with `BottomNavBar` on small screens and `DesktopSidebar` on desktop. Check both when changing layout.

## Tests

- Unit: Vitest + Testing Library, `npm run test:ui:unit` from the root (config in `packages/ui/vitest.config.ts`, files `src/**/*.test.{ts,tsx}`). Add or update the sibling test when changing a component or helper.
- E2E: Playwright, `npm run test:ui:e2e` (specs in `packages/ui/e2e`: auth-guard, login, signup). Run the relevant spec when touching auth, redirects, or `ApiClient`.
- Follow `.agents/rules/testing.md`. Run `npx prettier --write <file>` after editing (`singleQuote`, `trailingComma: all`, `printWidth: 200`).

## Offline-first direction (assumption)

The project may move to an offline-first Expo app in `packages/app` with local SQLite and no API server. This is a goal, not a decision made in the web code. Until then, keep `packages/ui` talking to the API through `src/lib/api`, and keep UI logic separate from axios calls so it is easier to reuse later.
