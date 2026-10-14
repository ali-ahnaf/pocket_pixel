import { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { ms } from 'react-native-size-matters';
import { space } from '../../theme';

// BottomSheetModal does not scroll, so long forms scroll inside a body capped below the screen height.
export function SheetBody({ children }: { children: ReactNode }) {
  const { height } = useWindowDimensions();
  return (
    <ScrollView style={{ maxHeight: height * 0.7 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: ms(space[5]), paddingBottom: ms(space[2]) },
});
