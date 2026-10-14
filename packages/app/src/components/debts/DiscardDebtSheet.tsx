import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { SheetHeader } from '../SheetHeader';

export interface DiscardDebtSheetProps {
  debtTitle: string;
  onDiscard: () => void;
  onClose: () => void;
}

// Ported from packages/ui/src/components/DiscardDebtModal.tsx.
export function DiscardDebtSheet({ debtTitle, onDiscard, onClose }: DiscardDebtSheetProps) {
  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title="Discard Due" glyph="⚠" danger onClose={close} />

          <Text style={styles.body}>
            Are you sure you want to discard the due <Text style={styles.strong}>&quot;{debtTitle}&quot;</Text>? This template will be removed and can no longer be applied.
          </Text>

          <View style={styles.actions}>
            <Button label="Cancel" variant="ghost" size="lg" onPress={close} style={styles.action} />
            <Button
              label="Discard"
              variant="danger"
              size="lg"
              onPress={() => {
                onDiscard();
                close();
              }}
              style={styles.action}
            />
          </View>

          <View style={styles.decor}>
            <View style={styles.squares}>
              <View style={[styles.square, styles.squareError]} />
              <View style={[styles.square, styles.squareSecondary]} />
              <View style={[styles.square, styles.squareTertiary]} />
            </View>
            <Text style={styles.decorText}>DANGER_ZONE_INTERFACE</Text>
          </View>
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurfaceVariant, marginTop: ms(space[4]) },
  strong: { fontFamily: font.bodyBold, color: color.onSurface },
  actions: { flexDirection: 'row', gap: ms(space[4]), paddingTop: ms(space[2]) },
  action: { flex: 1 },
  decor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: 0.3, paddingTop: ms(space[2]) },
  squares: { flexDirection: 'row', gap: ms(space[1]) },
  square: { width: ms(12), height: ms(12), borderWidth: ms(2), borderColor: color.border },
  squareError: { backgroundColor: color.error },
  squareSecondary: { backgroundColor: color.secondary },
  squareTertiary: { backgroundColor: color.tertiary },
  decorText: { fontFamily: font.mono, fontSize: ms(10), color: color.onSurface },
});
