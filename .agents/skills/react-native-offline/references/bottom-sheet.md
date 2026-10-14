# Bottom sheets

Assumption: when you first need a bottom sheet in `packages/app`, build one shared `BottomSheetModal` in `src/components/BottomSheetModal.tsx` and use it for every slide-up panel (tag picker, edit transaction, adjust vault balance, confirm delete). Do not add `@gorhom/bottom-sheet` or similar without asking, and do not write another `<Modal>` sheet inside a screen. If the user prefers a library, follow its current docs instead of the build notes below.

The web app uses modals for these flows (`EditTransactionModal`, `AddTagModal`, `DeleteTagModal`). The native versions are good candidates for sheets.

## Usage

Mount the sheet to open it and unmount it in `onClose`. Keep the open state in the screen, typically a key for which content to show:

```tsx
const [deleting, setDeleting] = useState<TagDto | null>(null);

{deleting ? (
  <BottomSheetModal onClose={() => setDeleting(null)}>
    {(close) => (
      <>
        <Text accessibilityRole="header" style={s.sheetTitle}>Delete tag</Text>
        <Text style={s.body}>Transactions using this tag keep their other details.</Text>
        <Button label="Delete" onPress={() => onDelete(deleting.id).then(close)} />
        <Button label="Cancel" variant="secondary" onPress={close} />
      </>
    )}
  </BottomSheetModal>
) : null}
```

`children` is a function that receives `close`. Buttons inside the sheet must call that `close`, not `onClose`, or the sheet vanishes without the slide-down. `onClose` runs only after the exit animation ends. The backdrop tap and Android back should also call `close`.

The component owns the modal, backdrop, grabber, rounded top, horizontal padding, the bottom safe-area inset and `gap` between children. The caller only supplies content.

Keep the content's height fixed from the first frame. If it grows while the sheet slides in, `onLayout` fires again mid-animation, the height and timing reset, and the sheet jumps. Local SQLite reads are fast but still asynchronous, and one that resolves during the open animation is enough to cause this. Render the full layout immediately with placeholder values (for example the vault name and an empty balance line), and gate actions such as Save on a `loaded` flag. Do not gate the markup on it.

## How to build it, and why

These notes come from an earlier app and are the mistakes that made the first version look wrong or drop frames. Verify them on your React Native version.

1. `Modal` uses `animationType="none"`. `"slide"` moves the whole modal, so the backdrop slides up with the sheet instead of fading.
2. The backdrop and the sheet are two `Animated.View`s driven by one `Animated.Value` (0 to 1): backdrop `opacity`, sheet `translateY`. Both use `useNativeDriver: true`, and only `opacity` and `transform` are animated.
3. The open animation starts in the sheet's `onLayout`, not in `useEffect` on mount. On mount the native modal is not presented yet, so the first frames are lost and the sheet jumps.
4. `translateY` starts at the measured sheet height, not the window height. Starting at the window height spends half the animation offscreen and then crosses the visible part too fast.
5. Easing is `Easing.out(Easing.cubic)` for about 280 ms to open and `Easing.in(Easing.cubic)` for about 220 ms to close. Linear timing looks stiff.
6. Hold the `Animated.Value` with `useState(() => new Animated.Value(0))`. `useRef(...).current` can fail the `react-hooks/refs` lint rule, because it reads a ref during render.
7. The measured height is an `Animated.Value` set with `setValue` in `onLayout`, not React state. Build `translateY` once as `Animated.multiply(Animated.subtract(1, progress), sheetH)` and never rebuild it. Calling `setState` in `onLayout` re-renders while the animation starts, and `progress.interpolate(...)` returns a new node. The native driver then swaps nodes mid-animation and the sheet jumps.

Judge smoothness in a release build (`npx expo run:ios --configuration Release` or `npx expo run:android --variant release`). Dev builds can stutter even when animations run on the native driver.

The root is a `KeyboardAvoidingView` with `behavior="padding"`, so a text input in the sheet (a new tag name, an amount) stays above the keyboard. Do not `autoFocus` it: the keyboard would open while the sheet slides in and move it mid-animation. For the Reanimated-based alternative, see `references/keyboard-avoidance.md`.
