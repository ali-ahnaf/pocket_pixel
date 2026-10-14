import type { TagDto, TransactionDto, VaultDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { logger, transactionsService } from '../../services';
import { color, font, space } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Input } from '../Input';
import { PixelDatePicker } from '../PixelDatePicker';
import { TransactionTypeToggle } from '../TransactionTypeToggle';
import { AmountInput } from './AmountInput';
import { SheetHeader } from '../SheetHeader';
import { SheetFooterDecor } from './SheetChrome';
import { TagPicker } from './TagPicker';
import { VaultSelect } from './VaultSelect';

export interface EditTransactionSheetProps {
  transaction: TransactionDto;
  vaults: VaultDto[];
  tags: TagDto[];
  onSuccess: () => void;
  onClose: () => void;
}

// Port of packages/ui/src/components/EditTransactionModal.tsx.
export function EditTransactionSheet({ transaction, vaults, tags, onSuccess, onClose }: EditTransactionSheetProps) {
  const userId = useLocalUserId();
  const { height } = useWindowDimensions();
  const [isExpense, setIsExpense] = useState(transaction.type === 'expense');
  const [amount, setAmount] = useState(String(transaction.amount));
  const [title, setTitle] = useState(transaction.title ?? '');
  const [date, setDate] = useState(transaction.date ? transaction.date.split('T')[0] : '');
  const [selectedTags, setSelectedTags] = useState<TagDto[]>(transaction.tags);
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(transaction.vaultId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const save = async (close: () => void): Promise<void> => {
    if (!amount || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await transactionsService.update(userId, transaction.id, {
        amount: parseFloat(amount),
        type: isExpense ? 'expense' : 'income',
        tagIds: selectedTags.map((t) => t.id),
        title: title || null,
        vaultId: selectedVaultId,
        date: date || undefined,
      });
      onSuccess();
      close();
    } catch (err) {
      logger.error('Update transaction failed', { err });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (close: () => void): Promise<void> => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await transactionsService.remove(userId, transaction.id);
      onSuccess();
      close();
    } catch (err) {
      logger.error('Delete transaction failed', { err });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title="Edit Transaction" icon="Pencil" onClose={close} />
          <ScrollView style={{ maxHeight: height * 0.75 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Input accessibilityLabel="Title" placeholder="e.g. Grocery run" value={title} onChangeText={setTitle} style={styles.titleInput} />

            <View style={styles.group}>
              <View style={styles.row}>
                <AmountInput value={amount} onChangeText={setAmount} />
                <PixelDatePicker value={date} onChange={setDate} />
              </View>
              {date ? <Text style={styles.dateText}>{new Date(`${date}T00:00:00`).toLocaleDateString('en-GB')}</Text> : null}
            </View>

            <TransactionTypeToggle isExpense={isExpense} onChange={setIsExpense} />
            {vaults.length > 0 && <VaultSelect vaults={vaults} value={selectedVaultId} onChange={setSelectedVaultId} allowNone />}
            <TagPicker tags={tags} selected={selectedTags} onChange={setSelectedTags} />

            <View style={styles.actions}>
              <Button label={isSubmitting ? 'SAVING...' : 'SAVE CHANGES'} icon="Pencil" size="lg" disabled={!amount || isSubmitting} onPress={() => save(close)} />
              {!showDeleteConfirm ? (
                <Button label="DELETE TRANSACTION" icon="Trash" variant="ghost" onPress={() => setShowDeleteConfirm(true)} />
              ) : (
                <View style={styles.confirmRow}>
                  <Button label="CANCEL" variant="ghost" onPress={() => setShowDeleteConfirm(false)} style={styles.flex} />
                  <Button label={isDeleting ? 'DELETING...' : 'CONFIRM DELETE'} variant="danger" disabled={isDeleting} onPress={() => remove(close)} style={styles.flex} />
                </View>
              )}
            </View>

            <SheetFooterDecor />
          </ScrollView>
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: { gap: ms(space[5]), paddingBottom: ms(space[3]) },
  group: { gap: ms(space[2]) },
  row: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  titleInput: { height: ms(64) },
  dateText: { fontFamily: font.mono, fontSize: ms(12), color: color.outline, paddingLeft: ms(space[1]) },
  actions: { paddingTop: ms(space[5]), gap: ms(space[3]) },
  confirmRow: { flexDirection: 'row', gap: ms(space[2]) },
  flex: { flex: 1 },
});
