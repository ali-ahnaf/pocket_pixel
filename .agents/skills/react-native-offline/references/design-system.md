# Design system and layout

Assumption: design tokens live in `src/theme.ts` (create it when starting `packages/app`). Port the look from the web app's Tailwind config and `packages/ui/src/app/globals.css` rather than inventing a new palette. Ask the user if the native app should look the same as the web app.

## Tokens

Define these in `src/theme.ts` and use them everywhere. No hex values or font names in screens.

- Colors: background, surface, text, muted text, border, accent, and the semantic colors for expense, income, and transfer amounts. Tag and vault colors chosen by the user are stored data, not tokens.
- Spacing: a small named scale. Wrap values in `ms()`, per `references/responsive-sizing.md`.
- Typography: font families and a few text sizes (title, body, caption, amount).
- Theme mode: decide with the user whether dark mode is in scope before adding color pairs.

## Responsiveness and safe area

- Wrap the root component of a route in a scroll view so content that grows can still be reached.
- Use `<ScrollView contentInsetAdjustmentBehavior="automatic" />` instead of `<SafeAreaView>` for safe area insets. Apply the same prop to `FlatList` and `SectionList`. Check that it behaves as expected on both platforms for your SDK.
- Use flexbox instead of the `Dimensions` API.
- Prefer `useWindowDimensions` over `Dimensions.get()` to measure the screen.

## Behavior

- When a route belongs to a Stack, its first child should almost always be a `ScrollView` with `contentInsetAdjustmentBehavior="automatic"` set. The exception is a long list, which is a `FlatList` per `SKILL.md`.
- For screens with input fields or forms (add transaction, add debt, add tag), use `KeyboardAwareScrollView`, per `references/keyboard-avoidance.md`.
- Use `expo-haptics` sparingly and conditionally on iOS, for example on saving a transaction or toggling expense/income.
- Prefer views with built-in haptics, such as React Native's `Switch` and `@react-native-community/datetimepicker` for the transaction date.
- Prefer `headerSearchBarOptions` in `Stack.Screen` options to add a search bar to the transaction list.
- Use `<Text selectable />` on text that users may want to copy, such as a transaction title or note.
- Format large amounts compactly in summary cards (1.4M, 38k) but show exact amounts in transaction rows and forms.
- Never use web elements such as `div` or `img` unless in a webview or Expo DOM component.
