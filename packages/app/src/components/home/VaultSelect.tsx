import type { VaultDto } from '@expense-tracker/shared';
import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { iconGlyph } from '../../lib/iconMapper';
import { color, font, text } from '../../theme';
import { Dropdown } from '../Dropdown';

export interface VaultSelectProps {
  vaults: VaultDto[];
  value: string | null;
  onChange: (vaultId: string | null) => void;
  /** Adds a "No vault" option, as the web edit sheet has. */
  allowNone?: boolean;
}

// Source vault picker from the web log and edit sheets.
export function VaultSelect({ vaults, value, onChange, allowNone = false }: VaultSelectProps) {
  const selected = vaults.find((v) => v.id === value) ?? null;
  const options: (VaultDto | null)[] = allowNone ? [null, ...vaults] : vaults;

  return (
    <Dropdown<VaultDto | null>
      accessibilityLabel="Select vault"
      options={options}
      value={selected}
      onChange={(v) => onChange(v?.id ?? null)}
      keyExtractor={(v) => v?.id ?? 'none'}
      renderValue={(v) => (
        <>
          {v ? <Text style={styles.glyph}>{iconGlyph(v.icon || 'Briefcase')}</Text> : null}
          <Text style={styles.value}>{v?.name ?? (allowNone ? 'No vault' : 'Select vault')}</Text>
        </>
      )}
      renderOption={(v, isSelected) => (
        <>
          <View style={styles.optionRow}>
            {v ? <Text style={styles.glyph}>{iconGlyph(v.icon || 'Briefcase')}</Text> : null}
            <Text style={[styles.option, isSelected && styles.optionSelected]}>{v?.name ?? 'No vault'}</Text>
          </View>
          {isSelected && v ? <View style={styles.marker} /> : null}
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  glyph: { fontSize: ms(18) },
  value: { fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize), color: color.primary },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: ms(12) },
  option: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), color: color.onSurface, textTransform: 'uppercase' },
  optionSelected: { fontFamily: font.bodyBold, color: color.primary },
  marker: { width: ms(16), height: ms(16), backgroundColor: color.primary, borderWidth: ms(2), borderColor: color.border },
});
