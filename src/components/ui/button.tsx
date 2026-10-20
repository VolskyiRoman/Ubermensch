import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, sizes, space } from '@/theme/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'text';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: ButtonVariant;
  /** Forces the pressed look, e.g. for the UI kit demo. */
  pressed?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', disabled, pressed: forcePressed, style, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        containerStyles[variant],
        (pressed || forcePressed) && pressedStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <Text style={[labelStyles[variant], disabled && styles.disabledLabel]}>{title}</Text>
    </Pressable>
  );
}

type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  accessibilityLabel: string;
  variant?: 'accent' | 'outline';
  children: ReactNode;
};

export function IconButton({ variant = 'accent', children, ...rest }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={variant === 'outline' ? 2 : 0}
      style={({ pressed }) => [
        styles.icon,
        variant === 'accent' ? styles.iconAccent : styles.iconOutline,
        pressed && (variant === 'accent' ? pressedStyles.primary : pressedStyles.secondary),
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.touch,
    borderRadius: radius.button,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: colors.track,
    borderWidth: 0,
    borderRadius: radius.input,
  },
  disabledLabel: {
    fontSize: 14,
    color: colors.textDisabled,
  },
  icon: {
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAccent: {
    width: sizes.touch,
    height: sizes.touch,
    backgroundColor: colors.accent,
  },
  iconOutline: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

const containerStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accent, paddingVertical: space.md2 },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.text, paddingVertical: space.md2 },
  dark: { backgroundColor: colors.text, paddingVertical: space.md2 },
  text: { backgroundColor: 'transparent', paddingHorizontal: space.xs2, alignSelf: 'flex-start' },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.accentPressed },
  secondary: { backgroundColor: colors.divider },
  dark: { opacity: 0.85 },
  text: { opacity: 0.6 },
});

const labelStyles = StyleSheet.create({
  primary: { fontFamily: fonts.bold, fontSize: 16, color: colors.onAccent },
  secondary: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  dark: { fontFamily: fonts.bold, fontSize: 15, color: colors.onAccent },
  text: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent },
});
