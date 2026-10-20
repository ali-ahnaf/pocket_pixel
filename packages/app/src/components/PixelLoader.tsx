import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../theme';
import { LoadingBar } from './LoadingBar';

// Fills its parent. Place it in a full-screen view to cover the screen like the web loader.
export function PixelLoader() {
  return (
    <View style={styles.container}>
      <View style={styles.coin}>
        <Text style={styles.coinSymbol}>$</Text>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Pocket Pixel</Text>
        <Text style={styles.subtitle}>LOADING...</Text>
      </View>
      <LoadingBar style={styles.track} />
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
  track: { width: ms(192) },
});
