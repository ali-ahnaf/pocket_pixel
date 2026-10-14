import type { CreateDebtInput, DebtDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Input } from '../Input';
import { PixelDatePicker } from '../PixelDatePicker';
import { TransactionTypeToggle } from '../TransactionTypeToggle';
import { formatDueDate } from './DebtRow';
import { SheetHeader } from '../SheetHeader';
import { PixelIcon } from '../PixelIcon';

export interface AddDebtSheetProps {
  /** Edit this debt; omit to create a new one. */
  debt?: DebtDto | null;
  onSave: (data: CreateDebtInput) => void;
  onClose: () => void;
}

// Ported from packages/ui/src/components/AddDebtModal.tsx.
export function AddDebtSheet({ debt = null, onSave, onClose }: AddDebtSheetProps) {
  const { height } = useWindowDimensions();
  const isEditing = debt !== null;
  const [name, setName] = useState(debt?.title ?? '');
  const [amount, setAmount] = useState(debt ? String(debt.amount) : '');
  const [isExpense, setIsExpense] = useState(debt ? debt.type === 'expense' : true);
  const [notes, setNotes] = useState(debt?.notes ?? '');
  const [dueDate, setDueDate] = useState(debt?.dueDate ?? '');

  const canSave = name.trim().length > 0 && parseFloat(amount) > 0;

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title={isEditing ? 'Edit Due' : 'New Due'} icon={isEditing ? 'Pencil' : 'Plus'} onClose={close} />
          <ScrollView style={{ maxHeight: height * 0.75 }} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Input label="Name" placeholder="e.g. Rent, Loan Repayment" value={name} onChangeText={setName} />

            <View>
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountBox}>
                <PixelIcon name="Coins" size={ms(24)} />
                <TextInput
                  accessibilityLabel="Amount"
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={color.outline}
                  selectionColor={color.primary}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Type</Text>
              <TransactionTypeToggle isExpense={isExpense} onChange={setIsExpense} />
            </View>

            <View>
              <Text style={styles.label}>Due date</Text>
              <View style={styles.dateRow}>
                <Text style={[styles.dateField, !dueDate && styles.placeholder]}>{dueDate ? formatDueDate(dueDate) : 'DD/MM/YYYY'}</Text>
                <PixelDatePicker value={dueDate} onChange={setDueDate} />
              </View>
            </View>

            <Input
              label="Notes"
              placeholder="e.g - Borrowed for concert tickets, pay back by August"
              value={notes}
              onChangeText={setNotes}
              maxLength={2000}
              multiline
              textAlignVertical="top"
              style={styles.notes}
            />

            <Button
              label={isEditing ? 'Update Due' : 'Save Due'}
              size="lg"
              disabled={!canSave}
              onPress={() => {
                const trimmedNotes = notes.trim();
                onSave({
                  title: name.trim(),
                  amount: parseFloat(amount),
                  type: isExpense ? 'expense' : 'income',
                  notes: trimmedNotes.length > 0 ? trimmedNotes : null,
                  dueDate: dueDate.length > 0 ? dueDate : null,
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
  amountBox: {
    height: ms(56),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(space[3]),
    paddingHorizontal: ms(space[4]),
    backgroundColor: color.surfaceLowest,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.input,
  },
  amountInput: { flex: 1, height: '100%', fontFamily: font.heading, fontSize: ms(20), color: color.secondary },
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
  notes: { minHeight: ms(96) },
});
