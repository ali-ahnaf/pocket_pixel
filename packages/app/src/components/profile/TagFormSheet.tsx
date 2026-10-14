import type { CreateTagInput, TagDto } from '@expense-tracker/shared';
import { useState } from 'react';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { Input } from '../Input';
import { ColorPicker, DEFAULT_COLOR } from './ColorPicker';
import { IconPicker } from './IconPicker';
import { SheetBody } from './SheetBody';
import { SheetFooter } from './SheetFooter';
import { SheetHeader } from '../SheetHeader';

export interface TagFormSheetProps {
  /** The tag to edit, or undefined to create one. */
  tag?: TagDto;
  onSave: (input: CreateTagInput) => void;
  onClose: () => void;
}

// Ported from packages/ui/src/components/AddTagModal.tsx. Mount to open.
export function TagFormSheet({ tag, onSave, onClose }: TagFormSheetProps) {
  const [name, setName] = useState(tag?.name ?? '');
  const [hex, setHex] = useState(tag?.backgroundColor || DEFAULT_COLOR);
  const [icon, setIcon] = useState(tag?.icon || 'Tag');
  const isEditing = !!tag;

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader icon={isEditing ? 'Pencil' : 'Plus'} title={isEditing ? 'Edit Tag' : 'Create New Tag'} onClose={close} />
          <SheetBody>
            <Input label="Name" placeholder="e.g. Groceries" value={name} onChangeText={setName} />
            <ColorPicker value={hex} onChange={setHex} />
            <IconPicker value={icon} onChange={setIcon} />
            <Button
              label={isEditing ? 'Save Changes' : 'Create Tag'}
              size="lg"
              onPress={() => {
                onSave({ name, icon, backgroundColor: hex });
                close();
              }}
            />
            <SheetFooter label={isEditing ? 'EDIT_TAG_INTERFACE' : 'NEW_TAG_INTERFACE'} />
          </SheetBody>
        </>
      )}
    </BottomSheetModal>
  );
}
