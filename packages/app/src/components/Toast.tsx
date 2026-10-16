import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { color, font, gutter, shadow, space, text } from '../theme';

const VISIBLE_MS = 3000;

// Module-level so any screen or sheet can call showToast without a context provider. One toast at a time; a new one replaces the current one.
let show: ((message: string) => void) | null = null;

export const showToast = (message: string): void => show?.(message);

/** Mount once at the app root. Renders the latest `showToast` message near the top of the screen. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    show = (next) => {
      clearTimeout(timer);
      setMessage(next);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer = setTimeout(() => Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => finished && setMessage(null)), VISIBLE_MS);
    };
    return () => {
      show = null;
      clearTimeout(timer);
    };
  }, [opacity]);

  if (!message) return null;
  return (
    <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[styles.toast, { top: insets.top + ms(space[2]), opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: ms(gutter),
    right: ms(gutter),
    padding: ms(space[3]),
    backgroundColor: color.surfaceHigh,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.popover,
  },
  text: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
});
