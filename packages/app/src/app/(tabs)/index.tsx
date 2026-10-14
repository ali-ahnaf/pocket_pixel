import type { OccurrenceDto, TagDto, TransactionDto, VaultDto } from '@expense-tracker/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, type ListRenderItem, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AppBar } from '../../components/AppBar';
import { AdjustBalanceSheet } from '../../components/home/AdjustBalanceSheet';
import { OccurrenceRow, TransactionRow } from '../../components/home/DropRow';
import { EditTransactionSheet } from '../../components/home/EditTransactionSheet';
import { FilterButton, FilterOption } from '../../components/home/FilterButton';
import { LogResourceSheet } from '../../components/home/LogResourceSheet';
import { MonthSelector } from '../../components/home/MonthSelector';
import { PendingExpensesPanel } from '../../components/home/PendingExpensesPanel';
import { StatusCard } from '../../components/home/StatusCard';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { logger, recurringService, tagsService, transactionsService, vaultsService } from '../../services';
import { color, font, shadow, gutter, space, text } from '../../theme';
import { PixelIcon } from '../../components/PixelIcon';

type DropItem = { kind: 'tx'; tx: TransactionDto } | { kind: 'occ'; occ: OccurrenceDto };
type Searchable = Pick<TransactionDto, 'title' | 'vault' | 'tags'>;

const occKey = (o: OccurrenceDto): string => `${o.recurringId}:${o.date}`;
const keyExtractor = (item: DropItem): string => (item.kind === 'tx' ? item.tx.id : occKey(item.occ));
const Separator = () => <View style={styles.separator} />;

const filterLabel = (selected: string[], items: { id: string; name: string }[], all: string, plural: string): string =>
  selected.length === 0 ? all : selected.length === 1 ? (items.find((i) => i.id === selected[0])?.name ?? all) : `${selected.length} ${plural}`;

