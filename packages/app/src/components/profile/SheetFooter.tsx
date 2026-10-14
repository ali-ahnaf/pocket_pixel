import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space } from '../../theme';

// Decorative footer of the web modals: three pixel squares and an interface label.
export function SheetFooter({ label, danger = false }: { label: string; danger?: boolean }) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.squares}>
        <View style={[styles.square, danger ? styles.error : styles.primary]} />
        <View style={[styles.square, styles.secondary]} />
        <View style={[styles.square, styles.tertiary]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: 0.3, paddingTop: ms(space[2]) },
  squares: { flexDirection: 'row', gap: ms(space[1]) },
  square: { width: ms(12), height: ms(12), borderWidth: ms(2), borderColor: color.border },
  primary: { backgroundColor: color.primary },
  error: { backgroundColor: color.error },
  secondary: { backgroundColor: color.secondary },
  tertiary: { backgroundColor: color.tertiary },
  label: { fontFamily: font.mono, fontSize: ms(10), color: color.onSurface },
});
