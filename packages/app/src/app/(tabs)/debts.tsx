import type { CreateDebtInput, DebtDto, DebtStatus, VaultDto } from '@expense-tracker/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, type ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AppBar } from '../../components/AppBar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Dropdown } from '../../components/Dropdown';
import { AddDebtSheet } from '../../components/debts/AddDebtSheet';
import { ApplyDebtSheet } from '../../components/debts/ApplyDebtSheet';
import { DebtRow } from '../../components/debts/DebtRow';
import { DiscardDebtSheet } from '../../components/debts/DiscardDebtSheet';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { debtsService, logger, vaultsService } from '../../services';
import { color, font, gutter, space, text } from '../../theme';

const STATUSES: DebtStatus[] = ['incomplete', 'completed', 'all'];
const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
const keyExtractor = (debt: DebtDto): string => debt.id;

// Ported from packages/ui/src/app/debts/page.tsx. The web ?status= query param is screen state here.
export default function DebtsScreen() {
  const userId = useLocalUserId();
  const [status, setStatus] = useState<DebtStatus>('incomplete');
  const [debts, setDebts] = useState<DebtDto[]>([]);
  const [vaults, setVaults] = useState<VaultDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<DebtDto | null>(null);
  const [applyDebt, setApplyDebt] = useState<DebtDto | null>(null);
  const [discardDebt, setDiscardDebt] = useState<DebtDto | null>(null);

  const fetchData = useCallback(() => {
    Promise.all([debtsService.list(userId, status), vaultsService.list(userId)])
      .then(([d, v]) => {
        setDebts(d);
        setVaults(v);
      })
      .catch((err) => logger.error('Load debts failed', { err }))
      .finally(() => setIsLoading(false));
  }, [userId, status]);

  // Re-reads on focus too, so a change made on another tab shows up on return.
  useFocusEffect(fetchData);

  const handleCreate = (data: CreateDebtInput): void => {
    debtsService.create(userId, data).then(
      (created) => setDebts((prev) => [created, ...prev]),
      (err) => logger.error('Create debt failed', { err }),
    );
  };

  const handleUpdate = (id: string, data: CreateDebtInput): void => {
    debtsService.update(userId, id, data).then(
      (updated) => setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d))),
      (err) => logger.error('Update debt failed', { err }),
    );
  };

  const handleApply = (debt: DebtDto, vaultId: string | null, skipTransaction: boolean): Promise<void> =>
    debtsService.apply(userId, debt.id, { vaultId, skipTransaction }).then(fetchData, (err) => {
      logger.error('Apply debt failed', { err });
      throw err;
    });

  const handleDiscard = (debt: DebtDto): void => {
    debtsService.remove(userId, debt.id).then(fetchData, (err) => logger.error('Discard debt failed', { err }));
  };

  const renderItem = useCallback<ListRenderItem<DebtDto>>(({ item }) => <DebtRow debt={item} onEdit={setEditDebt} onApply={setApplyDebt} onDiscard={setDiscardDebt} />, []);

  const header = (
    <View style={styles.header}>
      <View>
        <Pressable accessibilityRole="link" onPress={() => router.push('/')} style={styles.titleLink}>
          <Text accessibilityRole="header" style={styles.title}>
            Debts
          </Text>
        </Pressable>
        <Text style={styles.subtitle}>Templates you can apply as expenses or income whenever they come due.</Text>
      </View>
      <View style={styles.controls}>
        <View style={styles.statusDropdown}>
          <Dropdown
            accessibilityLabel="Status"
            options={STATUSES}
            value={status}
            onChange={setStatus}
            keyExtractor={(s) => s}
            renderValue={(s) => <Text style={styles.statusSelected}>{capitalize(s)}</Text>}
            renderOption={(s, isSelected) => (
              <>
                <Text style={isSelected ? styles.statusSelected : styles.statusOption}>{capitalize(s)}</Text>
                {isSelected ? <View style={styles.selectedMark} /> : null}
              </>
            )}
          />
        </View>
        <Button label="+ New" onPress={() => setAddOpen(true)} style={styles.newButton} />
      </View>
    </View>
  );

  const empty = isLoading ? (
    <View style={styles.skeletons}>
      <View style={styles.skeleton} />
      <View style={styles.skeleton} />
      <View style={styles.skeleton} />
    </View>
  ) : (
    <Card style={styles.emptyCard}>
      <Text style={styles.emptyGlyph}>🪙</Text>
      <Text style={styles.emptyTitle}>No dues yet.</Text>
      <Text style={styles.emptyText}>Create a due to keep a reusable template — apply it whenever the payment lands.</Text>
    </Card>
  );

  return (
    <View style={styles.screen}>
      <AppBar />
      <FlatList
        data={isLoading ? [] : debts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={Separator}
        contentInsetAdjustmentBehavior="automatic"
      />

      {addOpen ? <AddDebtSheet onSave={handleCreate} onClose={() => setAddOpen(false)} /> : null}
      {editDebt ? <AddDebtSheet debt={editDebt} onSave={(data) => handleUpdate(editDebt.id, data)} onClose={() => setEditDebt(null)} /> : null}
      {discardDebt ? <DiscardDebtSheet debtTitle={discardDebt.title} onDiscard={() => handleDiscard(discardDebt)} onClose={() => setDiscardDebt(null)} /> : null}
      {applyDebt ? <ApplyDebtSheet debt={applyDebt} vaults={vaults} onConfirm={(vaultId, skip) => handleApply(applyDebt, vaultId, skip)} onClose={() => setApplyDebt(null)} /> : null}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: ms(space[4]), paddingHorizontal: ms(gutter), paddingBottom: ms(space[8]) },
  header: { gap: ms(space[4]), paddingBottom: ms(space[4]), marginBottom: ms(space[4]), borderBottomWidth: ms(4), borderColor: color.surfaceHighest },
  titleLink: { alignSelf: 'flex-start' },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineLg.fontSize), lineHeight: ms(text.headlineLg.lineHeight), color: color.primary },
  subtitle: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant },
  controls: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  statusDropdown: { flex: 1 },
  statusSelected: { fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize), color: color.primary },
  statusOption: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), color: color.onSurface },
  selectedMark: { width: ms(16), height: ms(16), backgroundColor: color.primary, borderWidth: ms(2), borderColor: color.border },
  newButton: { height: ms(56) },
  skeletons: { gap: ms(space[3]) },
  skeleton: { height: ms(96), backgroundColor: color.surfaceHighest, borderWidth: ms(4), borderColor: color.border },
  emptyCard: { alignItems: 'center', gap: ms(space[3]), paddingVertical: ms(48) },
  emptyGlyph: { fontSize: ms(48), opacity: 0.5 },
  emptyTitle: { fontFamily: font.heading, fontSize: ms(20), lineHeight: ms(26), color: color.onSurface, textAlign: 'center' },
  emptyText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant, textAlign: 'center' },
  separator: { height: ms(space[3]) },
});
