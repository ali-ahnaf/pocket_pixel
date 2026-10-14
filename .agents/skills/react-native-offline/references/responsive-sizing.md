# Responsive sizing with `react-native-size-matters`

Assumption: `packages/app` uses `react-native-size-matters` for pixel dimensions that should adapt to device size. Add it when creating the app if it is not there, and check its current docs, since helper behavior and defaults are version dependent.

Import the short aliases, never the full names:

```tsx
import { ms } from "react-native-size-matters";
```

### Which helper to use

- `ms(size, factor?)` (moderate scale): the default. Font sizes, line heights, padding, margins, gaps, border radius, and fixed widths and heights. It scales gently, so text does not blow up on tablets. The library's default factor is 0.5 at the time of writing; verify in the docs.
- `s(size)` (scale): widths that must scale linearly with screen width, such as a summary card sized to the screen.
- `vs(size)` (vertical scale): heights that must scale linearly with screen height.
- `mvs(size, factor?)` (moderate vertical scale): heights that should adapt, but not linearly.

### Conventions for this app

1. Wrap every pixel value in a style in `ms(...)`. Never hard-code the number.

   ```tsx
   const s = StyleSheet.create({
     amount: { fontFamily: font.semibold, fontSize: ms(28), letterSpacing: -0.84 },
     rowTitle: { fontFamily: font.regular, fontSize: ms(14), lineHeight: ms(20) },
   });
   ```

2. Inline style objects follow the same rule: `<View style={{ gap: ms(8) }}>`.
3. Shared components that take a size prop (an `Icon` with `size`, a `ProgressBar` with `height`) scale it themselves. Pass the raw number (`<Icon size={16}>`). Wrapping it in `ms()` at the call site scales it twice. Decide this when you create the component and keep it consistent.
4. A raw `<Svg width height>` outside those components takes `ms(...)` at the call site.
5. Wrap only the numeric pixel value. Leave strings and percentages alone.
6. Do not use `ScaledSheet`. Use `StyleSheet.create` with explicit `ms(...)` calls, so the scaling is visible where the value is written.

### When not to scale

- `0`, and `borderRadius: 999` used for pills and circles such as tag chips.
- `letterSpacing` values below 1 in absolute terms. Scaling them makes kerning uneven.
- `borderWidth` below 2 (hairlines). Scaling them blurs the edge.
- `shadowOffset`, `shadowRadius`, and `elevation`.
- `hitSlop`. It sets the touch area, not a visual size.
- SVG coordinates inside a `viewBox` (`cx`, `cy`, `r`, path data), for example in a spend chart. The `viewBox` scales them.
- Flex, opacity, z-index, animation values, and other non-pixel numbers.
