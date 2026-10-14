import { Pressable, StyleSheet, Text } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, shadow } from '../../theme';

// Floating button that summons the wizard chat sheet, bottom-right of the Stats screen.
export function WizardFab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Summon Aldric the Wise" onPress={onPress} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <Text style={styles.glyph}>🪄</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: ms(16),
    bottom: ms(16),
    width: ms(56),
    height: ms(56),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primary,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.coin,
  },
  pressed: { transform: [{ translateY: 2 }], boxShadow: shadow.button.pressed },
  glyph: { fontSize: ms(26) },
});
