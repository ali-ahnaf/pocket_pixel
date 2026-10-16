import { useState } from 'react';
import { ScrollView, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { toPixelIcon } from '../../lib/iconMapper';
import { PixelIcon } from '../PixelIcon';
import { showToast } from '../Toast';
import { color, font, space, text } from '../../theme';
import type { MonthRow, TableCell, TagColumn, YearlyTableModel } from './build-yearly-table';

export interface YearlyTagTableProps {
  model: YearlyTableModel;
  isLoading?: boolean;
  /** 1-12, highlighted as the current cycle. Omit when the table is not showing the current year. */
  currentMonth?: number;
}

const formatAmount = (amount: number): string => Math.round(Math.abs(amount)).toLocaleString('en-US');

const formatSigned = (amount: number): string => `${amount < 0 ? '−' : '+'}${formatAmount(amount)}`;

/** Projected numbers get a `~` prefix and muted italics so they never read as recorded spend. */
const cellText = (cell: TableCell, signed = false): string => {
  if (cell.amount === 0) return '—';
  const value = signed ? formatSigned(cell.amount) : formatAmount(cell.amount);
  return cell.source === 'actual' ? value : `~${value}`;
};

/** One-line text. When the ellipsis cuts it off, tapping it shows the full value in a toast at the bottom. */
function TruncatedText({ children, style }: { children: string; style: StyleProp<TextStyle> }) {
  const [boxWidth, setBoxWidth] = useState(0);
  const [fullWidth, setFullWidth] = useState(0);
  const isTruncated = fullWidth > boxWidth + 1;
  return (
    <>
      <Text
        numberOfLines={1}
        style={style}
        onLayout={(e) => setBoxWidth(e.nativeEvent.layout.width)}
        onPress={isTruncated ? () => showToast(children, 'bottom') : undefined}
        accessibilityRole={isTruncated ? 'button' : undefined}
        accessibilityHint={isTruncated ? 'Shows the full value' : undefined}
        suppressHighlighting
      >
        {children}
      </Text>
      {/* Unconstrained hidden copy, measured to tell whether the visible one is cut off. pointerEvents keeps it from eating taps. */}
      <View pointerEvents="none" style={styles.measure} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={style} onTextLayout={(e) => setFullWidth(e.nativeEvent.lines[0]?.width ?? 0)}>
          {children}
        </Text>
      </View>
    </>
  );
}

const LOADING_ROWS = Array.from({ length: 8 }, (_, i) => i);

interface RowProps {
  row: MonthRow;
  tagColumns: TagColumn[];
  isTotals?: boolean;
  isCurrent?: boolean;
}

// The month label lives in a fixed column outside the horizontal scroll, like the web's sticky first column.
function RowLabel({ row, isTotals = false, isCurrent = false }: Omit<RowProps, 'tagColumns'>) {
  return (
    <View style={[styles.labelCell, isCurrent && styles.currentRow, isTotals && styles.totalsRow]}>
      <Text style={[styles.labelText, isTotals && styles.emphasis]}>
        {isTotals ? 'Year ∑' : row.label}
        {row.source === 'projected' ? ' ~' : row.source === 'mixed' ? ' ◐' : ''}
      </Text>
    </View>
  );
}

function RowCells({ row, tagColumns, isTotals = false, isCurrent = false }: RowProps) {
  const emphasis = isTotals && styles.emphasis;
  return (
    <View style={[styles.row, isCurrent && styles.currentRow, isTotals && styles.totalsRow]}>
      {tagColumns.map((column) => {
        const cell = row.byTagId[column.id];
        return (
          <View key={column.id} style={styles.cell}>
            <TruncatedText style={[styles.cellText, emphasis, cell.source !== 'actual' && styles.projected]}>{cellText(cell)}</TruncatedText>
          </View>
        );
      })}
      <View style={[styles.cell, styles.dividerLeft]}>
        <TruncatedText style={[styles.cellText, styles.bold, styles.spent, emphasis, row.spent.source !== 'actual' && styles.projected]}>{cellText(row.spent)}</TruncatedText>
      </View>
      <View style={styles.cell}>
        <TruncatedText style={[styles.cellText, styles.bold, styles.income, emphasis, row.income.source !== 'actual' && styles.projected]}>{cellText(row.income)}</TruncatedText>
      </View>
      <View style={[styles.cell, styles.dividerLeft]}>
        <TruncatedText style={[styles.cellText, styles.bold, row.net.amount >= 0 ? styles.netPositive : styles.spent, emphasis, row.net.source !== 'actual' && styles.projected]}>
          {row.net.amount === 0 ? '—' : cellText(row.net, true)}
        </TruncatedText>
      </View>
    </View>
  );
}

export function YearlyTagTable({ model, isLoading = false, currentMonth }: YearlyTagTableProps) {
  if (isLoading) {
    return (
      <View style={styles.loading} accessibilityLabel="Loading table">
        {LOADING_ROWS.map((i) => (
          <View key={i} style={styles.loadingBar} />
        ))}
      </View>
    );
  }

  if (!model.hasData) {
    return <Text style={styles.empty}>No transactions or projections for {model.year}.</Text>;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.frame} accessibilityLabel={`Monthly spend per tag for ${model.year}, with totals and recurring-quest projections`}>
        <View style={styles.stickyColumn}>
          <View style={[styles.headerCell, styles.labelHeader]}>
            <Text style={styles.headerText}>Month</Text>
          </View>
          {model.rows.map((row) => (
            <RowLabel key={row.month} row={row} isCurrent={row.month === currentMonth} />
          ))}
          <RowLabel row={model.totals} isTotals />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={styles.row}>
              {model.tagColumns.map((column) => (
                <View key={column.id} style={styles.headerCell}>
                  {column.icon ? (
                    <View style={styles.headerRow}>
                      <PixelIcon name={toPixelIcon(column.icon)} size={ms(14)} />
                      <TruncatedText style={[styles.headerText, styles.shrink]}>{column.name}</TruncatedText>
                    </View>
                  ) : (
                    <TruncatedText style={styles.headerText}>{column.name}</TruncatedText>
                  )}
                </View>
              ))}
              <View style={[styles.headerCell, styles.dividerLeft]}>
                <Text style={[styles.headerText, styles.spent]}>Spent</Text>
              </View>
              <View style={styles.headerCell}>
                <Text style={[styles.headerText, styles.income]}>Income</Text>
              </View>
              <View style={[styles.headerCell, styles.dividerLeft]}>
                <Text style={styles.headerText}>Net</Text>
              </View>
            </View>
            {model.rows.map((row) => (
              <RowCells key={row.month} row={row} tagColumns={model.tagColumns} isCurrent={row.month === currentMonth} />
            ))}
            <RowCells row={model.totals} tagColumns={model.tagColumns} isTotals />
          </View>
        </ScrollView>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>
          <Text style={styles.bold}>◐</Text> actuals so far + remaining projected recurring quests
        </Text>
        <Text style={styles.legendText}>
          <Text style={[styles.bold, styles.projected]}>~</Text> projected from recurring quests only
        </Text>
        <Text style={styles.legendText}>Tag columns sum expenses; a multi-tag expense is split evenly across its tags.</Text>
      </View>
    </View>
  );
}

