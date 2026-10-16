import type { OccurrenceDto, TagDto, TransactionDto } from '@expense-tracker/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { BackButton } from '../../components/BackButton';
import { Card } from '../../components/Card';
import { Dropdown } from '../../components/Dropdown';
import { IconText } from '../../components/IconText';
import { PixelIcon } from '../../components/PixelIcon';
import { buildYearlyTable, projectableMonths } from '../../components/views/build-yearly-table';
import { YearlyTagTable } from '../../components/views/YearlyTagTable';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { analyticsService, logger, recurringService, tagsService, transactionsService, vaultsService } from '../../services';
import { color, font, shadow, gutter, space, text } from '../../theme';

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const ALL_VAULTS = { id: 'all', name: 'All Vaults' };

interface VaultOption {
  id: string;
  name: string;
}

interface YearData {
  transactions: TransactionDto[];
  occurrences: OccurrenceDto[];
}

export default function TabularViewScreen() {
  const insets = useSafeAreaInsets();
  const userId = useLocalUserId();

  const [tags, setTags] = useState<TagDto[]>([]);
  const [vaults, setVaults] = useState<VaultOption[]>([]);
  const [earliestYear, setEarliestYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState<YearData>({ transactions: [], occurrences: [] });
  const [year, setYear] = useState(CURRENT_YEAR);
  // null until the vaults load, then the default vault ("Main Stash") like the web page.
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Reloads on focus so edits made on other screens show up. Reads one year month by month
  // (plus projections from the current month on) instead of the whole transactions table.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setIsLoading(true);
      Promise.all([
        tagsService.list(userId),
        vaultsService.list(userId),
        analyticsService.yearly(userId),
        Promise.all(MONTHS.map((month) => transactionsService.list(userId, { month, year }))),
        Promise.all(projectableMonths(year, NOW).map((month) => recurringService.occurrences(userId, year, month))),
      ])
        .then(([tagList, vaultList, yearly, txByMonth, occByMonth]) => {
          if (cancelled) return;
          setTags(tagList);
          setVaults(vaultList.map((v) => ({ id: v.id, name: v.name })));
          setSelectedVaultId((prev) => prev ?? vaultList.find((v) => v.isDefault)?.id ?? 'all');
          const years = yearly.map((row) => Number(row.year)).filter((y) => Number.isFinite(y));
          setEarliestYear(Math.min(CURRENT_YEAR, ...years));
          setData({ transactions: txByMonth.flat(), occurrences: occByMonth.flat() });
        })
        .catch((err) => logger.error('Load tabular view failed', { err }))
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [userId, year]),
  );

  // Every year the user has history for, plus next year so projections are useful.
  const minYear = earliestYear;
  const maxYear = CURRENT_YEAR + 1;
  const vaultId = selectedVaultId ?? 'all';

  const model = useMemo(() => buildYearlyTable({ transactions: data.transactions, occurrences: data.occurrences, tags, year, vaultId }), [data, tags, year, vaultId]);

  const vaultOptions = useMemo(() => [ALL_VAULTS, ...vaults], [vaults]);
  const selectedVault = vaultOptions.find((v) => v.id === vaultId) ?? ALL_VAULTS;

  return (
    <ScrollView
      // Safe-area padding is applied by hand below; "automatic" would add the top inset a second time on iOS.
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(space[4]), paddingBottom: insets.bottom + ms(space[8]) }]}
    >
      <BackButton />

      <View style={styles.header}>
        <IconText icon="ChartColumn" iconSize={24} style={styles.title} accessibilityRole="header">
          Tabular View
        </IconText>
        <Text style={styles.subtitle}>One year of spend, month by month and tag by tag.</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.control}>
          <Text style={styles.controlLabel}>Source Vault</Text>
          <Dropdown
            options={vaultOptions}
            value={selectedVault}
            onChange={(vault) => setSelectedVaultId(vault.id)}
            keyExtractor={(vault) => vault.id}
            accessibilityLabel="Source vault"
            renderValue={(vault) => (
              <IconText icon="Package" numberOfLines={1} style={styles.controlValue}>
                {vault.name}
              </IconText>
            )}
            renderOption={(vault) => <Text style={styles.controlValue}>{vault.name}</Text>}
          />
        </View>

        <View style={styles.control}>
          <Text style={styles.controlLabel}>Cycle</Text>
          <View style={styles.yearSwitcher}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous year"
              accessibilityState={{ disabled: year <= minYear }}
              disabled={year <= minYear}
              hitSlop={8}
              onPress={() => setYear((y) => Math.max(minYear, y - 1))}
              style={({ pressed }) => [styles.yearButton, pressed && styles.yearButtonPressed, year <= minYear && styles.disabled]}
            >
              <PixelIcon name="ChevronLeft" size={ms(20)} />
            </Pressable>
            <IconText icon="Calendar" style={styles.yearText} rowStyle={styles.yearRow}>
              {year}
            </IconText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next year"
              accessibilityState={{ disabled: year >= maxYear }}
              disabled={year >= maxYear}
              hitSlop={8}
              onPress={() => setYear((y) => Math.min(maxYear, y + 1))}
              style={({ pressed }) => [styles.yearButton, pressed && styles.yearButtonPressed, year >= maxYear && styles.disabled]}
            >
              <PixelIcon name="ChevronRight" size={ms(20)} />
            </Pressable>
          </View>
        </View>
      </View>

      <Card style={styles.card}>
        <YearlyTagTable model={model} isLoading={isLoading} currentMonth={year === CURRENT_YEAR ? CURRENT_MONTH : undefined} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: ms(gutter), gap: ms(space[4]) },
  header: { gap: ms(space[1]), borderBottomWidth: ms(4), borderColor: color.surfaceHighest, paddingBottom: ms(space[4]) },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineLg.fontSize), lineHeight: ms(text.headlineLg.lineHeight), color: color.primary },
  subtitle: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant },
  controls: { flexDirection: 'row', gap: ms(space[3]) },
  control: { flex: 1, minWidth: 0, gap: ms(space[1]) },
  controlLabel: { fontFamily: font.mono, fontSize: ms(10), color: color.outline, textTransform: 'uppercase', marginLeft: ms(space[1]) },
  controlValue: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), color: color.onSurface, flexShrink: 1 },
  yearSwitcher: {
    height: ms(56),
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: ms(4),
    borderColor: color.border,
    backgroundColor: color.surface,
    boxShadow: shadow.card,
  },
  yearButton: { width: ms(36), alignItems: 'center', justifyContent: 'center' },
  yearButtonPressed: { backgroundColor: color.primary },
  disabled: { opacity: 0.4 },
  yearRow: { flex: 1, justifyContent: 'center' },
  yearText: { fontFamily: font.heading, fontSize: ms(18), color: color.onSurface },
  card: { padding: ms(space[3]) },
});
