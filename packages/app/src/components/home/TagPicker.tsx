import type { TagDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { useLocalUserId } from '../../hooks/DatabaseProvider';
import { toPixelIcon } from '../../lib/iconMapper';
import { logger, tagsService } from '../../services';
import { color, font, shadow, space } from '../../theme';
import { Input } from '../Input';
import { PixelIcon } from '../PixelIcon';

export interface TagPickerProps {
  tags: TagDto[];
  selected: TagDto[];
  onChange: (selected: TagDto[]) => void;
  /** The log sheet stores new tag names in upper case, the edit sheet keeps them as typed. */
  uppercase?: boolean;
}

// Selected chips, search input, top 3 suggestions and "CREATE:" chip, shared by the log and edit sheets on the web.
export function TagPicker({ tags, selected, onChange, uppercase = false }: TagPickerProps) {
  const userId = useLocalUserId();
  const [available, setAvailable] = useState(tags);
  const [input, setInput] = useState('');

  const typed = uppercase ? input.trim().toUpperCase() : input.trim();
  const suggestions = available.filter((tag) => !selected.some((t) => t.id === tag.id) && tag.name.toLowerCase().includes(input.toLowerCase())).slice(0, 3);
  const sameName = (t: TagDto): boolean => t.name.toLowerCase() === typed.toLowerCase();
  const showCreate = typed !== '' && !suggestions.some(sameName) && !selected.some(sameName);

  const toggle = (tag: TagDto): void => {
    if (selected.some((t) => t.id === tag.id)) {
      onChange(selected.filter((t) => t.id !== tag.id));
    } else {
      onChange([...selected, tag]);
      setInput('');
    }
  };

  const submit = async (): Promise<void> => {
    if (!typed || selected.some((t) => t.name === typed)) return;
    const existing = available.find((t) => t.name === typed);
    if (existing) return toggle(existing);
    try {
      const created = await tagsService.create(userId, { name: typed });
      setAvailable([...available, created]);
      onChange([...selected, created]);
      setInput('');
    } catch (err) {
      logger.error('Create tag failed', { err });
    }
  };

  return (
    <View>
      {selected.length > 0 && (
        <View style={styles.chips}>
          {selected.map((tag) => (
            <Pressable
              key={tag.id}
              accessibilityRole="button"
              accessibilityLabel={`Remove tag ${tag.name}`}
              onPress={() => toggle(tag)}
              style={({ pressed }) => [styles.selectedChip, { backgroundColor: tag.backgroundColor ?? color.outline }, pressed && styles.pressed]}
            >
              <PixelIcon name={toPixelIcon(tag.icon || 'Hash')} />
              <Text style={styles.selectedText}>{tag.name}</Text>
              <PixelIcon name="X" size={ms(12)} />
            </Pressable>
          ))}
        </View>
      )}

      <Input
        placeholder="Search or create tag..."
        value={input}
        onChangeText={setInput}
        onSubmitEditing={submit}
        submitBehavior="submit"
        returnKeyType="done"
        autoCapitalize={uppercase ? 'characters' : 'none'}
      />

      {suggestions.length > 0 && (
        <View style={[styles.chips, styles.below]}>
          {suggestions.map((tag) => {
            const tint = tag.backgroundColor ?? color.outline;
            return (
              <Pressable
                key={tag.id}
                accessibilityRole="button"
                accessibilityLabel={`Add tag ${tag.name}`}
                onPress={() => toggle(tag)}
                style={({ pressed }) => [styles.suggestion, { backgroundColor: `${tint}20`, borderColor: tint }, pressed && styles.pressed]}
              >
                <PixelIcon name={toPixelIcon(tag.icon || 'Hash')} />
                <Text style={[styles.suggestionText, { color: tint }]}>{tag.name}</Text>
                <PixelIcon name="Plus" size={ms(12)} />
              </Pressable>
            );
          })}
        </View>
      )}

      {showCreate && (
        <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.create, pressed && styles.pressed]}>
          <Text style={styles.createText}>CREATE: {typed} +</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[2]), marginBottom: ms(space[3]) },
  below: { marginTop: ms(space[3]), marginBottom: 0 },
  pressed: { transform: [{ translateY: 2 }] },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(space[1]),
    borderWidth: ms(4),
    borderColor: color.border,
    paddingHorizontal: ms(space[2]),
    paddingVertical: ms(space[1]),
    boxShadow: shadow.coin,
  },
  selectedText: { fontFamily: font.mono, fontSize: ms(12), color: color.onSurface },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: ms(space[1]), borderWidth: ms(4), paddingHorizontal: ms(space[2]), paddingVertical: ms(space[1]) },
  suggestionText: { fontFamily: font.mono, fontSize: ms(12) },
  create: {
    alignSelf: 'flex-start',
    marginTop: ms(space[3]),
    backgroundColor: color.surfaceHighest,
    borderWidth: ms(4),
    borderColor: color.border,
    paddingHorizontal: ms(space[3]),
    paddingVertical: ms(space[1]),
  },
  createText: { fontFamily: font.mono, fontSize: ms(12), color: color.primary },
});
