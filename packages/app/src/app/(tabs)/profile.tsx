import type { CreateRecurringInput, CreateTagInput, CreateVaultInput, RecurringDto, TagDto, VaultDto } from '@expense-tracker/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, SectionList, type SectionListRenderItem, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AppBar } from '../../components/AppBar';
import { AvatarPickerModal } from '../../components/AvatarPickerModal';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { ConfirmDeleteSheet } from '../../components/profile/ConfirmDeleteSheet';
import { DeleteVaultSheet } from '../../components/profile/DeleteVaultSheet';
import { QuestRow } from '../../components/profile/QuestRow';
import { RecurringQuestSheet } from '../../components/profile/RecurringQuestSheet';
import { SectionHeader } from '../../components/profile/SectionHeader';
import { TagFormSheet } from '../../components/profile/TagFormSheet';
import { TagRow } from '../../components/profile/TagRow';
import { VaultCard } from '../../components/profile/VaultCard';
import { VaultFormSheet } from '../../components/profile/VaultFormSheet';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { useUser } from '../../hooks/useUser';
import { AVATARS, avatarSource } from '../../lib/static';
import { logger, recurringService, tagsService, usersService, vaultsService } from '../../services';
import { color, font, shadow, gutter, space, text } from '../../theme';
import { PixelIcon } from '../../components/PixelIcon';

type Item = RecurringDto | TagDto;
interface Section {
  key: 'quests' | 'tags';
  data: Item[];
}

// Which sheet is open; only one at a time.
type Sheet =
  | { kind: 'avatar' }
  | { kind: 'vault'; vault?: VaultDto }
  | { kind: 'deleteVault'; vault: VaultDto }
  | { kind: 'quest'; quest?: RecurringDto }
  | { kind: 'deleteQuest'; quest: RecurringDto }
  | { kind: 'tag'; tag?: TagDto }
  | { kind: 'deleteTag'; tag: TagDto };

const isQuest = (item: Item): item is RecurringDto => 'interval' in item;

const fail = (err: unknown): void => {
  logger.error('Profile action failed', { err });
  Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
};

const Spacer = (): React.JSX.Element => <View style={styles.spacer} />;

