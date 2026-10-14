import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space } from '../../theme';

// Decorative three squares and version tag at the bottom of the web log and edit sheets.
export function SheetFooterDecor() {
  return (
    <View style={styles.footer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.squares}>
        <View style={[styles.square, styles.error]} />
        <View style={[styles.square, styles.primary]} />
        <View style={[styles.square, styles.secondary]} />
      </View>
      <Text style={styles.version}>VER 1.0.42_STABLE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: ms(space[1]), opacity: 0.5 },
  squares: { flexDirection: 'row', gap: ms(space[1]) },
  square: { width: ms(16), height: ms(16), borderWidth: ms(4), borderColor: color.border },
  error: { backgroundColor: color.error },
  primary: { backgroundColor: color.primary },
  secondary: { backgroundColor: color.secondary },
  version: { fontFamily: font.mono, fontSize: ms(10), color: color.outline },
});
