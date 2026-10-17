import type { AdventureDto, CreateAdventureInput } from '@expense-tracker/shared';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../../theme';
import { AmountInput } from '../home/AmountInput';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { formatDueDate } from '../debts/DebtRow';
import { Input } from '../Input';
import { PixelDatePicker } from '../PixelDatePicker';
import { IconButton } from '../profile/IconButton';
import { SheetHeader } from '../SheetHeader';

export interface AdventureFormSheetProps {
  /** Edit this adventure; omit to create a new one. */
  adventure?: AdventureDto | null;
  onSave: (data: CreateAdventureInput) => void;
  onClose: () => void;
}

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

// PixelDatePicker is only a trigger and cannot unset a date, so the clear button lives here.
function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateRow}>
        <Text style={[styles.dateField, !value && styles.placeholder]}>{value ? formatDueDate(value) : 'DD/MM/YYYY'}</Text>
        {value ? <IconButton icon="X" label={`Clear ${label.toLowerCase()}`} onPress={() => onChange('')} /> : null}
        <PixelDatePicker value={value} onChange={onChange} />
      </View>
    </View>
  );
}

export function AdventureFormSheet({ adventure = null, onSave, onClose }: AdventureFormSheetProps) {
  const { height } = useWindowDimensions();
  const isEditing = adventure !== null;
  const [name, setName] = useState(adventure?.name ?? '');
  const [flavorText, setFlavorText] = useState(adventure?.flavorText ?? '');
  const [fund, setFund] = useState(adventure?.fund != null ? String(adventure.fund) : '');
  const [startDate, setStartDate] = useState(adventure?.startDate ?? '');
  const [endDate, setEndDate] = useState(adventure?.endDate ?? '');

  const canSave = name.trim().length > 0 && (fund === '' || parseFloat(fund) >= 0);
  // The sheet stays mounted for its close animation, so a second tap in that window must not save again.
  const submitted = useRef(false);

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title={isEditing ? 'Edit Adventure' : 'Chart a new quest'} icon={isEditing ? 'Pencil' : 'Plus'} onClose={close} />
          <ScrollView style={{ maxHeight: height * 0.75 }} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Input label="Name" placeholder="e.g. Misty Peaks" value={name} onChangeText={setName} maxLength={100} />

            <Input
              label="Flavor text"
              placeholder="A journey into the misty peaks. Pack wisely, adventurer."
              value={flavorText}
              onChangeText={setFlavorText}
              maxLength={255}
              multiline
              textAlignVertical="top"
              style={styles.flavor}
            />

            <View>
              <Text style={styles.label}>Quest Chest</Text>
              <View style={styles.row}>
                <AmountInput accessibilityLabel="Quest Chest" value={fund} onChangeText={setFund} />
              </View>
            </View>

            <DateField label="Start date" value={startDate} onChange={setStartDate} />
            <DateField label="End date" value={endDate} onChange={setEndDate} />

            <Button
              label={isEditing ? 'Update Adventure' : 'Save Adventure'}
              size="lg"
              disabled={!canSave}
              onPress={() => {
                if (submitted.current) return;
                submitted.current = true;
                const trimmedFlavor = flavorText.trim();
                onSave({
                  name: name.trim(),
                  flavorText: trimmedFlavor.length > 0 ? trimmedFlavor : null,
                  fund: fund === '' ? null : parseFloat(fund),
                  startDate: startDate || null,
                  endDate: endDate || null,
                });
                close();
              }}
            />
          </ScrollView>
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
  flavor: { minHeight: ms(96) },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]) },
  dateField: {
    flex: 1,
    height: ms(64),
    paddingHorizontal: ms(space[4]),
    backgroundColor: color.surfaceLowest,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.input,
    fontFamily: font.body,
    fontSize: ms(text.bodyLg.fontSize),
    lineHeight: ms(56),
    textAlignVertical: 'center',
    color: color.onSurface,
  },
  placeholder: { color: color.outline },
});
