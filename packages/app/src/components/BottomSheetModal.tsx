import { type ReactNode, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, type LayoutChangeEvent, Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { color, space } from '../theme';

// Mount to open, unmount in onClose. children gets close() so in-sheet buttons animate out too.
export function BottomSheetModal({ onClose, children }: { onClose: () => void; children: (close: () => void) => ReactNode }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  // Height lives in an Animated.Value, not state: a re-render mid-animation swaps the native node and jumps the sheet.
  const [sheetH] = useState(() => new Animated.Value(height));
  const [translateY] = useState(() => Animated.multiply(Animated.subtract(1, progress), sheetH));

  // Starts on layout, not mount: the native modal is presented and the sheet height is known by then.
  const open = (e: LayoutChangeEvent) => {
    sheetH.setValue(e.nativeEvent.layout.height);
    Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  const close = () => {
    Animated.timing(progress, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => onClose());
  };

  return (
    <Modal transparent animationType="none" visible onRequestClose={close}>
      <KeyboardAvoidingView behavior="padding" style={[styles.root, { paddingTop: insets.top }]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View onLayout={open} style={[styles.sheet, { paddingBottom: ms(space[6]) + insets.bottom, transform: [{ translateY }] }]}>
          <View style={styles.grabber} />
          {children(close)}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { backgroundColor: color.overlay },
  sheet: { maxHeight: '100%', backgroundColor: color.surfaceHigh, borderTopWidth: ms(4), borderColor: color.border, paddingHorizontal: ms(space[6]), paddingTop: ms(space[3]), gap: ms(space[3]) },
  grabber: { alignSelf: 'center', width: ms(36), height: ms(4), backgroundColor: color.outline, marginBottom: ms(space[1]) },
});
