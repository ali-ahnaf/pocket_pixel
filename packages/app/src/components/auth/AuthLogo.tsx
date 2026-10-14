import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../../theme';

// Coin badge plus "Pocket Pixel" title shown above the sign in and sign up cards.
export function AuthLogo() {
  return (
    <View style={styles.container}>
      <View style={styles.coin}>
        <Text style={styles.coinSymbol}>$</Text>
      </View>
      <View style={styles.titleBlock}>
        <Text style={styles.title} accessibilityRole="header">
          Pocket Pixel
        </Text>
        <Text style={styles.subtitle}>EXPENSE TRACKER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: ms(space[3]) },
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
  title: { fontFamily: font.heading, fontSize: ms(text.headlineLg.fontSize), lineHeight: ms(text.headlineLg.lineHeight), color: color.primary, textTransform: 'uppercase' },
  subtitle: { fontFamily: font.mono, fontSize: ms(11), color: color.outline, letterSpacing: 2, marginTop: ms(space[1]) },
});
