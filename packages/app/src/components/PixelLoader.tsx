import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../theme';

const BLOCKS = 8;
const HALF_CYCLE_MS = 600;
const STAGGER_MS = 150;

// Fills its parent. Place it in a full-screen view to cover the screen like the web loader.
export function PixelLoader() {
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
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel="Loading">
      <View style={styles.coin}>
        <Text style={styles.coinSymbol}>$</Text>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Pocket Pixel</Text>
        <Text style={styles.subtitle}>LOADING...</Text>
      </View>
      <View style={styles.track}>
        {opacities.map((opacity, i) => (
          <Animated.View key={i} style={[styles.block, { opacity }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: ms(space[5]), backgroundColor: color.bg },
  coin: {
    width: ms(64),
    height: ms(64),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primary,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.coin,
  },
  coinSymbol: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), color: color.onPrimary },
  titleBlock: { alignItems: 'center' },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.primary, textTransform: 'uppercase' },
  subtitle: { fontFamily: font.mono, fontSize: ms(10), color: color.outline, letterSpacing: 2.5, marginTop: ms(space[1]) },
  track: {
    width: ms(192),
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
