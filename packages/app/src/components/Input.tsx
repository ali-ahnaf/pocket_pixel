import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { color, font, shadow, space, text } from '../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={color.outline}
        selectionColor={color.primary}
        style={[styles.input, focused && styles.focused, !!error && styles.errored, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(text.labelCaps.lineHeight),
    color: color.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: ms(space[1]),
  },
  input: {
    minHeight: ms(44),
    backgroundColor: color.surfaceLowest,
    color: color.onSurface,
    borderWidth: ms(4),
    borderColor: color.border,
    fontFamily: font.body,
    fontSize: ms(text.bodyLg.fontSize),
    paddingHorizontal: ms(space[3]),
    paddingVertical: ms(space[2]),
    boxShadow: shadow.input,
  },
  focused: { borderColor: color.primary },
  errored: { borderColor: color.error },
  error: {
    fontFamily: font.mono,
    fontSize: ms(text.labelCaps.fontSize),
    lineHeight: ms(text.labelCaps.lineHeight),
    color: color.error,
    textTransform: 'uppercase',
    marginTop: ms(space[1]),
  },
});
