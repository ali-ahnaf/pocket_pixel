import { Pressable, StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, shadow } from '../../theme';
import { PixelIcon } from '../PixelIcon';

// Floating button that summons the wizard chat sheet, bottom-right of the Stats screen.
export function WizardFab({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Summon Aldric the Wise" onPress={onPress} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <PixelIcon name="WandSparkles" size={ms(32)} />
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
});
