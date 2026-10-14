import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { Input } from '../Input';
import { StatusNote } from './StatusNote';
import { PixelIcon } from '../PixelIcon';

/** Shape of an OpenRouter model as the web's lib/ai/openrouter.ts returns it. Not an API DTO. */
export interface OpenRouterModel {
  readonly id: string;
  readonly name: string;
}

export interface ModelPickerProps {
  /** Already the curated list; the web filters OpenRouter's live list down to it first. */
  models: readonly OpenRouterModel[];
  loading: boolean;
  error: string | null;
  selectedModel: string | null;
  saving: boolean;
  onSelect: (modelId: string) => void;
}

export function ModelPicker({ models, loading, error, selectedModel, saving, onSelect }: ModelPickerProps) {
  const [search, setSearch] = useState('');

  const visibleModels = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return models;
    return models.filter((model) => model.id.toLowerCase().includes(query) || model.name.toLowerCase().includes(query));
  }, [models, search]);

  if (loading) return <Text style={styles.hint}>Loading models…</Text>;
  if (error) return <StatusNote tone="error" label={error} />;

  return (
    <View style={styles.wrapper}>
      <Input placeholder="Search curated models…" value={search} onChangeText={setSearch} autoComplete="off" autoCapitalize="none" autoCorrect={false} accessibilityLabel="Search curated models" />

      {visibleModels.length === 0 ? (
        <Text style={styles.hint}>No curated models match your search.</Text>
      ) : (
        <View style={styles.list}>
          {visibleModels.map((model) => {
            const isSelected = model.id === selectedModel;
            return (
              <Pressable
                key={model.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: saving }}
                disabled={saving}
                onPress={() => onSelect(model.id)}
                style={({ pressed }) => [styles.option, isSelected ? styles.optionSelected : pressed && styles.optionPressed, saving && styles.disabled]}
              >
                <View style={styles.optionTexts}>
                  <Text numberOfLines={1} style={[styles.name, isSelected && styles.selectedText]}>
                    {model.name}
                  </Text>
                  <Text numberOfLines={1} style={[styles.id, isSelected && styles.selectedText]}>
                    {model.id}
                  </Text>
                </View>
                {isSelected && <PixelIcon name="Check" size={ms(18)} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: ms(space[3]) },
  hint: { fontFamily: font.body, fontSize: ms(12), lineHeight: ms(16), color: color.onSurfaceVariant },
  list: { gap: ms(space[2]) },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(space[3]),
    padding: ms(space[3]),
    borderWidth: ms(4),
    borderColor: color.border,
    backgroundColor: color.bg,
  },
  optionSelected: { backgroundColor: color.primary },
  optionPressed: { backgroundColor: color.surfaceHighest, transform: [{ translateY: 2 }] },
  disabled: { opacity: 0.6 },
  optionTexts: { flex: 1, minWidth: 0 },
  name: { fontFamily: font.bodyBold, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
  id: { fontFamily: font.mono, fontSize: ms(11), lineHeight: ms(14), color: color.onSurface, opacity: 0.8 },
  selectedText: { color: color.onPrimary },
});