const ROW_H = ms(36);
const CELL_W = ms(88);

const styles = StyleSheet.create({
  wrapper: { gap: ms(space[3]) },
  frame: { flexDirection: 'row', borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surfaceLow },
  stickyColumn: { borderRightWidth: ms(4), borderColor: color.border, backgroundColor: color.surfaceLow },
  row: { flexDirection: 'row', backgroundColor: color.surfaceLow },
  // ponytail: outlineVariant stands in for the web's primary-container/40 tint; add a token if it must match exactly.
  currentRow: { backgroundColor: color.outlineVariant },
  totalsRow: { backgroundColor: color.surfaceHighest },
  headerCell: {
    width: CELL_W,
    height: ROW_H,
    justifyContent: 'center',
    paddingHorizontal: ms(space[3]),
    backgroundColor: color.surfaceHigh,
    borderBottomWidth: ms(4),
    borderColor: color.border,
  },
  labelHeader: { width: 'auto' },
  // Mirrors IconText's row, inlined so the name can be a TruncatedText.
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[1]) },
  shrink: { flexShrink: 1 },
  measure: { position: 'absolute', top: 0, left: 0, width: 10000, opacity: 0 },
  headerText: { fontFamily: font.mono, fontSize: ms(11), color: color.onSurface, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'right' },
  labelCell: { height: ROW_H, justifyContent: 'center', paddingHorizontal: ms(space[3]), borderBottomWidth: 2, borderColor: color.border },
  labelText: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.onSurface, textTransform: 'uppercase', letterSpacing: 0.6 },
  cell: { width: CELL_W, height: ROW_H, justifyContent: 'center', paddingHorizontal: ms(space[3]), borderBottomWidth: 1, borderColor: color.outlineVariant },
  cellText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), color: color.onSurface, textAlign: 'right', fontVariant: ['tabular-nums'] },
  dividerLeft: { borderLeftWidth: ms(4), borderLeftColor: color.border },
  bold: { fontFamily: font.bodyBold },
  emphasis: { fontFamily: font.bodyBold },
  projected: { fontStyle: 'italic', opacity: 0.7 },
  spent: { color: color.error },
  income: { color: color.primary },
  netPositive: { color: color.secondary },
  loading: { gap: ms(space[2]) },
  loadingBar: { height: ms(32), backgroundColor: color.surfaceHighest, borderWidth: ms(4), borderColor: color.border },
  empty: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), color: color.onSurfaceVariant, textAlign: 'center', paddingVertical: ms(space[8]) },
  legend: { gap: ms(space[1]) },
  legendText: { fontFamily: font.body, fontSize: ms(11), lineHeight: ms(16), color: color.onSurfaceVariant },
});
