import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { SheetFooter } from './SheetFooter';
import { PixelIcon, PixelIconName } from '../PixelIcon';
import { SheetHeader } from '../SheetHeader';

export type DeleteVaultAction = 'delete_transactions' | 'move_transactions';

export interface DeleteVaultSheetProps {
  vaultName: string;
  onDelete: (action: DeleteVaultAction) => void;
  onClose: () => void;
}

const OPTIONS: { action: DeleteVaultAction; icon: PixelIconName; title: string; body: string }[] = [
  { action: 'move_transactions', icon: 'ArrowLeftRight', title: 'Move to Default', body: 'Transfer all transactions to your default vault.' },
  { action: 'delete_transactions', icon: 'Trash', title: 'Delete All', body: 'Permanently delete all related transactions.' },
];

// Ported from packages/ui/src/components/DeleteVaultModal.tsx. Mount to open.
export function DeleteVaultSheet({ vaultName, onDelete, onClose }: DeleteVaultSheetProps) {
  const [selected, setSelected] = useState<DeleteVaultAction>('move_transactions');

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader icon="TriangleAlert" title="Delete Vault" danger onClose={close} />
          <Text style={styles.message}>
            You are about to delete the vault <Text style={styles.name}>&quot;{vaultName}&quot;</Text>. What would you like to do with its related transactions?
          </Text>
          <View style={styles.options} accessibilityRole="radiogroup">
            {OPTIONS.map((option) => {
              const isSelected = selected === option.action;
              const isDelete = option.action === 'delete_transactions';
              return (
                <Pressable
                  key={option.action}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => setSelected(option.action)}
                  style={[styles.option, isSelected ? (isDelete ? styles.deleteActive : styles.moveActive) : styles.optionIdle]}
                >
                  <View style={[styles.radio, isSelected && (isDelete ? styles.radioDelete : styles.radioMove)]}>{isSelected && <View style={styles.dot} />}</View>
                  <View style={styles.optionText}>
                    <View style={styles.optionTitleRow}>
                      <PixelIcon name={option.icon} size={ms(18)} />
                      <Text style={[styles.optionTitle, isSelected && (isDelete ? styles.onDelete : styles.onMove)]}>{option.title}</Text>
                    </View>
                    <Text style={[styles.optionBody, isSelected && (isDelete ? styles.onDelete : styles.onMove)]}>{option.body}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Button
            label="Confirm Delete"
            variant="danger"
            size="lg"
            onPress={() => {
              onDelete(selected);
              close();
            }}
          />
          <SheetFooter label="DANGER_ZONE_INTERFACE" danger />
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  message: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurfaceVariant },
  name: { fontFamily: font.bodyBold, color: color.onSurface },
  options: { gap: ms(space[3]) },
  option: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]), padding: ms(space[3]), borderWidth: ms(4), borderColor: color.border },
  optionIdle: { backgroundColor: color.surfaceLowest, boxShadow: shadow.card },
  moveActive: { backgroundColor: color.secondaryContainer, boxShadow: shadow.toggleActive, transform: [{ translateY: 2 }] },
  deleteActive: { backgroundColor: color.errorContainer, boxShadow: shadow.toggleActive, transform: [{ translateY: 2 }] },
  radio: { width: ms(20), height: ms(20), alignItems: 'center', justifyContent: 'center', borderWidth: ms(2), borderColor: color.border, backgroundColor: color.surfaceHighest },
  radioMove: { backgroundColor: color.secondary },
  radioDelete: { backgroundColor: color.error },
  dot: { width: ms(10), height: ms(10), backgroundColor: color.border },
  optionText: { flex: 1 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  optionTitle: { fontFamily: font.heading, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurface },
  optionBody: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface, opacity: 0.8 },
  onMove: { color: color.onSecondaryContainer },
  onDelete: { color: color.onErrorContainer },
});
