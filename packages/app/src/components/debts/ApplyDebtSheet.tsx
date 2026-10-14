import type { DebtDto, VaultDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { formatCurrency } from '../../lib/formatters';
import { toPixelIcon } from '../../lib/iconMapper';
import { color, font, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Dropdown } from '../Dropdown';
import { SheetHeader } from '../SheetHeader';
import { PixelIcon } from '../PixelIcon';

export interface ApplyDebtSheetProps {
  debt: DebtDto;
  vaults: VaultDto[];
  onConfirm: (vaultId: string | null, skipTransaction: boolean) => Promise<void>;
  onClose: () => void;
}

// Ported from packages/ui/src/components/ApplyDebtModal.tsx. The selected vault lives here instead of in the page.
export function ApplyDebtSheet({ debt, vaults, onConfirm, onClose }: ApplyDebtSheetProps) {
  const [vaultId, setVaultId] = useState((vaults.find((v) => v.isDefault) ?? vaults[0])?.id ?? '');
  const [skipTransaction, setSkipTransaction] = useState(false);
  const [applying, setApplying] = useState(false);

  const selectedVault = vaults.find((v) => v.id === vaultId) ?? vaults[0];

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => {
        const handleClose = (): void => {
          if (!applying) close();
        };
        const handleConfirm = (): void => {
          setApplying(true);
          onConfirm(vaultId || null, skipTransaction)
            .then(close)
            .catch(() => setApplying(false));
        };

        return (
          <>
            <SheetHeader title="Apply Due" icon="Check" onClose={handleClose} />

            <Text style={styles.body}>
              Confirm will create a {debt.type} of <Text style={styles.strong}>{formatCurrency(debt.amount)}</Text> for <Text style={styles.strong}>{debt.title}</Text> in the current month and remove
              the due.
            </Text>

            <View>
              <Text style={styles.label}>Vault</Text>
              {selectedVault ? (
                <Dropdown
                  accessibilityLabel="Vault"
                  options={vaults}
                  value={selectedVault}
                  onChange={(vault) => setVaultId(vault.id)}
                  keyExtractor={(vault) => vault.id}
                  renderValue={(vault) => (
                    <>
                      <PixelIcon name={toPixelIcon(vault.icon || 'Briefcase')} size={ms(20)} />
                      <Text style={styles.vaultSelected}>{vault.name}</Text>
                    </>
                  )}
                  renderOption={(vault, isSelected) => (
                    <>
                      <View style={styles.optionRow}>
                        <PixelIcon name={toPixelIcon(vault.icon || 'Briefcase')} size={ms(20)} />
                        <Text style={isSelected ? styles.vaultSelected : styles.vaultName}>{vault.name}</Text>
                      </View>
                      {isSelected ? <View style={styles.selectedMark} /> : null}
                    </>
                  )}
                />
              ) : (
                <Text style={styles.body}>No vaults available — the expense will be unassigned.</Text>
              )}
            </View>

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: skipTransaction, disabled: applying }}
              disabled={applying}
              onPress={() => setSkipTransaction((s) => !s)}
              style={({ pressed }) => [styles.skipRow, pressed && styles.pressed, applying && styles.disabled]}
            >
              <View style={[styles.checkbox, skipTransaction && styles.checkboxOn]}>{skipTransaction ? <PixelIcon name="Check" size={ms(14)} /> : null}</View>
              <Text style={styles.skipText}>Skip transaction — clear the due without creating an {debt.type}.</Text>
            </Pressable>

            <View style={styles.actions}>
              <Button label={applying ? 'Applying...' : 'Confirm'} icon="Check" onPress={handleConfirm} disabled={applying} style={styles.action} />
              <Button label="Cancel" variant="ghost" onPress={handleClose} disabled={applying} style={styles.action} />
            </View>
          </>
        );
      }}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurfaceVariant, marginTop: ms(space[2]) },
  strong: { fontFamily: font.bodyBold, color: color.onSurface },
  label: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(text.labelCaps.lineHeight),
    color: color.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: ms(space[1]),
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]) },
  vaultSelected: { fontFamily: font.bodyBold, fontSize: ms(text.bodyLg.fontSize), color: color.primary },
  vaultName: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), color: color.onSurface },
  selectedMark: { width: ms(16), height: ms(16), backgroundColor: color.primary, borderWidth: ms(2), borderColor: color.border },
  skipRow: { flexDirection: 'row', alignItems: 'center', gap: ms(space[3]), minHeight: ms(44) },
  pressed: { transform: [{ translateY: 2 }] },
  disabled: { opacity: 0.6 },
  checkbox: { width: ms(24), height: ms(24), alignItems: 'center', justifyContent: 'center', borderWidth: ms(4), borderColor: color.border, backgroundColor: color.surfaceLowest },
  checkboxOn: { backgroundColor: color.primary },
  skipText: { flex: 1, fontFamily: font.body, fontSize: ms(text.bodySm.fontSize), lineHeight: ms(text.bodySm.lineHeight), color: color.onSurface },
  actions: { flexDirection: 'row', gap: ms(space[2]), paddingTop: ms(space[2]) },
  action: { flex: 1 },
});
