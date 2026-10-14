import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { type ChartSeries, seriesColorAt } from './chartPalette';

export interface VaultExpenseChartProps {
  readonly labels: readonly string[];
  readonly series: readonly ChartSeries[];
  readonly formatValue: (value: number) => string;
  /** Prefix for the detail heading, e.g. `Day` renders "Day 14". Pass an empty string for self-describing labels. */
  readonly xAxisLabel: string;
}

const compactValue = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return String(Math.round(value));
};

// Native take on the web recharts line chart: no SVG library is installed, so each bucket is a stacked bar of the vault
// series, and tapping a bar shows the breakdown the web tooltip shows on hover.
export function VaultExpenseChart({ labels, series, formatValue, xAxisLabel }: VaultExpenseChartProps) {
  const [picked, setPicked] = useState<number | null>(null);
  // The bucket count changes with the month, so drop a selection that no longer exists.
  const selected = picked !== null && picked < labels.length ? picked : null;
  const stackTotals = labels.map((_, i) => series.reduce((sum, s) => sum + s.values[i], 0));
  const max = Math.max(...stackTotals, 1);

  const rows =
    selected === null
      ? []
      : series
          .map((s, index) => ({ name: s.name, color: seriesColorAt(index), value: s.values[selected] }))
          .filter((row) => row.value > 0)
          .sort((a, b) => b.value - a.value);

  return (
    <View style={styles.root}>
      {series.length > 1 && (
        <View style={styles.legend} accessibilityLabel="Chart legend">
          {series.map((s, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: seriesColorAt(index) }]} />
              <Text style={styles.legendText}>{s.name}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.plot}>
        <View style={styles.yAxis}>
          <Text style={styles.axisText}>{compactValue(max)}</Text>
          <Text style={styles.axisText}>0</Text>
        </View>
        <View style={styles.bars}>
          {labels.map((label, i) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={`${xAxisLabel} ${label}: ${formatValue(stackTotals[i])}`.trim()}
              accessibilityState={{ selected: selected === i }}
              onPress={() => setPicked(selected === i ? null : i)}
              style={[styles.column, selected === i && styles.columnSelected]}
            >
              {series.map((s, index) => (s.values[i] > 0 ? <View key={index} style={[styles.segment, { height: `${(s.values[i] / max) * 100}%`, backgroundColor: seriesColorAt(index) }]} /> : null))}
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.xAxis}>
        <Text style={styles.axisText}>{labels[0]}</Text>
        <Text style={styles.axisText}>{labels[labels.length - 1]}</Text>
      </View>

      {selected !== null && (
        <View style={styles.detail}>
          <Text style={styles.detailHeading}>{`${xAxisLabel} ${labels[selected]}`.trim()}</Text>
          {rows.length === 0 && <Text style={styles.detailValue}>No expenses</Text>}
          {rows.map((row) => (
            <View key={row.color} style={styles.detailRow}>
              <View style={styles.legendItem}>
                <View style={[styles.swatch, { backgroundColor: row.color }]} />
                <Text style={styles.detailName}>{row.name}</Text>
              </View>
              <Text style={styles.detailValue}>{formatValue(row.value)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: ms(space[3]) },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: ms(space[4]), rowGap: ms(space[1]) },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]), flexShrink: 1 },
  swatch: { width: ms(12), height: ms(12), borderWidth: 2, borderColor: color.border },
  legendText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant },
  plot: { flexDirection: 'row', height: ms(200), gap: ms(space[1]) },
  yAxis: { width: ms(36), justifyContent: 'space-between', alignItems: 'flex-end' },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: ms(1), borderLeftWidth: 2, borderBottomWidth: 2, borderColor: color.border },
  column: { flex: 1, height: '100%', justifyContent: 'flex-start', flexDirection: 'column-reverse' },
  columnSelected: { backgroundColor: color.surfaceHighest },
  segment: { width: '100%' },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: ms(40) },
  axisText: { fontFamily: font.body, fontSize: ms(10), color: color.outline },
  detail: { backgroundColor: color.surfaceHigh, borderWidth: ms(4), borderColor: color.border, padding: ms(space[2]), gap: ms(space[1]) },
  detailHeading: { fontFamily: font.mono, fontSize: ms(10), color: color.outline, textTransform: 'uppercase' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: ms(space[3]) },
  detailName: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
  detailValue: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant },
});
