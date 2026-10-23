import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, screenPadding, sizes, space } from '@/theme/theme';

import { Button } from './button';
import { BackIcon, CloseIcon, ForwardIcon } from './icons';

type BackLinkProps = {
  label: string;
  onPress: () => void;
};

/** "← Профіль" link above a pushed screen's title. */
export function BackLink({ label, onPress }: BackLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Назад: ${label}`}
      onPress={onPress}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <BackIcon color={colors.accent} />
      <Text style={styles.backLabel}>{label}</Text>
    </Pressable>
  );
}

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  closeIcon?: ReactNode;
  right?: ReactNode;
};

/** Close button, centered title and an optional action on the right. */
export function ModalHeader({ title, onClose, closeLabel = 'Закрити', closeIcon, right }: ModalHeaderProps) {
  return (
    <View style={styles.modalHeader}>
      <OutlineIconButton accessibilityLabel={closeLabel} onPress={onClose}>
        {closeIcon ?? <CloseIcon />}
      </OutlineIconButton>
      <Text style={styles.modalTitle} accessibilityRole="header" numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.modalRight}>{right}</View>
    </View>
  );
}

type OutlineIconButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
  label?: string;
};

/** 40 px outlined square button (with a 44 px hit area), optionally with a text label. */
export function OutlineIconButton({ accessibilityLabel, onPress, children, label }: OutlineIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={2}
      style={({ pressed }) => [styles.outline, label ? styles.outlineWithLabel : null, pressed && styles.outlinePressed]}
    >
      {children}
      {label ? <Text style={styles.outlineLabel}>{label}</Text> : null}
    </Pressable>
  );
}

/** Footer with the screen's main action; place it after a flex: 1 ScrollView. */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, space.md) + space.xs }]}>{children}</View>;
}

type EmptyStateProps = {
  illustration: ReactNode;
  title: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ illustration, title, text, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.empty}>
      {illustration}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} style={styles.emptyButton} /> : null}
    </View>
  );
}

type LinkRowProps = {
  title: string;
  value?: string;
  onPress: () => void;
  divider?: boolean;
};

/** Row inside a card that opens another screen. */
export function LinkRow({ title, value, onPress, divider = false }: LinkRowProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={value ? `${title}, ${value}` : title}
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, divider && styles.divider, pressed && styles.pressed]}
    >
      <Text style={styles.linkTitle}>{title}</Text>
      <View style={styles.linkValue}>
        {value ? <Text style={styles.linkValueText}>{value}</Text> : null}
        <ForwardIcon size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: sizes.touch, alignSelf: 'flex-start' },
  backLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
  pressed: { opacity: 0.6 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm },
  modalTitle: { flex: 1, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  modalRight: { minWidth: 40, alignItems: 'flex-end' },
  outline: {
    minWidth: 40,
    height: 40,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outlineWithLabel: { paddingHorizontal: space.sm2, gap: space.xs2 },
  outlinePressed: { backgroundColor: colors.divider },
  outlineLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  bottomBar: {
    paddingTop: space.md,
    paddingHorizontal: screenPadding,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: space.sm,
  },
  empty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: space.xxl,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: space.sm,
  },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text, textAlign: 'center' },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 290,
  },
  emptyButton: { marginTop: space.xs2, borderRadius: radius.input, paddingVertical: space.md, paddingHorizontal: 18 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  divider: { borderTopWidth: 1, borderTopColor: colors.divider },
  linkTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  linkValue: { flexDirection: 'row', alignItems: 'center', gap: space.xs2 },
  linkValueText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
});
