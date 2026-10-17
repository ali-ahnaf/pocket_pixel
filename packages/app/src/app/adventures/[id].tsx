import type { AdventureDto, AdventureItemDto, CreateAdventureInput, UpdateAdventureItemInput } from '@expense-tracker/shared';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import { FlatList, type ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { AdventureFormSheet } from '../../components/adventures/AdventureFormSheet';
import { AdventureItemSheet } from '../../components/adventures/AdventureItemSheet';
import { formatAdventureDates } from '../../components/adventures/formatAdventureDates';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PixelIcon } from '../../components/PixelIcon';
import { ConfirmDeleteSheet } from '../../components/profile/ConfirmDeleteSheet';
import { IconButton } from '../../components/profile/IconButton';
import { ProgressBar } from '../../components/ProgressBar';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { formatCurrency } from '../../lib/formatters';
import { adventuresService, logger } from '../../services';
import { color, font, gutter, space, text } from '../../theme';

type Sheet =
  | { kind: 'edit' }
  | { kind: 'delete' }
  | { kind: 'addItem' }
  | { kind: 'editItem'; item: AdventureItemDto }
  | { kind: 'buyItem'; item: AdventureItemDto }
  | { kind: 'removeItem'; item: AdventureItemDto };

const keyExtractor = (item: AdventureItemDto): string => item.id;

interface ItemRowProps {
  item: AdventureItemDto;
  readOnly: boolean;
  onToggle: (item: AdventureItemDto) => void;
  onEdit: (item: AdventureItemDto) => void;
  onRemove: (item: AdventureItemDto) => void;
}

// The box styles are copied from ApplyDebtSheet's checkbox; extract a shared Checkbox when a third screen needs one.
const ItemRow = memo(function ItemRow({ item, readOnly, onToggle, onEdit, onRemove }: ItemRowProps) {
  return (
    <Card style={styles.itemCard}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={item.name}
        accessibilityState={{ checked: item.isBought, disabled: readOnly }}
        disabled={readOnly}
        onPress={() => onToggle(item)}
        style={({ pressed }) => [styles.checkTarget, pressed && styles.pressed]}
      >
        <View style={[styles.checkbox, item.isBought && styles.checkboxOn]}>{item.isBought ? <PixelIcon name="Check" size={ms(14)} /> : null}</View>
      </Pressable>
      <View style={styles.itemInfo}>
        <Text numberOfLines={2} style={[styles.itemName, item.isBought && styles.itemBought]}>
          {item.name}
        </Text>
        <Text style={styles.itemCost}>
          {formatCurrency(item.plannedCost)}
          {item.isBought && item.actualCost != null ? ` planned, ${formatCurrency(item.actualCost)} spent` : ' planned'}
        </Text>
      </View>
      {readOnly ? null : (
        <View style={styles.itemActions}>
          <IconButton icon="Pencil" label={`Edit ${item.name}`} onPress={() => onEdit(item)} />
          <IconButton icon="Trash" label={`Remove ${item.name}`} variant="danger" onPress={() => onRemove(item)} />
        </View>
      )}
    </Card>
  );
});

