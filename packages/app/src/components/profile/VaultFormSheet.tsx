import type { CreateVaultInput, VaultDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { ms } from 'react-native-size-matters';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Input } from '../Input';
import { ColorPicker, DEFAULT_COLOR } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { SheetBody } from './SheetBody';
import { SheetFooter } from './SheetFooter';
import { SheetHeader } from '../SheetHeader';

export interface VaultFormSheetProps {
  /** The vault to edit, or undefined to create one. */
  vault?: VaultDto;
  onSave: (input: CreateVaultInput) => void;
  onClose: () => void;
}

// Ported from packages/ui/src/components/AddVaultModal.tsx. Mount to open.
export function VaultFormSheet({ vault, onSave, onClose }: VaultFormSheetProps) {
  const [name, setName] = useState(vault?.name ?? '');
  const [description, setDescription] = useState(vault?.description ?? '');
  const [hex, setHex] = useState(vault?.backgroundColor || DEFAULT_COLOR);
  const [icon, setIcon] = useState(vault?.icon || 'Briefcase');
  const [budget, setBudget] = useState(vault?.monthlyBudget != null ? String(vault.monthlyBudget) : '');
  const isEditing = !!vault;

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader icon={isEditing ? 'Pencil' : 'Plus'} title={isEditing ? 'Edit Vault' : 'Create New Vault'} onClose={close} />
          <SheetBody>
            <Input label="Name" placeholder="e.g. Secret Stash" value={name} onChangeText={setName} />
            <ColorPicker value={hex} onChange={setHex} />
            <IconPicker value={icon} onChange={setIcon} />
            <Input label="Monthly budget (optional)" placeholder="e.g. 500" keyboardType="decimal-pad" value={budget} onChangeText={setBudget} />
            <Input label="Description" placeholder="What is this vault for?" multiline value={description} onChangeText={setDescription} style={styles.textarea} />
            <Button
              label={isEditing ? 'Save Changes' : 'Create Record'}
              size="lg"
              onPress={() => {
                const parsedBudget = budget.trim() === '' ? null : Number(budget);
                if (parsedBudget !== null && (isNaN(parsedBudget) || parsedBudget < 0)) return;
                onSave({ name, description, icon, backgroundColor: hex, monthlyBudget: parsedBudget });
                close();
              }}
            />
            <SheetFooter label={isEditing ? 'EDIT_RECORD_INTERFACE' : 'NEW_RECORD_INTERFACE'} />
          </SheetBody>
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  textarea: { minHeight: ms(120), textAlignVertical: 'top' },
});
