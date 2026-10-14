import type { VaultDto } from '@expense-tracker/shared';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { toPixelIcon } from '../../lib/iconMapper';
import { color, font, space, text } from '../../theme';
import { Badge } from '../Badge';
import { Card } from '../Card';
import { PixelIcon } from '../PixelIcon';
import { safeColor } from './ColorPicker';
import { IconButton } from './IconButton';

export interface VaultCardProps {
  vault: VaultDto;
  onEdit: (vault: VaultDto) => void;
  onDelete: (vault: VaultDto) => void;
  onSetDefault: (vaultId: string) => void;
}

// One vault tile of the profile Vaults grid.
export const VaultCard = memo(function VaultCard({ vault, onEdit, onDelete, onSetDefault }: VaultCardProps) {
  const edit = <IconButton icon="Pencil" label={`Edit ${vault.name}`} onPress={() => onEdit(vault)} />;

  return (
    <Card style={[styles.card, vault.isDefault && styles.cardDefault]}>
      <View style={styles.top}>
        <View style={styles.nameRow}>
          <View style={[styles.iconBox, { backgroundColor: safeColor(vault.backgroundColor) }]}>
            <PixelIcon name={toPixelIcon(vault.icon || 'Briefcase')} size={ms(20)} />
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {vault.name}
          </Text>
        </View>
        {vault.isDefault && <Badge label="Default" variant="primary" />}
        <Text style={styles.description}>{vault.description}</Text>
      </View>

      {vault.isDefault ? (
        <View style={styles.actionsEnd}>{edit}</View>
      ) : (
        <View style={styles.actionsBetween}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Set ${vault.name} as default`} hitSlop={10} onPress={() => onSetDefault(vault.id)}>
            <PixelIcon name="Star" size={ms(22)} />
          </Pressable>
          <View style={styles.buttons}>
            {edit}
            <IconButton icon="Trash" label={`Delete ${vault.name}`} variant="danger" onPress={() => onDelete(vault)} />
          </View>
        </View>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { flex: 1, padding: ms(space[2]), justifyContent: 'space-between', borderColor: color.outlineVariant },
  cardDefault: { borderColor: color.primary },
  top: { gap: ms(space[2]) },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[2]) },
  iconBox: { width: ms(32), height: ms(32), alignItems: 'center', justifyContent: 'center', borderWidth: ms(2), borderColor: color.border },
  name: { flex: 1, fontFamily: font.heading, fontSize: ms(18), lineHeight: ms(22), color: color.onSurface },
  description: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant, marginBottom: ms(space[2]) },
  actionsEnd: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: ms(space[2]) },
  actionsBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: ms(space[2]) },
  buttons: { flexDirection: 'row', gap: ms(space[2]) },
});
