import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, sizes, space, type } from '@/theme/theme';

import { CalendarIcon, DashboardIcon, HabitsIcon, ProfileIcon, ProgressIcon } from './icons';

export type TabKey = 'dashboard' | 'calendar' | 'progress' | 'habits' | 'profile';

const tabs: { key: TabKey; label: string; Icon: ComponentType<{ color?: string }> }[] = [
  { key: 'dashboard', label: 'Дашборд', Icon: DashboardIcon },
  { key: 'calendar', label: 'Календар', Icon: CalendarIcon },
  { key: 'progress', label: 'Прогрес', Icon: ProgressIcon },
  { key: 'habits', label: 'Звички', Icon: HabitsIcon },
  { key: 'profile', label: 'Профіль', Icon: ProfileIcon },
];

type TabBarProps = {
  active: TabKey;
  onChange?: (key: TabKey) => void;
};

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <View style={styles.bar} accessibilityRole="tablist" accessibilityLabel="Основна навігація">
      {tabs.map(({ key, label, Icon }) => {
        const selected = key === active;
        const color = selected ? colors.accent : colors.textMuted;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={() => onChange?.(key)}
            style={styles.item}
          >
            <Icon color={color} />
            <Text style={[type.tab, { color }, selected && styles.selectedLabel]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: sizes.tabBar,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    paddingTop: space.sm,
    paddingHorizontal: space.xs2,
    paddingBottom: space.xxl,
  },
  item: {
    flex: 1,
    minHeight: sizes.touch,
    alignItems: 'center',
    gap: space.xs,
  },
  selectedLabel: { fontFamily: fonts.bold },
});
