---
name: frontend-engineer
description: Use when building React applications in .tsx files. Creates components, implements custom hooks, and implements state management. Invoke for Server Components, Suspense boundaries, useActionState forms, performance optimization, or React 19 features.
globs: packages/ui/**/*.{tsx,ts,css}
memory: project
---

Use this skill for frontend development using React and TypeScript. Follow modern React patterns, prioritize performance, and maintain a clean component structure.

# Block & Pixel Design System Guidelines

This document outlines the core patterns and conventions for building UI components in the `packages/ui` workspace of the Quest Expense app. It ensures that any future UI tasks maintain the consistent, retro-tactile voxel aesthetic established in the project.

## 1. Core Principles

- **Aesthetic**: Retro-tactile, pixelated, blocky interface (reminiscent of 16-bit RPGs and voxel games).
- **Colors & Tokens**: Always use the semantic color tokens defined in the Tailwind config (e.g., `bg-surface`, `text-primary`, `bg-error-container`). Do not use arbitrary generic colors.
- **Typography**:
  - `font-headline-lg` / `font-headline-md` (Anybody) for headers.
  - `font-body-lg` / `font-body-sm` (Inter) for standard text.
  - `font-label-caps` (JetBrains Mono) for uppercase tags, labels, and small UI text.
- **Borders & Shadows**: The aesthetic relies heavily on thick `border-4 border-black` combined with inset shadows to simulate 3D buttons and blocks. Whenever possible, use pre-built components to achieve this automatically.

## 2. Reusable Components (`@/components`)

Always prioritize using existing components from `packages/ui/src/components` over writing raw HTML/Tailwind from scratch.

- **`Button`**:
  - Variants: `"primary" | "secondary" | "tertiary" | "ghost" | "danger"`
  - Sizes: `"sm" | "md" | "lg"`
  - Automatically applies the tactile 3D click effect (`.btn` in `globals.css`).
- **`Card`**:
  - Use for standard content blocks. It defaults to the `surface-container-high` background.
  - Use the `elevated={true}` prop for high-priority cards (adds a dirt-brown border and drop shadow).
- **`Window`**:
  - Use for modal-like dialogs or overlays. Requires a `title` prop to render the distinct header bar.
- **`Input`**:
  - The custom `.pixel-input` with block cursor styling.
  - Props include `label` (renders an uppercase label above the input) and `error` (renders error text below).
- **`ProgressBar`**:
  - A blocky progress bar.
  - Props: `value`, `max` (default 100), `variant` (`primary`, `secondary`, `tertiary`, `error`), and `label`.
- **`Badge`**:
  - Small inline tags.
  - Variants match the Button variants.
- **always create a new component for modals/dialogs and call it from the main component.**
- **Try to split large blocks of UI elements into smaller components.**

## 3. Icons

- **Strict Requirement**: Use `lucide-react` for all icons.
- **Do NOT** use `material-symbols-outlined` or any other icon font/library.
- Example:

  ```tsx
  import { Home, Package, Settings, Plus } from 'lucide-react';

  <Button variant="ghost">
    <Home className="w-6 h-6" />
    <span className="font-label-caps">Home</span>
  </Button>;
  ```

## 4. Custom Styling (When components don't fit)

If you need a custom block that isn't a `<Card>`, mimic the tactile border and shadow approach manually.

**Example of a custom tactile block:**

```tsx
<div className="border-4 border-black shadow-[inset_2px_2px_0_rgba(255,255,255,0.08),inset_-2px_-2px_0_rgba(0,0,0,0.5)] bg-surface-container">{/* content */}</div>
```

**Images / Avatars:**
Always apply `[image-rendering:pixelated]` to images and avatars to preserve the crisp retro scaling without blurriness.

## 5. Global Styles (`globals.css`)

- Basic reset and typography defaults are handled in the `@layer base`.
- Selection color and scrollbar are customized to match the game aesthetic (`#a5d655` for primary accents).
- Do not clutter `globals.css` with component-specific CSS if it can be achieved using Tailwind classes or abstracted into a React Component in `@/components`.