// Port of packages/ui/src/app/page.tsx (the dashboard). OnboardingWalkthrough is skipped: it is a DOM spotlight tour.
export default function Home() {
  const userId = useLocalUserId();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [loaded, setLoaded] = useState(false);

  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [occurrences, setOccurrences] = useState<OccurrenceDto[]>([]);
  const [vaults, setVaults] = useState<VaultDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  // null until the first load picks the default vault, as the web page does once per visit.
  const [selectedVaultFilter, setSelectedVaultFilter] = useState<string[] | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [applyingKey, setApplyingKey] = useState<string | null>(null);

  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionDto | null>(null);

  const vaultFilter = useMemo(() => selectedVaultFilter ?? [], [selectedVaultFilter]);

  // Re-read on focus (other tabs can add transactions) and after every change made from this screen.
  const refetch = useCallback(() => {
    let active = true;
    Promise.all([
      transactionsService.list(userId, { month: selectedMonth + 1, year: selectedYear }),
      vaultsService.list(userId),
      recurringService.occurrences(userId, selectedYear, selectedMonth + 1),
      tagsService.list(userId),
    ]).then(
      ([txs, vaultList, occs, tagList]) => {
        if (!active) return;
        setTransactions(txs);
        setVaults(vaultList);
        setOccurrences(occs);
        setTags(tagList);
        setSelectedVaultFilter((prev) => prev ?? vaultList.filter((v) => v.isDefault).map((v) => v.id));
        setLoaded(true);
      },
      (err) => logger.error('Load dashboard failed', { err }),
    );
    return () => {
      active = false;
    };
  }, [userId, selectedMonth, selectedYear]);

  useFocusEffect(refetch);

  const { filteredDrops, filteredOccurrences, totalIncome, totalExpenses, vaultsSpent } = useMemo(() => {
    const matchesVault = (vaultId: string | null): boolean => vaultFilter.length === 0 || vaultFilter.includes(vaultId ?? '');
    const matchesTag = (itemTags: TagDto[]): boolean => selectedTagFilter.length === 0 || itemTags.some((t) => selectedTagFilter.includes(t.id));
    const search = searchQuery.trim().toLowerCase();
    const matchesSearch = (item: Searchable): boolean => !search || [item.title ?? '', item.vault?.name ?? '', ...item.tags.map((t) => t.name)].some((v) => v.toLowerCase().includes(search));

    const drops = transactions
      .filter((t) => matchesVault(t.vaultId) && matchesTag(t.tags) && matchesSearch(t))
      .sort((a, b) => {
        const byDate = sortOrder === 'desc' ? b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt) : a.date.localeCompare(b.date) || a.updatedAt.localeCompare(b.updatedAt);
        if (sortField === 'amount') return (sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount) || byDate;
        return byDate;
      });
    const sum = (list: TransactionDto[], type: string): number => list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
    return {
      filteredDrops: drops,
      filteredOccurrences: occurrences.filter((o) => matchesVault(o.vaultId) && matchesTag(o.tags) && matchesSearch(o)),
      totalIncome: sum(drops, 'income'),
      totalExpenses: sum(drops, 'expense'),
      vaultsSpent: sum(
        transactions.filter((t) => matchesVault(t.vaultId)),
        'expense',
      ),
    };
  }, [transactions, occurrences, vaultFilter, selectedTagFilter, searchQuery, sortOrder, sortField]);

  const items = useMemo<DropItem[]>(
    () => [...filteredDrops.map((tx): DropItem => ({ kind: 'tx', tx })), ...filteredOccurrences.map((occ): DropItem => ({ kind: 'occ', occ }))],
    [filteredDrops, filteredOccurrences],
  );

  const netYield = totalIncome - totalExpenses;
  const budgetProgress = totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0;
  const selectedVaults = vaultFilter.length === 0 ? vaults : vaults.filter((v) => vaultFilter.includes(v.id));
  // monthlyBudget is a SQLite decimal and can come back as a string, so coerce before summing.
  const totalBudget = selectedVaults.reduce((sum, v) => sum + (Number(v.monthlyBudget) || 0), 0);
  const usagePercent = totalBudget > 0 ? Math.min((vaultsSpent / totalBudget) * 100, 100) : 0;
  const normalizedSearch = searchQuery.trim();

  const handleNetYieldPress = (): void => {
    if (vaultFilter.length !== 1) {
      Alert.alert('Please select a single vault to adjust balance.');
      return;
    }
    setIsAdjustOpen(true);
  };

  const handleApply = useCallback(
    (occ: OccurrenceDto) => {
      setApplyingKey(occKey(occ));
      recurringService
        .apply(userId, occ.recurringId, occ.date)
        .then(refetch, (err) => logger.error('Apply occurrence failed', { err }))
        .finally(() => setApplyingKey(null));
    },
    [userId, refetch],
  );

  const handleSkip = useCallback(
    (occ: OccurrenceDto) => {
      setOccurrences((prev) => prev.filter((o) => occKey(o) !== occKey(occ)));
      recurringService.skip(userId, occ.recurringId, occ.date).catch((err) => {
        logger.error('Skip occurrence failed', { err });
        refetch();
      });
    },
    [userId, refetch],
  );

  const renderItem = useCallback<ListRenderItem<DropItem>>(
    ({ item }) =>
      item.kind === 'tx' ? (
        <TransactionRow tx={item.tx} onPress={setEditingTransaction} />
      ) : (
        <OccurrenceRow occ={item.occ} isApplying={applyingKey === occKey(item.occ)} onApply={handleApply} onSkip={handleSkip} />
      ),
    [applyingKey, handleApply, handleSkip],
  );

  const header = (
    <View style={styles.header}>
      <MonthSelector
        month={selectedMonth}
        year={selectedYear}
        onChange={(m, y) => {
          setSelectedMonth(m);
          setSelectedYear(y);
        }}
      />
      <PendingExpensesPanel onTransactionCreated={refetch} />
      <StatusCard
        isLoading={!loaded}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netYield={netYield}
        budgetProgress={budgetProgress}
        totalBudget={totalBudget}
        usagePercent={usagePercent}
        onNetYieldPress={handleNetYieldPress}
      />

      <View style={styles.dropsCard}>
        <View style={styles.dropsHeader}>
          <Text style={styles.dropsTitle} accessibilityRole="header">
            Recent Drops
          </Text>
          <View style={styles.sortRow}>
            <FilterButton label={sortField === 'date' ? 'Date' : 'Amount'} accessibilityLabel="Choose sort field" style={styles.sortButton}>
              {(close) =>
                (['date', 'amount'] as const).map((field) => (
                  <FilterOption
                    key={field}
                    label={field === 'date' ? 'Date' : 'Amount'}
                    selected={sortField === field}
                    onPress={() => {
                      setSortField(field);
                      close();
                    }}
                  />
                ))
              }
            </FilterButton>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={sortField === 'date' ? 'Sort by date' : 'Sort by amount'}
              accessibilityHint={sortField === 'date' ? (sortOrder === 'desc' ? 'Newest first' : 'Oldest first') : sortOrder === 'desc' ? 'Largest first' : 'Smallest first'}
              hitSlop={8}
              onPress={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
              style={({ pressed }) => [styles.sortButton, styles.orderButton, pressed && styles.pressed]}
            >
              <View style={sortOrder === 'asc' && styles.flipped}>
                <PixelIcon name="ChevronDown" size={ms(16)} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.search}>
          <PixelIcon name="Search" size={ms(16)} />
          <TextInput
            accessibilityLabel="Search transactions"
            placeholder="SEARCH DROPS..."
            placeholderTextColor={color.outline}
            selectionColor={color.primary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={12} onPress={() => setSearchQuery('')}>
              <PixelIcon name="X" size={ms(16)} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filters}>
          <FilterButton label={filterLabel(vaultFilter, vaults, 'All Vaults', 'Vaults')} style={styles.flex}>
            {(close) => (
              <>
                <FilterOption
                  label="All Vaults"
                  selected={vaultFilter.length === 0}
                  onPress={() => {
                    setSelectedVaultFilter([]);
                    close();
                  }}
                />
                {vaults.map((v) => (
                  <FilterOption
                    key={v.id}
                    label={v.name}
                    selected={vaultFilter.includes(v.id)}
                    onPress={() => setSelectedVaultFilter((prev) => ((prev ?? []).includes(v.id) ? (prev ?? []).filter((id) => id !== v.id) : [...(prev ?? []), v.id]))}
                  />
                ))}
              </>
            )}
          </FilterButton>
          <FilterButton label={filterLabel(selectedTagFilter, tags, 'All Tags', 'Tags')} style={styles.flex}>
            {(close) => (
              <>
                <FilterOption
                  label="All Tags"
                  selected={selectedTagFilter.length === 0}
                  onPress={() => {
                    setSelectedTagFilter([]);
                    close();
                  }}
                />
                {tags.map((t) => (
                  <FilterOption
                    key={t.id}
                    label={t.name}
                    selected={selectedTagFilter.includes(t.id)}
                    onPress={() => setSelectedTagFilter((prev) => (prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]))}
                  />
                ))}
              </>
            )}
          </FilterButton>
        </View>
      </View>
    </View>
  );

  const empty = !loaded ? (
    <View style={styles.skeletonList}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonBar, styles.skeletonWide]} />
            <View style={[styles.skeletonBar, styles.skeletonNarrow]} />
          </View>
        </View>
      ))}
    </View>
  ) : (
    <View style={styles.empty}>
      <View style={styles.emptyGlyph}>
        <PixelIcon name="Package" size={ms(56)} />
      </View>
      <Text style={styles.emptyTitle}>{normalizedSearch ? 'No matching drops' : 'No drops this month'}</Text>
      <Text style={styles.emptyBody}>{normalizedSearch ? 'Try a different search term' : 'Log a transaction to get started'}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppBar />
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        extraData={applyingKey}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      <Pressable accessibilityRole="button" accessibilityLabel="Log new resource" onPress={() => setIsLogOpen(true)} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
        <Text style={styles.fabGlyph}>+</Text>
      </Pressable>

      {isLogOpen ? <LogResourceSheet vaults={vaults} tags={tags} selectedMonth={selectedMonth} selectedYear={selectedYear} onSuccess={refetch} onClose={() => setIsLogOpen(false)} /> : null}
      {editingTransaction ? <EditTransactionSheet transaction={editingTransaction} vaults={vaults} tags={tags} onSuccess={refetch} onClose={() => setEditingTransaction(null)} /> : null}
      {isAdjustOpen ? (
        <AdjustBalanceSheet
          currentNetYield={netYield}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          vaultId={vaultFilter.length === 1 ? vaultFilter[0] : null}
          onSuccess={refetch}
          onClose={() => setIsAdjustOpen(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: ms(space[3]), paddingHorizontal: ms(gutter), paddingBottom: ms(96) },
  header: { gap: ms(space[4]), marginBottom: ms(space[3]) },
  separator: { height: ms(space[3]) },
  flex: { flex: 1 },
  pressed: { transform: [{ translateY: 1 }] },
  dropsCard: { backgroundColor: color.surface, borderWidth: ms(4), borderColor: color.border, padding: ms(space[4]), gap: ms(space[4]), boxShadow: shadow.card },
  dropsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: ms(4), borderColor: color.border, paddingBottom: ms(space[2]) },
  dropsTitle: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(16), color: color.outline, textTransform: 'uppercase' },
  sortRow: { flexDirection: 'row', gap: ms(space[2]) },
  sortButton: { width: ms(80), minHeight: ms(28) },
  orderButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg, borderWidth: ms(2), borderColor: color.border },
  flipped: { transform: [{ rotate: '180deg' }] },
  search: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]), paddingHorizontal: ms(space[2]), backgroundColor: color.bg, borderWidth: ms(2), borderColor: color.border },
  searchInput: { flex: 1, minHeight: ms(36), fontFamily: font.mono, fontSize: ms(10), color: color.onSurface },
  filters: { flexDirection: 'row', gap: ms(space[2]) },
  skeletonList: { gap: ms(space[3]) },
  skeletonRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[4]), padding: ms(space[3]), backgroundColor: color.bg, borderWidth: ms(4), borderColor: color.border },
  skeletonIcon: { width: ms(40), height: ms(40), backgroundColor: color.surfaceHighest, borderWidth: ms(2), borderColor: color.border },
  skeletonBody: { flex: 1, gap: ms(space[2]) },
  skeletonBar: { height: ms(12), backgroundColor: color.surfaceHighest },
  skeletonWide: { width: '66%' },
  skeletonNarrow: { width: '33%' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: ms(48), gap: ms(space[3]) },
  emptyGlyph: { opacity: 0.6 },
  emptyTitle: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.outline, textTransform: 'uppercase' },
  emptyBody: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), color: color.onSurfaceVariant, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: ms(space[4]),
    bottom: ms(space[4]),
    width: ms(64),
    height: ms(64),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primary,
    borderWidth: ms(4),
    borderColor: color.border,
    boxShadow: shadow.coin,
  },
  fabPressed: { transform: [{ translateY: 4 }], boxShadow: 'none' },
  fabGlyph: { fontFamily: font.heading, fontSize: ms(32), lineHeight: ms(36), color: color.onPrimary },
});
