import { type ReactNode, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { color, shadow, space } from '../theme';

// Left drawer, ported from packages/ui/src/components/Sidebar.tsx. Same contract as BottomSheetModal:
// mount to open, unmount in onClose, children gets close() so in-drawer buttons animate out too.
export function SidebarModal({ onClose, children }: { onClose: () => void; children: (close: () => void) => ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Web: w-72 max-w-[85vw].
  const [panelW] = useState(() => Math.min(ms(288), width * 0.85));
  const [progress] = useState(() => new Animated.Value(0));
  const [translateX] = useState(() => Animated.multiply(Animated.subtract(progress, 1), panelW));

  // Starts on layout, not mount: the native modal is presented by then.
  const open = () => {
    Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  const close = () => {
    Animated.timing(progress, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => onClose());
  };

  return (
    <Modal transparent animationType="none" visible onRequestClose={close}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close menu" onPress={close} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View onLayout={open} style={[styles.panel, { width: panelW, paddingTop: insets.top, transform: [{ translateX }] }]}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: ms(space[4]) + insets.bottom }]}>{children(close)}</ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: color.overlay },
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: color.surfaceHigh, borderRightWidth: ms(4), borderColor: color.border, boxShadow: shadow.coin },
  content: { flexGrow: 1, paddingHorizontal: ms(space[4]), paddingTop: ms(space[4]), gap: ms(space[2]) },
});
