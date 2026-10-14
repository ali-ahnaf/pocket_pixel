import { StyleSheet, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, space, text } from '../../theme';
import { Input } from '../Input';
import { PixelIcon } from '../PixelIcon';

// Coin-prefixed number field used by the log, edit and adjust balance sheets.
export function AmountInput({ value, onChangeText, accessibilityLabel = 'Amount' }: { value: string; onChangeText: (value: string) => void; accessibilityLabel?: string }) {
  return (
    <View style={styles.wrap}>
      <Input accessibilityLabel={accessibilityLabel} placeholder="0.00" keyboardType="decimal-pad" value={value} onChangeText={onChangeText} style={styles.input} />
      <View style={styles.coin} pointerEvents="none">
        <PixelIcon name="Coins" size={ms(28)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center' },
  input: { height: ms(64), paddingLeft: ms(56), fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), color: color.secondary },
  coin: { position: 'absolute', left: ms(space[4]) },
});
