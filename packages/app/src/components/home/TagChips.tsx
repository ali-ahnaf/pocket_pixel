import type { TagDto } from '@expense-tracker/shared';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space } from '../../theme';

// Small dashed name chips under a drop title, ported from the TagChips helper in packages/ui/src/app/page.tsx.
export function TagChips({ tags, muted = false }: { tags: TagDto[]; muted?: boolean }) {
  if (!tags.length) return null;
  return (
    <View style={[styles.row, muted && styles.muted]}>
      {tags.map((tag) => (
        <Text key={tag.id} style={styles.chip} numberOfLines={1}>
          {tag.name}
        </Text>
      ))}
    </View>
  );
}

// Vault name chip shown under the tags.
export function VaultChip({ name, dashed = false }: { name: string; dashed?: boolean }) {
  return (
    <Text style={[styles.vault, dashed && styles.vaultDashed]} numberOfLines={1}>
      {name}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: ms(space[1]), marginTop: ms(2) },
  muted: { opacity: 0.7 },
  chip: {
    fontFamily: font.mono,
    fontSize: ms(9),
    lineHeight: ms(11),
    textTransform: 'uppercase',
    color: color.onSurface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.outline,
    paddingHorizontal: ms(space[1]),
    paddingVertical: ms(2),
  },
  vault: {
    alignSelf: 'flex-start',
    marginTop: ms(2),
    fontFamily: font.mono,
    fontSize: ms(9),
    lineHeight: ms(11),
    textTransform: 'uppercase',
    color: color.outline,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: ms(space[1]),
    paddingVertical: ms(2),
  },
  vaultDashed: { borderStyle: 'dashed', borderColor: color.outline },
});
