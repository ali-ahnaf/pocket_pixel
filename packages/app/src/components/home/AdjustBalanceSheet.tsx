import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { formatCurrency } from '../../lib/formatters';
import { logger, transactionsService } from '../../services';
import { color, font, shadow, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { AmountInput } from './AmountInput';
import { SheetHeader } from '../SheetHeader';

export interface AdjustBalanceSheetProps {
  currentNetYield: number;
  /** 0-based month on screen. A month other than the current one dates the adjustment on its 1st. */
  selectedMonth: number;
  selectedYear: number;
  vaultId: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

// Port of packages/ui/src/components/AdjustBalanceModal.tsx: logs the difference to the target as one income or expense.
export function AdjustBalanceSheet({ currentNetYield, selectedMonth, selectedYear, vaultId, onSuccess, onClose }: AdjustBalanceSheetProps) {
  const userId = useLocalUserId();
  const [targetBalance, setTargetBalance] = useState(Number(currentNetYield.toFixed(2)).toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedTarget = parseFloat(targetBalance.trim());
  const isValidNumber = !isNaN(parsedTarget) && isFinite(Number(targetBalance.trim()));
  const diff = isValidNumber ? Math.round((parsedTarget - currentNetYield) * 100) / 100 : 0;

  const submit = async (close: () => void): Promise<void> => {
    if (!isValidNumber || isSubmitting) return;
    if (diff === 0) return close();
    setIsSubmitting(true);
    setError(null);
    const now = new Date();
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    try {
      await transactionsService.create(userId, {
        amount: Math.abs(diff),
        type: diff > 0 ? 'income' : 'expense',
        title: 'Balance adjustment',
        vaultId,
        date: isCurrentMonth ? undefined : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`,
      });
      onSuccess();
      close();
    } catch (err) {
      logger.error('Balance adjustment failed', { err });
      setError('Failed to create balance adjustment transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader title="ADJUST BALANCE" icon="Scale" onClose={close} />
          <View style={styles.box}>
            <Text style={styles.caps}>Current Net Yield</Text>
            <Text style={[styles.yield, currentNetYield >= 0 ? styles.income : styles.expense]}>
              {currentNetYield >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(currentNetYield))}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.caps, styles.label]}>Target Net Yield ($)</Text>
            <View style={styles.row}>
              <AmountInput accessibilityLabel="Target Net Yield" value={targetBalance} onChangeText={setTargetBalance} />
            </View>
          </View>

          {/* Kept mounted with a placeholder so the sheet height does not change while it opens. */}
          <View style={styles.diffBox}>
            <Text style={styles.caps}>Adjustment needed</Text>
            <Text style={[styles.diff, diff > 0 ? styles.income : diff < 0 ? styles.expense : styles.muted]}>
              {!isValidNumber ? '' : diff > 0 ? `+${formatCurrency(diff)} (Income)` : diff < 0 ? `-${formatCurrency(Math.abs(diff))} (Expense)` : 'No change'}
            </Text>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Button label={isSubmitting ? 'SAVING...' : 'SAVE ADJUSTMENT'} size="lg" disabled={!isValidNumber || isSubmitting} onPress={() => submit(close)} />
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ms(space[4]),
    backgroundColor: color.surfaceLowest,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.input,
  },
  caps: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.outline, textTransform: 'uppercase' },
  label: { color: color.onSurface },
  yield: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight) },
  income: { color: color.primary },
  expense: { color: color.error },
  muted: { color: color.outline },
  field: { gap: ms(space[2]) },
  row: { flexDirection: 'row' },
  diffBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: ms(space[3]), backgroundColor: color.surfaceLowest, borderWidth: ms(2), borderColor: color.border },
  diff: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize) },
  error: { fontFamily: font.bodyBold, fontSize: ms(12), color: color.error },
});
