import type { CreateRecurringInput, RecurrenceInterval, RecurringDto, TagDto, VaultDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { toIsoDate } from '../../lib/formatters';
import { toPixelIcon } from '../../lib/iconMapper';
import { color, font, shadow, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Dropdown } from '../Dropdown';
import { Input } from '../Input';
import { PixelDatePicker } from '../PixelDatePicker';
import { TransactionTypeToggle } from '../TransactionTypeToggle';
import { SheetBody } from './SheetBody';
import { SheetFooter } from './SheetFooter';
import { SheetHeader } from '../SheetHeader';
import { PixelIcon } from '../PixelIcon';

const INTERVALS: RecurrenceInterval[] = ['daily', 'weekly', 'monthly', 'yearly'];

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const defaultEndDate = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return toIsoDate(d);
};

export interface RecurringQuestSheetProps {
  /** The quest to edit, or undefined to create one. */
  quest?: RecurringDto;
  tags: TagDto[];
  vaults: VaultDto[];
  onSave: (input: CreateRecurringInput) => void;
  onCreateTag: (name: string) => Promise<TagDto | null>;
  onClose: () => void;
}

// Ported from packages/ui/src/components/AddRecurringQuestModal.tsx. Mount to open.
export function RecurringQuestSheet({ quest, tags, vaults, onSave, onCreateTag, onClose }: RecurringQuestSheetProps) {
  const [name, setName] = useState(quest?.title ?? '');
  const [amount, setAmount] = useState(quest ? String(quest.amount) : '');
  const [isExpense, setIsExpense] = useState(quest ? quest.type === 'expense' : true);
  const [startDate, setStartDate] = useState(quest?.startDate?.slice(0, 10) || toIsoDate(new Date()));
  const [endDate, setEndDate] = useState(quest?.endDate?.slice(0, 10) || defaultEndDate());
  const [tagInput, setTagInput] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(quest?.tagIds ?? []);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [vaultId, setVaultId] = useState(quest?.vaultId ?? '');
  const [selectedInterval, setSelectedInterval] = useState<RecurrenceInterval>(quest?.interval ?? 'monthly');

  const selectedVault = vaults.find((v) => v.id === vaultId) ?? vaults[0];
  const tagInputUpper = tagInput.trim().toUpperCase();
  const suggestions = tags
    .filter((t) => !selectedTagIds.includes(t.id))
    .filter((t) => tagInputUpper.length === 0 || t.name.toUpperCase().includes(tagInputUpper))
    .slice(0, 3);
  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
  const canCreateTag = tagInputUpper.length > 0 && !tags.some((t) => t.name.toUpperCase() === tagInputUpper) && !isCreatingTag;

  const toggleTag = (tagId: string): void => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]));
    setTagInput('');
  };

  const createTag = async (): Promise<void> => {
    if (!tagInput.trim() || isCreatingTag) return;
    setIsCreatingTag(true);
    const newTag = await onCreateTag(tagInput.trim());
    if (newTag) {
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      setTagInput('');
    }
    setIsCreatingTag(false);
  };

  // Web Enter key: pick the exact match, otherwise create the tag.
  const submitTag = (): void => {
    if (!tagInput.trim()) return;
    const exact = tags.find((t) => t.name.toUpperCase() === tagInputUpper);
    if (exact && !selectedTagIds.includes(exact.id)) toggleTag(exact.id);
    else if (!exact) createTag();
  };

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader icon="Plus" title={quest ? 'Edit Recurring Quest' : 'Add Recurring Quest'} onClose={close} />
          <SheetBody>
            <Input label="Name" placeholder="e.g. Health Potion Subscription" value={name} onChangeText={setName} />

            <View>
              <Input label="Amount" placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} style={styles.amountInput} />
              <View style={styles.coin} pointerEvents="none">
                <PixelIcon name="Coins" size={ms(24)} />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Type</Text>
              <TransactionTypeToggle isExpense={isExpense} onChange={setIsExpense} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Tags</Text>
              {selectedTags.length > 0 && (
                <View style={styles.chips}>
                  {selectedTags.map((tag) => (
                    <Pressable key={tag.id} accessibilityRole="button" accessibilityLabel={`Remove tag ${tag.name}`} onPress={() => toggleTag(tag.id)} style={[styles.chip, styles.chipSelected]}>
                      <Text style={[styles.chipText, styles.chipSelectedText]}>{tag.name.toUpperCase()}</Text>
                      <PixelIcon name="X" size={ms(12)} />
                    </Pressable>
                  ))}
                </View>
              )}
              <Input
                placeholder="Search or create tags..."
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={submitTag}
                submitBehavior="submit"
                returnKeyType="done"
                accessibilityLabel="Search or create tags"
              />
              {suggestions.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.hint}>{tagInput.length > 0 ? 'MATCHING TAGS' : 'INITIAL SUGGESTIONS'}</Text>
                  <View style={styles.chips}>
                    {suggestions.map((tag) => (
                      <Pressable key={tag.id} accessibilityRole="button" accessibilityLabel={`Add tag ${tag.name}`} onPress={() => toggleTag(tag.id)} style={styles.chip}>
                        <Text style={styles.chipText}>{tag.name.toUpperCase()}</Text>
                        <PixelIcon name="Plus" size={ms(12)} />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              {canCreateTag && (
                <Pressable accessibilityRole="button" onPress={createTag} style={[styles.chip, styles.chipCreate]}>
                  <Text style={[styles.chipText, styles.chipCreateText]}>CREATE: {tagInputUpper}</Text>
                  <PixelIcon name="Plus" size={ms(12)} />
                </Pressable>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Start date</Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateValue}>{startDate}</Text>
                <PixelDatePicker value={startDate} onChange={setStartDate} />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>End date</Text>
              <View style={styles.dateRow}>
                <Text style={styles.dateValue}>{endDate}</Text>
                <PixelDatePicker value={endDate} onChange={setEndDate} />
              </View>
            </View>

            {selectedVault && (
              <View style={styles.field}>
                <Text style={styles.label}>Source vault</Text>
                <Dropdown
                  options={vaults}
                  value={selectedVault}
                  onChange={(vault) => setVaultId(vault.id)}
                  keyExtractor={(vault) => vault.id}
                  accessibilityLabel="Source vault"
                  renderValue={(vault) => (
                    <>
                      <PixelIcon name={toPixelIcon(vault.icon || 'Briefcase')} size={ms(22)} />
                      <Text style={styles.valueText}>{vault.name}</Text>
                    </>
                  )}
                  renderOption={(vault, isSelected) => (
                    <>
                      <View style={styles.optionRow}>
                        <PixelIcon name={toPixelIcon(vault.icon || 'Briefcase')} size={ms(22)} />
                        <Text style={isSelected ? styles.valueText : styles.optionText}>{vault.name}</Text>
                      </View>
                      {isSelected && <View style={styles.selectedMark} />}
                    </>
                  )}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Interval</Text>
              <Dropdown
                options={INTERVALS}
                value={selectedInterval}
                onChange={setSelectedInterval}
                keyExtractor={(i) => i}
                accessibilityLabel="Interval"
                renderValue={(i) => (
                  <>
                    <PixelIcon name="Calendar" size={ms(22)} />
                    <Text style={styles.valueText}>{capitalize(i)}</Text>
                  </>
                )}
                renderOption={(i, isSelected) => (
                  <>
                    <Text style={isSelected ? styles.valueText : styles.optionText}>{capitalize(i)}</Text>
                    {isSelected && <View style={styles.selectedMark} />}
                  </>
                )}
              />
            </View>

            <Button
              label={quest ? 'Save Changes' : 'Create Record'}
              size="lg"
              onPress={() => {
                onSave({
                  title: name,
                  amount: parseFloat(amount) || 0,
                  type: isExpense ? 'expense' : 'income',
                  interval: selectedInterval,
                  startDate,
                  endDate: endDate || null,
                  tagIds: selectedTagIds,
                  vaultId: selectedVault?.id ?? null,
                });
                close();
              }}
            />
            <SheetFooter label="NEW_RECORD_INTERFACE" />
          </SheetBody>
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  field: { gap: ms(space[2]) },
  label: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), lineHeight: ms(text.labelCaps.lineHeight), color: color.onSurfaceVariant, textTransform: 'uppercase' },
  hint: { fontFamily: font.mono, fontSize: ms(10), color: color.outline },
  amountInput: { paddingLeft: ms(44), fontFamily: font.heading, color: color.secondary },
  coin: { position: 'absolute', left: ms(space[4]), bottom: ms(12) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[2]) },
  chip: {
    minHeight: ms(36),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ms(space[1]),
    paddingHorizontal: ms(space[3]),
    backgroundColor: color.surfaceHighest,
    borderWidth: ms(4),
    borderColor: color.border,
  },
  chipSelected: { backgroundColor: color.tertiaryContainer, boxShadow: shadow.coin },
  chipCreate: { alignSelf: 'flex-start' },
  chipText: { fontFamily: font.mono, fontSize: ms(text.labelCaps.fontSize), color: color.onSurface },
  chipSelectedText: { color: color.onTertiaryContainer },
  chipCreateText: { color: color.primary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]) },
  dateValue: {
    flex: 1,
    fontFamily: font.body,
    fontSize: ms(text.bodyLg.fontSize),
    color: color.onSurface,
    backgroundColor: color.surfaceLowest,
    borderWidth: ms(4),
    borderColor: color.border,
    paddingHorizontal: ms(space[4]),
    paddingVertical: ms(space[3]),
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]) },
  valueText: { fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize), color: color.primary },
  optionText: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), color: color.onSurface },
  selectedMark: { width: ms(16), height: ms(16), backgroundColor: color.primary, borderWidth: ms(2), borderColor: color.border },
});
