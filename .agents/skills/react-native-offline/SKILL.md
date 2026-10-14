---
name: react-native-offline
description: Conventions for building the offline-first Expo / React Native expense tracker in packages/app, with all data in local SQLite and no API server. Covers local data access, reusable components, list smoothness, keyboard, bottom sheets, and responsive sizing. Use whenever adding or changing a screen, component, list, form, local database code, or on-device migration in packages/app, or when the user mentions React Native, Expo, offline, local SQLite, a screen, jank, or scrolling.
---

# React Native offline-first conventions

`packages/app` does not exist yet. This skill describes the structure and conventions to
follow when creating it. Where it says "put X in Y", create Y if it is missing; do not
assume it is already there.

Working assumptions (confirm with the user if any is wrong):

- Expo with Expo Router, screens in `src/app/`, shared UI in `src/components/`, design tokens in `src/theme.ts`.
- `expo-sqlite` for local persistence, with no API server.
- Reuse `@expense-tracker/shared` types and the existing route/service/repository layering, minus the HTTP layer.
- The domain is the one in `packages/ui`: transactions, vaults, tags, debts, recurring transactions.

Expo APIs change between SDK versions. Check the docs for the installed SDK instead of relying on memory or on version numbers in these files.

## References

Read the matching file in `references/` before starting that kind of work:

- `references/offline-data.md`: any read or write of app data, the SQLite data layer, on-device migrations, backup and export, and the API-only features that still need a decision.
- `references/responsive-sizing.md`: any `fontSize`, padding, margin, radius, or other pixel value in a style.
- `references/keyboard-avoidance.md`: any screen with a text input or form that the keyboard can cover, such as the add-transaction form.
- `references/design-system.md`: a new screen or route, safe-area and `ScrollView` layout, screen measurement, or haptics.
- `references/images.md`: only if the app shows images (receipt attachments, vault icons). Short.
- `references/bottom-sheet.md`: any bottom sheet or slide-up panel, such as a tag picker or an edit-transaction sheet.

## 1. Data is local and never blocks the UI

- Every read and write for core features goes to local SQLite. No network call is allowed on the path of adding, editing, listing, or summarising transactions, vaults, tags, or debts.
- The UI never waits on the network. There is no spinner for "saving to the server", because there is no server.
- Screens do not query SQLite directly. They call the data layer described in `references/offline-data.md`.
- Never load a whole table into state. List screens read a page or a filtered window (for example one month of transactions) and fetch more on scroll.

Details, migrations, and open decisions are in `references/offline-data.md`.

## 2. Reuse components

Before writing UI, look in `src/components/` for something that already does the job. The web app in `packages/ui/src/components/` (`Button`, `Input`, `Card`, `Badge`, `ProgressBar`, `Dropdown`) shows which pieces recur; build native equivalents instead of inventing new ones.

Extract a component when:

- The same UI element appears on more than one screen. Two uses is the threshold, not three. Typical cases: buttons, text fields, section headers, cards, transaction rows, tag chips, vault budget bars, empty states.
- A screen copies a block of JSX from another screen and changes only text or a value. That is one component with props.

How to build it:

- One component per file in `src/components/`, named export, `PascalCase.tsx`. Create `Button.tsx` first and use it as the reference for the rest.
- Props describe intent (`variant="primary"`, `label`, `onPress`), not raw styles. Add a `style` prop only when a caller needs to adjust layout.
- Colors, fonts, and spacing come from `src/theme.ts`. Never hardcode a hex value or font name in a screen or component; add a token instead. User-chosen tag and vault colors (`backgroundColor` in the shared DTOs) are data, not tokens.
- Keep accessibility in the shared component: `accessibilityRole`, `accessibilityState`, `accessibilityLabel` for icon-only controls, and a touch target of at least 44x44 (use `hitSlop` if the visual is smaller).
- When you extract, replace every existing copy in the same change.
- Do not build a component "for later". If only one screen needs it, keep it there until a second one does.

## 3. UI smoothness

Target 60 fps on a mid-range Android phone, not just the simulator. Anything that drops frames during scroll, typing, or a transition is a bug.

Scrolling:

- A screen whose content can grow must scroll. Content grows with list data, user text, error messages, a small phone, or a large system font size.
- Content that can grow without limit (transactions, debts, history): `FlatList` / `SectionList`, with the rest of the screen in `ListHeaderComponent` / `ListFooterComponent` so the page scrolls as one. Feed it from paginated queries, per `references/offline-data.md`. Never `.map()` inside a `ScrollView` for this, and never nest a `FlatList` in a `ScrollView` of the same direction.
- Bounded content that can still overflow (forms, settings, detail screens): a `ScrollView` as the first child of the route, per `references/design-system.md`. Screens with inputs use `KeyboardAwareScrollView`, per `references/keyboard-avoidance.md`.
- A fixed footer button (for example "Save transaction") stays outside the scroll container.

Lists:

- Always set `keyExtractor` with the row's stable id, never the array index.
- Wrap the row component in `React.memo` and pass `renderItem` as a stable function (defined outside the component or with `useCallback`).
- Set `getItemLayout` when rows have a fixed height.
- Do not add `@shopify/flash-list` or similar without asking; tune `FlatList` first.

Re-renders:

- Do not assume the React Compiler is enabled. Check the project config; if it is off, memoization is manual. Use `useCallback` / `useMemo` for callbacks and objects passed to memoized children or used in effect dependency arrays. Do not wrap everything by reflex.
- Styles go in `StyleSheet.create` at the bottom of the file. No inline style objects in lists or frequently rendered components; combine a static style with a small conditional one for dynamic parts.
- Keep state as low in the tree as possible. The amount field's value should not re-render the whole form on every keystroke.
- Derive values during render instead of syncing them into state with `useEffect`.

Animations and interaction:

- Run animations on the native thread: `Animated` with `useNativeDriver: true`, and only animate `transform` and `opacity`.
- Give immediate press feedback (the `pressed` state of `Pressable`) and do slow work after it, not before.
- Do not block the JS thread with heavy work in render or in a press handler. Totals, monthly sums, and tag breakdowns are computed by SQL (`SUM`, `GROUP BY`) in the data layer, not by looping over arrays in the screen. Move any remaining heavy work out of render or memoize it.

Images:

- Only a few places need images. Rules are in `references/images.md`.

## Before you finish

1. Grep `src/app/` for JSX or styles you just duplicated; extract if it now appears twice.
2. Check that no new hex colors or font names were added outside `src/theme.ts`.
3. Check that no screen imports `expo-sqlite` or runs SQL directly, and that no list loads a full table.
4. Run `npx tsc --noEmit` and `npx expo lint` in `packages/app`, plus any tests the data layer has.
5. For list, animation, or migration changes, say whether you checked it on a device. If not, say so.
