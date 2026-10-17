import type { AdventureItemDto, UpdateAdventureItemInput } from '@expense-tracker/shared';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { AmountInput } from '../home/AmountInput';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Input } from '../Input';
import { SheetHeader } from '../SheetHeader';

export interface AdventureItemSheetProps {
  /** Edit this item; omit to add a new one. */
  item?: AdventureItemDto | null;
  /** Ticking an item bought: asks only for the actual cost, prefilled with the planned cost. */
  buying?: boolean;
  onSave: (data: UpdateAdventureItemInput) => void;
  onClose: () => void;
}

export function AdventureItemSheet({ item = null, buying = false, onSave, onClose }: AdventureItemSheetProps) {
  const isEditing = item !== null;
  const [name, setName] = useState(item?.name ?? '');
  const [plannedCost, setPlannedCost] = useState(item ? String(item.plannedCost) : '');
  const [actualCost, setActualCost] = useState(item ? String(item.actualCost ?? item.plannedCost) : '');

  const showActual = buying || (isEditing && item.isBought);
  const costsValid = (buying || parseFloat(plannedCost) >= 0) && (!showActual || parseFloat(actualCost) >= 0);
  const canSave = (buying || name.trim().length > 0) && costsValid;
  // The sheet stays mounted for its close animation, so a second tap in that window must not save again.
  const submitted = useRef(false);

  const save = (): UpdateAdventureItemInput => {
    if (buying) return { isBought: true, actualCost: parseFloat(actualCost) };
    const data: UpdateAdventureItemInput = { name: name.trim(), plannedCost: parseFloat(plannedCost) };
    if (showActual) data.actualCost = parseFloat(actualCost);
    return data;
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title={buying ? 'Mark Bought' : isEditing ? 'Edit Item' : 'Add Item'} icon={buying ? 'Check' : isEditing ? 'Pencil' : 'Plus'} onClose={close} />
          <View style={styles.form}>
            {buying ? (
              <Text style={styles.body}>{item?.name}</Text>
            ) : (
              <>
                <Input label="Name" placeholder="e.g. Hiking boots" value={name} onChangeText={setName} maxLength={100} />
                <View>
                  <Text style={styles.label}>Planned cost</Text>
                  <View style={styles.row}>
                    <AmountInput accessibilityLabel="Planned cost" value={plannedCost} onChangeText={setPlannedCost} />
                  </View>
                </View>
              </>
            )}
            {showActual ? (
              <View>
                <Text style={styles.label}>Actual cost</Text>
                <View style={styles.row}>
                  <AmountInput accessibilityLabel="Actual cost" value={actualCost} onChangeText={setActualCost} />
                </View>
              </View>
            ) : null}
            <Button
              label={buying ? 'Mark Bought' : isEditing ? 'Update Item' : 'Add Item'}
              size="lg"
              disabled={!canSave}
              onPress={() => {
                if (submitted.current) return;
                submitted.current = true;
                onSave(save());
                close();
              }}
            />
          </View>
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  form: { gap: ms(space[5]), paddingTop: ms(space[2]) },
  label: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(text.labelCaps.lineHeight),
    color: color.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: ms(space[1]),
  },
  row: { flexDirection: 'row' },
  body: { fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurface },
});
