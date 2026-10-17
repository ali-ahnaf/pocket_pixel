import type { TransactionDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import Svg, { Polyline } from 'react-native-svg';
import { AppBar } from '../../components/AppBar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { IconText } from '../../components/IconText';
import { PixelIcon } from '../../components/PixelIcon';
import { ProgressBar } from '../../components/ProgressBar';
import { PeriodPicker } from '../../components/stats/PeriodPicker';
import { ALL_TIME_PERIOD, currentMonthYear, useStats } from '../../components/stats/useStats';
import { VaultExpenseChart } from '../../components/stats/VaultExpenseChart';
import { WizardChatSheet } from '../../components/stats/WizardChatSheet';
import { WizardFab } from '../../components/stats/WizardFab';
import { toPixelIcon } from '../../lib/iconMapper';
import { color, font, shadow, gutter, space, text } from '../../theme';

const TAG_COLORS = [color.error, color.tertiary, color.secondary, color.outline, color.primary];
const ALL_TIME_NOTE = 'Not available for all time yet. Pick a month.';

// The web stats page shows whole coins, unlike the 2-decimal formatter in lib/formatters.
const formatCoins = (amount: number): string => `⛁ ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// The web downloads a .csv file. With no file-system module installed, the native share sheet carries the CSV text instead.
function exportCsv(transactions: TransactionDto[]): void {
  const headers = ['ID', 'Date', 'Title', 'Type', 'Amount', 'Vault', 'Category', 'Tags', 'Created At', 'Updated At'];
  const rows = transactions.map((tx) =>
    [
      tx.id,
      tx.date,
      tx.title || (tx.type === 'income' ? 'Unnamed Income' : 'Unnamed Expense'),
      tx.type,
      tx.amount,
      tx.vault?.name || '',
      tx.tags?.[0]?.name || (tx.type === 'income' ? 'Income' : 'Expense'),
      tx.tags?.map((t) => t.name).join('; ') || '',
      tx.createdAt,
      tx.updatedAt,
    ]
      .map(escapeCsvCell)
      .join(','),
  );
  Share.share({ title: `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`, message: [headers.join(','), ...rows].join('\n') });
}

function Skeleton({ height = 32 }: { height?: number }) {
  return <View style={[styles.skeleton, { height: ms(height) }]} />;
}

function Empty({ label }: { label: string }) {
  return <Text style={styles.empty}>{label}</Text>;
}

/** Cumulative net as a hard-edged line with a drop shadow, matching the web SVG polyline. */
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.length === 1 ? '0,50 100,50' : values.map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(1)},${(100 - ((v - min) / range) * 100).toFixed(1)}`).join(' ');
  return (
    <View style={styles.sparkline}>
      <Svg width="100%" height="100%" viewBox="0 -5 100 110" preserveAspectRatio="none">
        <Polyline points={points} fill="none" stroke={color.border} strokeWidth={6} strokeLinejoin="miter" strokeLinecap="square" vectorEffect="non-scaling-stroke" transform="translate(0, 4)" />
        <Polyline points={points} fill="none" stroke={color.secondary} strokeWidth={4} strokeLinejoin="miter" strokeLinecap="square" vectorEffect="non-scaling-stroke" />
      </Svg>
    </View>
  );
}

interface ChipOption {
  id: string;
  name: string;
}

