import type { HabitCategory } from '@/db/schema';
import { colors } from '@/theme/theme';

export const habitCategories: Record<HabitCategory, { label: string; color: string }> = {
  habit: { label: 'Звички', color: colors.catHabit },
  food: { label: 'Їжа', color: colors.catFood },
  sleep: { label: 'Сон', color: colors.catSleep },
};
