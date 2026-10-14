import { StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { BottomSheetModal } from '../BottomSheetModal';
import { Button } from '../Button';
import { SheetFooter } from './SheetFooter';
import { SheetHeader } from '../SheetHeader';

export interface ConfirmDeleteSheetProps {
  title: string;
  /** Message split around the quoted, highlighted name. */
  before: string;
  name: string;
  after: string;
  onConfirm: () => void;
  onClose: () => void;
}

// Ported from packages/ui/src/components/DeleteTagModal.tsx and DeleteQuestModal.tsx, which differ only in copy.
export function ConfirmDeleteSheet({ title, before, name, after, onConfirm, onClose }: ConfirmDeleteSheetProps) {
  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <SheetHeader icon="TriangleAlert" title={title} danger onClose={close} />
          <Text style={styles.message}>
            {before}
            <Text style={styles.name}>&quot;{name}&quot;</Text>
            {after}
          </Text>
          <View style={styles.actions}>
            <Button label="Cancel" variant="ghost" size="lg" onPress={close} style={styles.action} />
            <Button
              label="Delete"
              variant="danger"
              size="lg"
              onPress={() => {
                onConfirm();
                close();
              }}
              style={styles.action}
            />
          </View>
          <SheetFooter label="DANGER_ZONE_INTERFACE" danger />
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  message: { fontFamily: font.body, fontSize: ms(text.bodyLg.fontSize), lineHeight: ms(text.bodyLg.lineHeight), color: color.onSurfaceVariant },
  name: { fontFamily: font.bodyBold, color: color.onSurface },
  actions: { flexDirection: 'row', gap: ms(space[4]), paddingTop: ms(space[2]) },
  action: { flex: 1 },
});