export default function AdventureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = useLocalUserId();
  const insets = useSafeAreaInsets();
  const [adventure, setAdventure] = useState<AdventureDto | null>(null);
  const [items, setItems] = useState<AdventureItemDto[]>([]);
  const [sheet, setSheet] = useState<Sheet | null>(null);

  const load = useCallback(() => {
    Promise.all([adventuresService.get(userId, id), adventuresService.listItems(userId, id)])
      .then(([a, i]) => {
        setAdventure(a);
        setItems(i);
      })
      .catch((err) => logger.error('Load adventure failed', { err }));
  }, [userId, id]);

  // Re-reads on focus too, and after every write below.
  useFocusEffect(load);

  const run = useCallback(
    (action: Promise<unknown>, what: string): void => {
      action.then(load, (err) => logger.error(`${what} failed`, { err }));
    },
    [load],
  );

  const handleToggle = useCallback(
    (item: AdventureItemDto): void => {
      if (item.isBought) run(adventuresService.updateItem(userId, item.id, { isBought: false }), 'Untick item');
      else setSheet({ kind: 'buyItem', item });
    },
    [userId, run],
  );
  const handleEditItem = useCallback((item: AdventureItemDto): void => setSheet({ kind: 'editItem', item }), []);
  const handleRemoveItem = useCallback((item: AdventureItemDto): void => setSheet({ kind: 'removeItem', item }), []);

  const renderItem = useCallback<ListRenderItem<AdventureItemDto>>(
    ({ item }) => <ItemRow item={item} readOnly={adventure?.isComplete ?? true} onToggle={handleToggle} onEdit={handleEditItem} onRemove={handleRemoveItem} />,
    [adventure?.isComplete, handleToggle, handleEditItem, handleRemoveItem],
  );

  const saveAdventure = (data: CreateAdventureInput): void => run(adventuresService.update(userId, id, data), 'Update adventure');

  const saveItem = (current: AdventureItemDto | null, data: UpdateAdventureItemInput): void => {
    if (current) run(adventuresService.updateItem(userId, current.id, data), 'Update item');
    else run(adventuresService.addItem(userId, id, { name: data.name ?? '', plannedCost: data.plannedCost ?? 0 }), 'Add item');
  };

  const header = (
    <View style={styles.header}>
      <BackButton />
      <Text accessibilityRole="header" style={styles.title}>
        {adventure?.name ?? ' '}
      </Text>
      {adventure?.flavorText ? <Text style={styles.flavor}>{adventure.flavorText}</Text> : null}
      {adventure && formatAdventureDates(adventure) ? <Text style={styles.meta}>{formatAdventureDates(adventure)}</Text> : null}

      {adventure ? <ChestPanel adventure={adventure} /> : <View style={styles.skeleton} />}

      {adventure ? (
        <View style={styles.actions}>
          {adventure.isComplete ? null : <Button label="Add item" icon="Plus" onPress={() => setSheet({ kind: 'addItem' })} />}
          {adventure.isComplete ? null : <Button label="Complete quest" icon="Check" variant="secondary" onPress={() => run(adventuresService.complete(userId, id), 'Complete adventure')} />}
          {adventure.completedAt != null ? <Button label="Reopen quest" variant="secondary" onPress={() => run(adventuresService.reopen(userId, id), 'Reopen adventure')} /> : null}
          <View style={styles.actionRow}>
            <Button label="Edit" icon="Pencil" variant="ghost" onPress={() => setSheet({ kind: 'edit' })} style={styles.actionHalf} />
            <Button label="Delete" icon="Trash" variant="danger" onPress={() => setSheet({ kind: 'delete' })} style={styles.actionHalf} />
          </View>
        </View>
      ) : null}
    </View>
  );

  const empty = adventure ? <Text style={styles.emptyText}>No items packed yet.</Text> : null;

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        // Safe-area padding is applied by hand below; "automatic" would add the top inset a second time on iOS.
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(space[4]), paddingBottom: insets.bottom + ms(space[8]) }]}
      />

      {sheet?.kind === 'edit' && adventure ? <AdventureFormSheet adventure={adventure} onSave={saveAdventure} onClose={() => setSheet(null)} /> : null}
      {sheet?.kind === 'addItem' ? <AdventureItemSheet onSave={(data) => saveItem(null, data)} onClose={() => setSheet(null)} /> : null}
      {sheet?.kind === 'editItem' ? <AdventureItemSheet item={sheet.item} onSave={(data) => saveItem(sheet.item, data)} onClose={() => setSheet(null)} /> : null}
      {sheet?.kind === 'buyItem' ? <AdventureItemSheet item={sheet.item} buying onSave={(data) => saveItem(sheet.item, data)} onClose={() => setSheet(null)} /> : null}
      {sheet?.kind === 'removeItem' ? (
        <ConfirmDeleteSheet
          title="Remove Item"
          before="Remove "
          name={sheet.item.name}
          after=" from this adventure?"
          onConfirm={() => run(adventuresService.removeItem(userId, sheet.item.id), 'Remove item')}
          onClose={() => setSheet(null)}
        />
      ) : null}
      {sheet?.kind === 'delete' && adventure ? (
        <ConfirmDeleteSheet
          title="Delete Adventure"
          before="Delete "
          name={adventure.name}
          after=" and all its items? This cannot be undone."
          onConfirm={() =>
            adventuresService.remove(userId, id).then(
              () => router.back(),
              (err) => logger.error('Delete adventure failed', { err }),
            )
          }
          onClose={() => setSheet(null)}
        />
      ) : null}
    </View>
  );
}

