import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, space } from '@/theme/theme';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** Forces the focused look, e.g. for the UI kit demo. */
  focused?: boolean;
};

export function TextField({ label, focused: forceFocused, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, (focused || forceFocused) && styles.inputFocused]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.xs2 },
  label: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: space.md,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.text },
});
