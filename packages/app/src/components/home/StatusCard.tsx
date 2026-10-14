import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useDisplaySettings } from '../../hooks/useDisplaySettings';
import { formatCurrency } from '../../lib/formatters';
import { color, font, space, text } from '../../theme';
import { Card } from '../Card';
import { ProgressBar } from '../ProgressBar';

// Hidden by the "show income/expense" display settings until the eye toggle reveals it.
function MaskedValue({ show, positive, value }: { show: boolean; positive: boolean; value: string }) {
  const [revealed, setRevealed] = useState(false);
  const valueStyle = [styles.value, positive ? styles.income : styles.expense];
  if (show) return <Text style={valueStyle}>{value}</Text>;
  return (
    <View style={styles.masked}>
      <Text style={valueStyle}>{revealed ? value : '*****'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={revealed ? 'Hide value' : 'Reveal value'} hitSlop={14} onPress={() => setRevealed((r) => !r)}>
        <Text style={styles.eye}>{revealed ? '🙈' : '👁'}</Text>
      </Pressable>
    </View>
  );
}

export interface StatusCardProps {
  isLoading: boolean;
  totalIncome: number;
  totalExpenses: number;
  netYield: number;
  budgetProgress: number;
  totalBudget: number;
  usagePercent: number;
  onNetYieldPress: () => void;
}

// "Status" summary card from packages/ui/src/app/page.tsx: loot gained, gold spent, net yield and budget usage.
export function StatusCard({ isLoading, totalIncome, totalExpenses, netYield, budgetProgress, totalBudget, usagePercent, onNetYieldPress }: StatusCardProps) {
  const { showIncome, showExpense } = useDisplaySettings();
  const yieldStyle = netYield >= 0 ? styles.income : styles.expense;

  return (
    <Card style={styles.card}>
      <Text style={styles.heading} accessibilityRole="header">
        Status
      </Text>

      {isLoading ? (
        <View style={styles.rows}>
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLine} />
        </View>
      ) : (
        <View style={styles.rows}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Loot Gained</Text>
            <MaskedValue show={showIncome} positive value={`+${formatCurrency(totalIncome)}`} />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Gold Spent</Text>
            <MaskedValue show={showExpense} positive={false} value={`-${formatCurrency(totalExpenses)}`} />
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.yieldRow}>
          <Text style={styles.heading}>Net Yield</Text>
          {isLoading ? (
            <View style={styles.skeletonYield} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Adjust balance"
              hitSlop={8}
              onPress={onNetYieldPress}
              style={({ pressed }) => [styles.yieldButton, pressed && styles.yieldPressed]}
            >
              <Text style={[styles.yield, yieldStyle]}>
                {netYield >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(netYield))}
              </Text>
            </Pressable>
          )}
        </View>
        <ProgressBar value={isLoading ? 0 : budgetProgress} max={100} variant="primary" style={styles.progress} />

        {totalBudget > 0 && (
          <View style={styles.budget}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>Budget Usage ({formatCurrency(totalBudget)})</Text>
              <Text style={[styles.budgetLabel, styles.budgetValue]}>{usagePercent.toFixed(0)}%</Text>
            </View>
            <View style={styles.budgetTrack}>
              <View style={[styles.budgetFill, { width: `${usagePercent}%` }]} />
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: ms(space[4]), gap: ms(space[4]) },
  heading: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(16),
    color: color.outline,
    textTransform: 'uppercase',
  },
  rows: { gap: ms(space[2]), borderTopWidth: ms(4), borderColor: color.border, paddingTop: ms(space[2]) },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
  value: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16) },
  income: { color: color.primary },
  expense: { color: color.error },
  masked: { flexDirection: 'row', alignItems: 'center', gap: ms(6) },
  eye: { fontSize: ms(14) },
  skeletonLine: { height: ms(20), width: '75%', backgroundColor: color.surfaceHighest },
  skeletonYield: { height: ms(28), width: ms(96), backgroundColor: color.surfaceHighest },
  footer: { borderTopWidth: ms(4), borderColor: color.border, paddingTop: ms(space[4]) },
  yieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  yieldButton: { paddingHorizontal: ms(space[2]), paddingVertical: ms(space[1]), marginRight: -ms(space[2]), borderWidth: 1, borderColor: 'transparent' },
  yieldPressed: { backgroundColor: color.surfaceHighest, borderColor: color.primary },
  yield: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), textDecorationLine: 'underline' },
  progress: { marginTop: ms(space[4]) },
  budget: { marginTop: ms(space[4]), paddingTop: ms(space[4]), borderTopWidth: 1, borderColor: color.border },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: ms(space[1]) },
  budgetLabel: { fontFamily: font.mono, fontSize: ms(10), color: color.outline },
  budgetValue: { color: color.onSurface },
  budgetTrack: { width: '100%', height: ms(8), borderRadius: 999, overflow: 'hidden', backgroundColor: color.surfaceHighest },
  budgetFill: { height: '100%', backgroundColor: color.primary },
});