function VaultChips({ options, isActive, onPress }: { options: ChipOption[]; isActive: (id: string) => boolean; onPress: (id: string) => void }) {
  return (
    <View style={styles.tabs}>
      {options.map((v) => {
        const active = isActive(v.id);
        return (
          <Pressable key={v.id} accessibilityRole="button" accessibilityState={{ selected: active }} hitSlop={6} onPress={() => onPress(v.id)} style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{v.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function StatsScreen() {
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentMonthYear);
  // Empty means every vault.
  const [selectedVaultIds, setSelectedVaultIds] = useState<string[]>([]);
  const [selectedLineVaultId, setSelectedLineVaultId] = useState('all');
  const [wizardOpen, setWizardOpen] = useState(false);

  const isAllTime = selectedMonthYear === ALL_TIME_PERIOD;
  const isCurrentMonth = selectedMonthYear === currentMonthYear();
  const stats = useStats(selectedMonthYear, selectedVaultIds, selectedLineVaultId);
  const { loading, vaults } = stats;
  const netYield = stats.totalIncome - stats.totalExpenses;

  const toggleVault = (id: string): void => setSelectedVaultIds((ids) => (id === 'all' ? [] : ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id]));
  const canExport = !loading && stats.transactions.length > 0;

  return (
    <View style={styles.screen}>
      <AppBar />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Analytics
          </Text>
          <Text style={styles.subtitle}>Track your loot and resource consumption.</Text>
        </View>

        <View style={styles.filters}>
          <View style={styles.filter}>
            <Text style={styles.filterLabel}>Source Vaults</Text>
            <VaultChips
              options={[{ id: 'all', name: 'All Vaults' }, ...vaults]}
              isActive={(id) => (id === 'all' ? selectedVaultIds.length === 0 : selectedVaultIds.includes(id))}
              onPress={toggleVault}
            />
          </View>

          <View style={styles.filter}>
            <Text style={styles.filterLabel}>Period</Text>
            <View style={styles.periodRow}>
              <View style={styles.flex}>
                <PeriodPicker value={selectedMonthYear} onChange={setSelectedMonthYear} />
              </View>
              {!isCurrentMonth && <Button label="Current" variant="ghost" size="sm" onPress={() => setSelectedMonthYear(currentMonthYear())} />}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Export CSV"
                accessibilityState={{ disabled: !canExport }}
                disabled={!canExport}
                onPress={() => exportCsv(stats.transactions)}
                style={({ pressed }) => [styles.exportButton, pressed && styles.pressed, !canExport && styles.disabled]}
              >
                <Text style={styles.exportGlyph}>⤓</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Card style={[styles.card, styles.flex]}>
            <View style={styles.bgGlyph} pointerEvents="none">
              <PixelIcon name="MoneyBag" size={ms(96)} />
            </View>
            <Text style={styles.metricLabel}>Total Hoard</Text>
            {loading ? <Skeleton /> : <Text style={[styles.metricValue, styles.primary]}>{formatCoins(stats.totalIncome)}</Text>}
            <IconText icon="ArrowUpRight" iconSize={14} style={[styles.metricHint, styles.primary]}>
              Income this period
            </IconText>
          </Card>
          <Card style={[styles.card, styles.flex]}>
            <View style={styles.bgGlyph} pointerEvents="none">
              <PixelIcon name="Flame" size={ms(96)} />
            </View>
            <Text style={styles.metricLabel}>Resources Burned</Text>
            {loading ? <Skeleton /> : <Text style={[styles.metricValue, styles.error]}>{formatCoins(stats.totalExpenses)}</Text>}
            <IconText icon="ArrowDownRight" iconSize={14} style={[styles.metricHint, styles.error]}>
              Expenses this period
            </IconText>
          </Card>
        </View>

        <Card style={styles.card}>
          <View style={styles.bgGlyph} pointerEvents="none">
            <PixelIcon name="Gem" size={ms(96)} />
          </View>
          <Text style={styles.metricLabel}>Net Yield</Text>
          {loading ? (
            <Skeleton />
          ) : (
            <>
              <Text style={[styles.netValue, netYield >= 0 ? styles.secondary : styles.error]}>
                {netYield >= 0 ? '+' : '-'}
                {formatCoins(netYield)}
              </Text>
              {stats.netLine.length > 0 && <Sparkline values={stats.netLine} />}
            </>
          )}
        </Card>

        <Card style={styles.card}>
          <View>
            <Text style={styles.sectionTitle}>Resource Allocation</Text>
            <Text style={styles.subtitle}>Where your gold is going {isAllTime ? 'across all time' : 'this cycle'}.</Text>
          </View>
          {loading ? (
            <Skeleton height={56} />
          ) : stats.allocation.length === 0 ? (
            <Empty label="No expense data for this period." />
          ) : (
            stats.allocation.map(({ label, amount, percent }, i) => (
              <View key={label} style={styles.allocation}>
                <View style={styles.spaceBetween}>
                  <View style={styles.inline}>
                    <View style={[styles.swatch, { backgroundColor: TAG_COLORS[i % TAG_COLORS.length] }]} />
                    <Text style={styles.body}>{label}</Text>
                  </View>
                  <Text style={styles.muted}>
                    {formatCoins(amount)} · {percent}%
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.min(percent, 100)}%`, backgroundColor: TAG_COLORS[i % TAG_COLORS.length] }]} />
                </View>
              </View>
            ))
          )}
        </Card>

        <Card style={styles.card}>
          <View>
            <Text style={styles.sectionTitle}>Vault Savings</Text>
            <Text style={styles.subtitle}>{isAllTime ? 'All-time' : 'Current'} savings (income − expense) per vault.</Text>
          </View>
          {loading ? (
            <Skeleton height={56} />
          ) : stats.vaultSavings.length === 0 ? (
            <Empty label="No vaults found." />
          ) : (
            stats.vaultSavings.map(({ vault, income, spent, savings, budget, progress, isOver }) => (
              <View key={vault.id} style={styles.inset}>
                <View style={styles.spaceBetween}>
                  <View style={styles.flex}>
                    <Text style={styles.vaultName}>{vault.name}</Text>
                    <Text style={styles.small}>
                      {formatCoins(income)} in · {formatCoins(spent)} out
                    </Text>
                  </View>
                  <Text style={[styles.savings, savings >= 0 ? styles.secondary : styles.error]}>
                    {savings >= 0 ? '+' : '-'}
                    {formatCoins(savings)}
                  </Text>
                </View>
                {!isAllTime && vault.monthlyBudget != null && (
                  <View style={styles.budget}>
                    <ProgressBar value={progress} variant={isOver ? 'error' : 'primary'} label={`${formatCoins(spent)} / ${formatCoins(budget)}`} />
                    {isOver && <Text style={styles.overBudget}>Over budget by {formatCoins(spent - budget)}</Text>}
                  </View>
                )}
              </View>
            ))
          )}
        </Card>

        <Card style={styles.card}>
          <View>
            <IconText icon="TrendingUp" iconSize={20} style={styles.sectionTitle}>
              {isAllTime ? 'Monthly Expenses' : 'Daily Expenses'}
            </IconText>
            <Text style={styles.subtitle}>Expense burn per {isAllTime ? 'month' : 'day'}, by vault.</Text>
          </View>
          <VaultChips options={[{ id: 'all', name: 'All' }, ...vaults]} isActive={(id) => selectedLineVaultId === id} onPress={setSelectedLineVaultId} />
          {loading ? (
            <Skeleton height={112} />
          ) : isAllTime ? (
            <Empty label={ALL_TIME_NOTE} />
          ) : stats.chartSeries.length === 0 ? (
            <Empty label="No expense data for this period." />
          ) : (
            <VaultExpenseChart labels={stats.chartLabels} series={stats.chartSeries} formatValue={formatCoins} xAxisLabel="Day" />
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, styles.divider]}>Top Drains</Text>
          {loading ? (
            <Skeleton height={56} />
          ) : isAllTime ? (
            <Empty label={ALL_TIME_NOTE} />
          ) : stats.topDrains.length === 0 ? (
            <Empty label="No expenses recorded this period." />
          ) : (
            stats.topDrains.map((t) => (
              <View key={t.id} style={[styles.inset, styles.spaceBetween]}>
                <View style={[styles.inline, styles.flex]}>
                  <View style={[styles.drainIcon, { backgroundColor: t.tags?.[0]?.backgroundColor || color.onErrorContainer }]}>
                    <PixelIcon name={toPixelIcon(t.tags?.[0]?.icon || t.vault?.icon || 'ShoppingCart')} size={ms(20)} />
                  </View>
                  <Text style={[styles.body, styles.flex]} numberOfLines={1}>
                    {t.title || t.tags?.[0]?.name || 'Expense'}
                  </Text>
                </View>
                <Text style={styles.drainAmount}>-{formatCoins(t.amount)}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <WizardFab onPress={() => setWizardOpen(true)} />
      {wizardOpen ? <WizardChatSheet onClose={() => setWizardOpen(false)} /> : null}
    </View>
  );
}

const bodySm = { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight) };
const labelCaps = { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), textTransform: 'uppercase' as const };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: ms(space[4]), paddingHorizontal: ms(gutter), paddingBottom: ms(96), gap: ms(space[4]) },
  flex: { flex: 1 },
  header: { borderBottomWidth: ms(4), borderColor: color.surfaceHighest, paddingBottom: ms(space[4]), gap: ms(space[1]) },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineLg.fontSize), lineHeight: ms(text.headlineLg.lineHeight), color: color.primary },
  subtitle: { ...bodySm, color: color.onSurfaceVariant },
  filters: { gap: ms(space[3]) },
  filter: { gap: ms(space[1]) },
  filterLabel: { fontFamily: font.mono, fontSize: ms(10), color: color.outline, textTransform: 'uppercase', marginLeft: ms(space[1]) },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  exportButton: {
    width: ms(48),
    height: ms(48),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.card,
  },
  exportGlyph: { fontSize: ms(20), color: color.primary },
  pressed: { backgroundColor: color.surfaceHighest, transform: [{ translateY: 2 }] },
  disabled: { opacity: 0.5 },
  metricsRow: { flexDirection: 'row', gap: ms(space[4]) },
  card: { padding: ms(space[3]), gap: ms(space[3]), overflow: 'hidden' },
  bgGlyph: { position: 'absolute', right: ms(-16), top: ms(-16), opacity: 0.1 },
  metricLabel: { ...labelCaps, color: color.outline },
  metricValue: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight) },
  metricHint: { ...bodySm },
  netValue: { fontFamily: font.heading, fontSize: ms(text.headlineLg.fontSize), lineHeight: ms(text.headlineLg.lineHeight) },
  primary: { color: color.primary },
  secondary: { color: color.secondary },
  error: { color: color.error },
  skeleton: { width: ms(96), backgroundColor: color.surfaceHighest },
  sparkline: { flexDirection: 'row', height: ms(64), width: '100%', maxWidth: ms(200), marginTop: ms(space[2]) },
  sectionTitle: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.onSurface },
  empty: { ...bodySm, color: color.onSurfaceVariant, textAlign: 'center', paddingVertical: ms(space[4]) },
  allocation: { gap: ms(space[1]) },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: ms(space[3]) },
  inline: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  swatch: { width: ms(12), height: ms(12), borderWidth: 2, borderColor: color.border },
  body: { ...bodySm, color: color.onSurface },
  muted: { ...bodySm, color: color.onSurfaceVariant },
  track: { height: ms(24), backgroundColor: color.surfaceLow, borderWidth: ms(4), borderColor: color.border, overflow: 'hidden' },
  fill: { height: '100%' },
  inset: { gap: ms(space[3]), backgroundColor: color.surfaceLow, padding: ms(space[3]), borderWidth: ms(4), borderColor: color.border, boxShadow: shadow.card },
  vaultName: { ...labelCaps, color: color.onSurface },
  small: { fontFamily: font.body, fontSize: ms(11), lineHeight: ms(16), color: color.onSurfaceVariant },
  savings: { fontFamily: font.heading, fontSize: ms(18) },
  budget: { gap: ms(space[1]) },
  overBudget: { fontFamily: font.mono, fontSize: ms(11), color: color.error, textTransform: 'uppercase' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[1]) },
  tab: { paddingHorizontal: ms(space[3]), paddingVertical: ms(space[1]), borderWidth: 2, borderColor: color.border, backgroundColor: color.surface },
  tabActive: { backgroundColor: color.primary },
  tabText: { ...bodySm, color: color.onSurface },
  tabTextActive: { color: color.onPrimary },
  divider: { borderBottomWidth: ms(4), borderColor: color.border, paddingBottom: ms(space[2]) },
  drainIcon: { padding: ms(space[2]), borderWidth: ms(4), borderColor: color.border },
  drainAmount: { ...labelCaps, color: color.error },
});
