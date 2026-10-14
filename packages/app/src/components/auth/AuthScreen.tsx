import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { color, gutter, space } from '../../theme';

export interface AuthScreenProps {
  children: ReactNode;
  /** Vertically center the column, like the web auth pages. */
  centered?: boolean;
}

// Stack-screen shell shared by the auth pages: scrollable, keyboard aware, max-width column.
export function AuthScreen({ children, centered = true }: AuthScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      // Safe-area padding is applied by hand below; "automatic" would add the top inset a second time on iOS.
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={[styles.content, centered && styles.centered, { paddingTop: insets.top + ms(space[4]), paddingBottom: insets.bottom + ms(space[4]) }]}
    >
      <View style={styles.column}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  content: { flexGrow: 1, paddingHorizontal: ms(gutter) },
  centered: { justifyContent: 'center' },
  column: { width: '100%', maxWidth: ms(384), alignSelf: 'center', gap: ms(space[6]) },
});
