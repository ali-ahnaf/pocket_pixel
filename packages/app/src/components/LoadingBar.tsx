import { useEffect, useState } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color } from '../theme';

const BLOCKS = 8;
const HALF_CYCLE_MS = 600;
const STAGGER_MS = 150;

export interface LoadingBarProps {
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

// Indeterminate pixel progress bar: blocks blink in a staggered loop. Stretches to its parent's width unless `style` sets one.
export function LoadingBar({ accessibilityLabel = 'Loading', style }: LoadingBarProps) {
  const [opacities] = useState(() => Array.from({ length: BLOCKS }, () => new Animated.Value(1)));

  useEffect(() => {
    // Hard on/off blink like the web's steps(1) keyframes: zero-duration jumps separated by delays.
    const loops = opacities.map((opacity) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.15, duration: 0, delay: HALF_CYCLE_MS, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, delay: HALF_CYCLE_MS, useNativeDriver: true }),
        ]),
      ),
    );
    const timers = loops.map((loop, i) => setTimeout(() => loop.start(), i * STAGGER_MS));
    return () => {
      timers.forEach(clearTimeout);
      loops.forEach((loop) => loop.stop());
    };
  }, [opacities]);

  return (
    <View style={[styles.track, style]} accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel}>
      {opacities.map((opacity, i) => (
        <Animated.View key={i} style={[styles.block, { opacity }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: ms(24),
    flexDirection: 'row',
    gap: ms(3),
    padding: ms(3),
    backgroundColor: color.surfaceLow,
    borderWidth: ms(4),
    borderColor: color.border,
  },
  block: { flex: 1, backgroundColor: color.primary },
});