// Ported from packages/ui/src/app/profile/page.tsx.
export default function ProfileScreen() {
  const userId = useLocalUserId();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [vaults, setVaults] = useState<VaultDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [quests, setQuests] = useState<RecurringDto[]>([]);
  const [open, setOpen] = useState({ profile: true, vaults: false, quests: false, tags: false });
  const [tagSearch, setTagSearch] = useState('');
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);

  const playerName = draftName ?? user?.name ?? '';
  const avatar = draftAvatar ?? user?.avatar ?? AVATARS[0];
  const toggle = (key: keyof typeof open): void => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  const closeSheet = (): void => setSheet(null);

  // Reload on focus so vaults or tags added from other tabs show up.
  useFocusEffect(
    useCallback(() => {
      Promise.all([vaultsService.list(userId), tagsService.list(userId), recurringService.list(userId)])
        .then(([v, t, q]) => {
          setVaults(v);
          setTags(t);
          setQuests(q);
        }, fail)
        .finally(() => setLoading(false));
    }, [userId]),
  );

  const saveProfile = (): void => {
    usersService.update(userId, { name: playerName, avatar }).catch(fail);
  };

  const saveVault = (input: CreateVaultInput, id?: string): void => {
    const op = id ? vaultsService.update(userId, id, input) : vaultsService.create(userId, input);
    op.then((saved) => setVaults((prev) => (id ? prev.map((v) => (v.id === id ? saved : v)) : [...prev, saved])), fail);
  };

  const setDefaultVault = useCallback(
    (vaultId: string) => {
      vaultsService.setDefault(userId, vaultId).then(() => setVaults((prev) => prev.map((v) => ({ ...v, isDefault: v.id === vaultId }))), fail);
    },
    [userId],
  );

  // Web ignores the move/delete choice too and always just deletes the vault.
  const deleteVault = (id: string): void => {
    vaultsService.remove(userId, id).then(() => setVaults((prev) => prev.filter((v) => v.id !== id)), fail);
  };

  const saveQuest = (input: CreateRecurringInput, id?: string): void => {
    const op = id ? recurringService.update(userId, id, input) : recurringService.create(userId, input);
    op.then((saved) => {
      if (saved) setQuests((prev) => (id ? prev.map((q) => (q.id === id ? saved : q)) : [...prev, saved]));
    }, fail);
  };

  const deleteQuest = (id: string): void => {
    recurringService.remove(userId, id).then(() => setQuests((prev) => prev.filter((q) => q.id !== id)), fail);
  };

  const createTagForQuest = async (name: string): Promise<TagDto | null> => {
    try {
      const tag = await tagsService.create(userId, { name });
      setTags((prev) => [...prev, tag]);
      return tag;
    } catch (err) {
      fail(err);
      return null;
    }
  };

  const saveTag = (input: CreateTagInput, id?: string): void => {
    const op = id ? tagsService.update(userId, id, input) : tagsService.create(userId, input);
    op.then((saved) => setTags((prev) => (id ? prev.map((t) => (t.id === id ? saved : t)) : [...prev, saved])), fail);
  };

  const deleteTag = (id: string): void => {
    tagsService.remove(userId, id).then(() => setTags((prev) => prev.filter((t) => t.id !== id)), fail);
  };

  const editVault = useCallback((vault: VaultDto) => setSheet({ kind: 'vault', vault }), []);
  const askDeleteVault = useCallback((vault: VaultDto) => setSheet({ kind: 'deleteVault', vault }), []);
  const editQuest = useCallback((quest: RecurringDto) => setSheet({ kind: 'quest', quest }), []);
  const askDeleteQuest = useCallback((quest: RecurringDto) => setSheet({ kind: 'deleteQuest', quest }), []);
  const editTag = useCallback((tag: TagDto) => setSheet({ kind: 'tag', tag }), []);
  const askDeleteTag = useCallback((tag: TagDto) => setSheet({ kind: 'deleteTag', tag }), []);

  const renderItem: SectionListRenderItem<Item, Section> = useCallback(
    ({ item }) => (isQuest(item) ? <QuestRow quest={item} onEdit={editQuest} onDelete={askDeleteQuest} /> : <TagRow tag={item} onEdit={editTag} onDelete={askDeleteTag} />),
    [editQuest, askDeleteQuest, editTag, askDeleteTag],
  );

  const query = tagSearch.trim().toLowerCase();
  const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(query));
  const sections: Section[] = [
    { key: 'quests', data: open.quests && !loading ? quests : [] },
    { key: 'tags', data: open.tags && !loading ? filteredTags : [] },
  ];

  const header = (
    <>
      <View style={styles.section}>
        <SectionHeader icon="User" title="Player Profile" open={open.profile} onToggle={() => toggle('profile')} />
        {open.profile && (
          <Card style={styles.profileCard}>
            <View style={styles.avatarWrap}>
              <Image source={avatarSource(avatar)} style={styles.avatar} accessibilityLabel="Profile avatar" />
              <Pressable accessibilityRole="button" accessibilityLabel="Change avatar" hitSlop={8} onPress={() => setSheet({ kind: 'avatar' })} style={styles.avatarEdit}>
                <PixelIcon name="Pencil" size={ms(18)} />
              </Pressable>
            </View>
            <Input label="Player Name" value={playerName} onChangeText={setDraftName} />
            <Button label="Save changes" onPress={saveProfile} />
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader icon="Briefcase" title="Your Vaults" open={open.vaults} onToggle={() => toggle('vaults')} onAdd={() => setSheet({ kind: 'vault' })} />
        {open.vaults &&
          (loading ? (
            <Text style={styles.muted}>Loading...</Text>
          ) : (
            <View style={styles.vaultGrid}>
              {vaults.map((vault) => (
                <View key={vault.id} style={styles.vaultCell}>
                  <VaultCard vault={vault} onEdit={editVault} onDelete={askDeleteVault} onSetDefault={setDefaultVault} />
                </View>
              ))}
            </View>
          ))}
      </View>
    </>
  );

  const renderSectionHeader = ({ section }: { section: Section }): React.JSX.Element =>
    section.key === 'quests' ? (
      <View style={styles.section}>
        <SectionHeader icon="Repeat" title="Recurring Quests" tone="secondary" open={open.quests} onToggle={() => toggle('quests')} onAdd={() => setSheet({ kind: 'quest' })} />
        {open.quests && loading && <Text style={styles.muted}>Loading...</Text>}
      </View>
    ) : (
      <View style={styles.section}>
        <SectionHeader icon="Tag" title="Tags" tone="tertiary" open={open.tags} onToggle={() => toggle('tags')} onAdd={() => setSheet({ kind: 'tag' })} />
        {open.tags &&
          (loading ? (
            <Text style={styles.muted}>Loading...</Text>
          ) : (
            <View>
              <Input placeholder="Search tags..." value={tagSearch} onChangeText={setTagSearch} accessibilityLabel="Search tags" style={styles.searchInput} />
              <View style={styles.searchGlyph} pointerEvents="none">
                <PixelIcon name="Search" size={ms(18)} />
              </View>
            </View>
          ))}
        {open.tags && !loading && filteredTags.length === 0 && <Text style={styles.muted}>No tags found.</Text>}
      </View>
    );

  return (
    <View style={styles.screen}>
      <AppBar />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Spacer}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
      />

      {sheet?.kind === 'avatar' && <AvatarPickerModal currentAvatar={avatar} onSelect={setDraftAvatar} onClose={closeSheet} />}
      {sheet?.kind === 'vault' && <VaultFormSheet vault={sheet.vault} onSave={(input) => saveVault(input, sheet.vault?.id)} onClose={closeSheet} />}
      {sheet?.kind === 'deleteVault' && <DeleteVaultSheet vaultName={sheet.vault.name} onDelete={() => deleteVault(sheet.vault.id)} onClose={closeSheet} />}
      {sheet?.kind === 'quest' && (
        <RecurringQuestSheet quest={sheet.quest} tags={tags} vaults={vaults} onSave={(input) => saveQuest(input, sheet.quest?.id)} onCreateTag={createTagForQuest} onClose={closeSheet} />
      )}
      {sheet?.kind === 'deleteQuest' && (
        <ConfirmDeleteSheet
          title="Delete Quest"
          before="Are you sure you want to delete the recurring quest "
          name={sheet.quest.title || ''}
          after="? This action cannot be undone."
          onConfirm={() => deleteQuest(sheet.quest.id)}
          onClose={closeSheet}
        />
      )}
      {sheet?.kind === 'tag' && <TagFormSheet tag={sheet.tag} onSave={(input) => saveTag(input, sheet.tag?.id)} onClose={closeSheet} />}
      {sheet?.kind === 'deleteTag' && (
        <ConfirmDeleteSheet
          title="Delete Tag"
          before="Are you sure you want to delete the tag "
          name={sheet.tag.name}
          after="? Transactions using this tag will keep the tag data, but it will be removed from your list of available tags."
          onConfirm={() => deleteTag(sheet.tag.id)}
          onClose={closeSheet}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: ms(gutter), paddingBottom: ms(space[8]) },
  section: { gap: ms(space[3]), marginTop: ms(space[4]), marginBottom: ms(space[3]) },
  spacer: { height: ms(space[3]) },
  muted: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant },
  profileCard: { gap: ms(space[5]), padding: ms(space[6]), backgroundColor: color.surfaceLow, borderColor: color.secondaryContainer, boxShadow: shadow.toggleActive },
  avatarWrap: { width: ms(96), height: ms(96), borderWidth: ms(4), borderColor: color.border },
  avatar: { width: '100%', height: '100%' },
  avatarEdit: {
    position: 'absolute',
    right: ms(-8),
    bottom: ms(-8),
    width: ms(32),
    height: ms(32),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.primary,
    borderWidth: ms(4),
    borderColor: color.border,
  },
  vaultGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: ms(-space[2]) },
  vaultCell: { width: '50%', padding: ms(space[2]) },
  searchInput: { paddingLeft: ms(36) },
  searchGlyph: { position: 'absolute', left: ms(space[3]), bottom: ms(12) },
});