// Quest Chest panel while the quest is open, Quest Complete summary once it is done. Amounts drop their sign, so direction is spelled out.
function ChestPanel({ adventure }: { adventure: AdventureDto }) {
  const { fund, spent, plannedTotal, isComplete, boughtCount, itemCount } = adventure;
  const over = fund != null && spent > fund;

  if (isComplete) {
    return (
      <Card elevated style={styles.panel}>
        <View style={styles.panelTitle}>
          <PixelIcon name="Trophy" size={ms(28)} />
          <Text accessibilityRole="header" style={styles.panelHeading}>
            Quest Complete
          </Text>
        </View>
        <Text style={styles.panelValue}>{formatCurrency(spent)} spent</Text>
        {fund != null ? <Text style={styles.panelLine}>Fund {formatCurrency(fund)}</Text> : null}
        {fund != null ? <Text style={[styles.panelLine, over && styles.over]}>{over ? `${formatCurrency(spent - fund)} over the chest` : `${formatCurrency(fund - spent)} to spare`}</Text> : null}
        <Text style={styles.panelLine}>{`${boughtCount} of ${itemCount} items bought`}</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.panel}>
      <Text accessibilityRole="header" style={styles.panelHeading}>
        Quest Chest
      </Text>
      <Text style={styles.panelLine}>Fund: {fund != null ? formatCurrency(fund) : 'No chest set'}</Text>
      <Text style={styles.panelLine}>Planned: {formatCurrency(plannedTotal)}</Text>
      <Text style={styles.panelValue}>Gold spent: {formatCurrency(spent)}</Text>
      {fund != null && fund > 0 ? <ProgressBar value={spent} max={fund} variant={over ? 'error' : 'primary'} label="Gold spent" /> : null}
      {over ? <Text style={styles.over}>{`${formatCurrency(spent - fund)} over the chest`}</Text> : null}
    </Card>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: ms(gutter) },
  header: { gap: ms(space[4]), paddingBottom: ms(space[4]) },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineLg.fontSize), lineHeight: ms(text.headlineLg.lineHeight), color: color.primary },
  flavor: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurfaceVariant },
  meta: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(text.labelCaps.lineHeight), color: color.onSurfaceVariant },
  skeleton: { height: ms(160), backgroundColor: color.surfaceHighest, borderWidth: ms(4), borderColor: color.border },
  panel: { gap: ms(space[2]) },
  panelTitle: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  panelHeading: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.primary, textTransform: 'uppercase' },
  panelValue: { fontFamily: font.heading, fontSize: ms(20), lineHeight: ms(26), color: color.secondary },
  panelLine: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurface },
  over: { fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.error },
  actions: { gap: ms(space[3]) },
  actionRow: { flexDirection: 'row', gap: ms(space[3]) },
  actionHalf: { flex: 1 },
  itemCard: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]), padding: ms(space[3]) },
  checkTarget: { minWidth: ms(44), minHeight: ms(44), alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ translateY: 2 }] },
  checkbox: { width: ms(24), height: ms(24), alignItems: 'center', justifyContent: 'center', borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surfaceLowest },
  checkboxOn: { backgroundColor: color.primary },
  itemInfo: { flex: 1, gap: ms(space[1]) },
  itemName: { fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurface },
  itemBought: { color: color.onSurfaceVariant },
  itemCost: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(text.labelCaps.lineHeight), color: color.onSurfaceVariant },
  itemActions: { flexDirection: 'row', gap: ms(space[2]) },
  emptyText: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurfaceVariant, textAlign: 'center', paddingVertical: ms(space[6]) },
  separator: { height: ms(space[3]) },
});
