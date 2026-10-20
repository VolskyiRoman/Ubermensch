import { Text, type TextProps } from 'react-native';

import { colors, type } from '@/theme/theme';

export type TextVariant = keyof typeof type;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
};

export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  return <Text style={[{ color: colors.text }, type[variant], color ? { color } : null, style]} {...rest} />;
}
