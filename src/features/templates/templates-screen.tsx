import { asc, eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClipboardIllustration } from '@/components/illustrations/empty-states';
import { AppText, BackLink, Card, EmptyState, IconButton, PlusIcon } from '@/components/ui';
import { db } from '@/db/client';
import { exercises, templateItems, templates } from '@/db/schema';
import { useDbQuery } from '@/db/use-db-query';
import { countSupersets, describeExercises } from '@/domain/stats';
import { formatExerciseCount, formatShortDate, pluralUk } from '@/lib/format';
import { colors, fonts, radius, screenPadding, sizes, space } from '@/theme/theme';

function loadTemplates() {
  const rows = db.select().from(templates).orderBy(asc(templates.name)).all();
  const items = db
    .select({ templateId: templateItems.templateId, name: exercises.name, supersetGroup: templateItems.supersetGroup })
    .from(templateItems)
    .innerJoin(exercises, eq(templateItems.exerciseId, exercises.id))
    .orderBy(asc(templateItems.templateId), asc(templateItems.position))
    .all();
  return rows.map((t) => {
    const own = items.filter((i) => i.templateId === t.id);
    const supersets = countSupersets(own);
    return {
      id: t.id,
      name: t.name,
      meta: [
        formatExerciseCount(own.length),
        supersets > 0 ? `${supersets} ${pluralUk(supersets, ['суперсет', 'суперсети', 'суперсетів'])}` : null,
        t.lastUsedAt ? `востаннє ${formatShortDate(new Date(t.lastUsedAt))}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      list: describeExercises(own),
    };
  });
}

function editTemplate(id?: number) {
  router.push({ pathname: '/templates/edit', params: id === undefined ? {} : { id: String(id) } });
}

export function TemplatesScreen() {
  const { data } = useDbQuery(loadTemplates, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackLink label="Профіль" onPress={() => router.back()} />
        <View style={styles.header}>
          <AppText variant="h1" accessibilityRole="header">
            Шаблони
          </AppText>
          <IconButton accessibilityLabel="Новий шаблон" onPress={() => editTemplate()}>
            <PlusIcon color={colors.onAccent} />
          </IconButton>
        </View>

        {data?.length === 0 && (
          <View style={styles.empty}>
            <EmptyState
              illustration={<ClipboardIllustration />}
              title="Шаблонів ще немає"
              text="Створи шаблон вручну або збережи вдале тренування одним дотиком після його завершення."
              actionLabel="Створити шаблон"
              onAction={() => editTemplate()}
            />
          </View>
        )}

        {data?.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="button"
            accessibilityLabel={`${t.name}, ${t.meta}`}
            accessibilityHint="Відкрити шаблон"
            onPress={() => editTemplate(t.id)}
          >
            {({ pressed }) => (
              <Card style={[styles.card, pressed && styles.pressed]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardText}>
                    <Text style={styles.name}>{t.name}</Text>
                    <Text style={styles.meta}>{t.meta}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Призначити: ${t.name}`}
                    onPress={() => router.push({ pathname: '/workout/plan', params: { templateId: String(t.id) } })}
                    hitSlop={6}
                    style={({ pressed: p }) => [styles.schedule, p && styles.schedulePressed]}
                  >
                    <Text style={styles.scheduleLabel}>Призначити</Text>
                  </Pressable>
                </View>
                {t.list ? <Text style={styles.list}>{t.list}</Text> : null}
              </Card>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.xs, gap: space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empty: { marginTop: space.xl },
  card: { paddingVertical: space.md2, paddingHorizontal: space.lg, gap: space.sm2 },
  pressed: { backgroundColor: colors.divider },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.md },
  cardText: { flex: 1, gap: space.xxs },
  name: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  schedule: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: radius.chip,
    paddingHorizontal: space.sm2,
    minWidth: sizes.touch,
  },
  schedulePressed: { backgroundColor: colors.divider },
  scheduleLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  list: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.text },
});
