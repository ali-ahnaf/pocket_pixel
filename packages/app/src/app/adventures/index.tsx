import type { AdventureDto, CreateAdventureInput } from '@expense-tracker/shared';
import { router, useFocusEffect } from 'expo-router';
import { memo, useCallback, useState } from 'react';
import { FlatList, type ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { AdventureFormSheet } from '../../components/adventures/AdventureFormSheet';
import { formatAdventureDates } from '../../components/adventures/formatAdventureDates';
import { BackButton } from '../../components/BackButton';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PixelIcon } from '../../components/PixelIcon';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { formatCurrency } from '../../lib/formatters';
import { adventuresService, logger } from '../../services';
import { color, font, gutter, space, text } from '../../theme';

const keyExtractor = (adventure: AdventureDto): string => adventure.id;

const openAdventure = (id: string): void => router.push({ pathname: '/adventures/[id]', params: { id } });

const AdventureRow = memo(function AdventureRow({ adventure }: { adventure: AdventureDto }) {
  const dates = formatAdventureDates(adventure);
  const spent = adventure.fund != null ? `${formatCurrency(adventure.spent)} / ${formatCurrency(adventure.fund)}` : `${formatCurrency(adventure.spent)} spent`;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${adventure.name}`} onPress={() => openAdventure(adventure.id)} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.name}>
            {adventure.name}
          </Text>
          {adventure.isComplete ? (
            <View style={styles.completeMark}>
              <PixelIcon name="Trophy" size={ms(16)} />
              <Text style={styles.completeText}>Quest Complete</Text>
            </View>
          ) : null}
        </View>
        {adventure.flavorText ? (
          <Text numberOfLines={2} style={styles.flavor}>
            {adventure.flavorText}
          </Text>
        ) : null}
        {dates ? <Text style={styles.meta}>{dates}</Text> : null}
        <Text style={styles.spent}>{spent}</Text>
      </Card>
    </Pressable>
  );
});

const renderItem: ListRenderItem<AdventureDto> = ({ item }) => <AdventureRow adventure={item} />;

export default function AdventuresScreen() {
  const userId = useLocalUserId();
  const insets = useSafeAreaInsets();
  const [adventures, setAdventures] = useState<AdventureDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchData = useCallback(() => {
    adventuresService
      .list(userId)
      .then(setAdventures)
      .catch((err) => logger.error('Load adventures failed', { err }))
      .finally(() => setIsLoading(false));
  }, [userId]);

  // Re-reads on focus too, so a change made on the detail screen shows up on return.
  useFocusEffect(fetchData);

  const handleCreate = (data: CreateAdventureInput): void => {
    adventuresService.create(userId, data).then(
      ({ id }) => openAdventure(id),
      (err) => logger.error('Create adventure failed', { err }),
    );
  };

  const chartButton = <Button label="Chart a new quest" icon="Plus" onPress={() => setAddOpen(true)} />;

  const header = (
    <View style={styles.header}>
      <BackButton />
      <Text accessibilityRole="header" style={styles.title}>
        Adventures
      </Text>
      {chartButton}
    </View>
  );

  const empty = isLoading ? (
    <View style={styles.skeletons}>
      <View style={styles.skeleton} />
      <View style={styles.skeleton} />
    </View>
  ) : (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyGlyph}>
        <PixelIcon name="Compass" size={ms(56)} />
      </View>
      <Text style={styles.emptyTitle}>No adventures yet.</Text>
      <Text style={styles.emptyText}>Chart your first quest and pack your Quest Chest.</Text>
      {chartButton}
    </Card>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={isLoading ? [] : adventures}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={Separator}
        // Safe-area padding is applied by hand below; "automatic" would add the top inset a second time on iOS.
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + ms(space[4]), paddingBottom: insets.bottom + ms(space[8]) }]}
      />

      {addOpen ? <AdventureFormSheet onSave={handleCreate} onClose={() => setAddOpen(false)} /> : null}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: ms(gutter) },
  header: { gap: ms(space[4]), paddingBottom: ms(space[4]), marginBottom: ms(space[4]), borderBottomWidth: ms(4), borderColor: color.surfaceHighest },
  title: { fontFamily: font.heading, fontSize: ms(text.headlineLg.fontSize), lineHeight: ms(text.headlineLg.lineHeight), color: color.primary },
  card: { gap: ms(space[2]) },
  pressed: { transform: [{ translateY: 2 }] },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(space[3]) },
  name: { flex: 1, fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), lineHeight: ms(text.headlineMd.lineHeight), color: color.onSurface },
  completeMark: { flexDirection: 'row', alignItems: 'center', gap: ms(space[1]) },
  completeText: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(text.labelCaps.lineHeight), color: color.primary, textTransform: 'uppercase' },
  flavor: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant },
  meta: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(text.labelCaps.lineHeight), color: color.onSurfaceVariant },
  spent: { fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.secondary },
  skeletons: { gap: ms(space[3]) },
  skeleton: { height: ms(96), backgroundColor: color.surfaceHighest, borderWidth: ms(4), borderColor: color.border },
  emptyCard: { alignItems: 'center', gap: ms(space[3]), paddingVertical: ms(48) },
  emptyGlyph: { opacity: 0.7 },
  emptyTitle: { fontFamily: font.heading, fontSize: ms(20), lineHeight: ms(26), color: color.onSurface, textAlign: 'center' },
  emptyText: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant, textAlign: 'center' },
  separator: { height: ms(space[3]) },
});
