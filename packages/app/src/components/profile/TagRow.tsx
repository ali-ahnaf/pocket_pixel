import type { TagDto } from '@expense-tracker/shared';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { iconGlyph } from '../../lib/iconMapper';
import { color, font, space, text } from '../../theme';
import { Card } from '../Card';
import { safeColor } from './ColorPicker';

export interface TagRowProps {
  tag: TagDto;
  onEdit: (tag: TagDto) => void;
  onDelete: (tag: TagDto) => void;
}

// One tag row of the profile Tags list.
export const TagRow = memo(function TagRow({ tag, onEdit, onDelete }: TagRowProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: safeColor(tag.backgroundColor) }]}>
          <Text style={styles.iconGlyph}>{iconGlyph(tag.icon || 'Tag')}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {tag.name}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${tag.name}`} hitSlop={10} onPress={() => onEdit(tag)} style={({ pressed }) => [styles.action, pressed && styles.editPressed]}>
          <Text style={styles.editGlyph}>✎</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${tag.name}`}
          hitSlop={10}
          onPress={() => onDelete(tag)}
          style={({ pressed }) => [styles.action, pressed && styles.deletePressed]}
        >
          <Text style={styles.deleteGlyph}>🗑</Text>
        </Pressable>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ms(space[2]), padding: ms(space[3]), borderColor: color.outlineVariant },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  iconBox: { width: ms(32), height: ms(32), alignItems: 'center', justifyContent: 'center', borderWidth: ms(2), borderColor: color.border },
  iconGlyph: { fontSize: ms(16) },
  name: { flex: 1, fontFamily: font.heading, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurface },
  actions: { flexDirection: 'row', gap: ms(space[1]) },
  action: { padding: ms(space[1]), borderWidth: ms(2), borderColor: 'transparent' },
  editPressed: { backgroundColor: color.surfaceHighest, borderColor: color.border },
  deletePressed: { backgroundColor: color.errorContainer, borderColor: color.error },
  editGlyph: { fontFamily: font.bodyBold, fontSize: ms(16), color: color.onSurface },
  deleteGlyph: { fontSize: ms(16), color: color.error },
});
