import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDbQuery } from '@/db/use-db-query';
import { secondsExcludingWarmup } from '@/domain/workout-flow';
import { colors, screenPadding, space } from '@/theme/theme';

import { useActiveWorkout } from './active-workout-store';
import { ActiveView } from './components/active-view';
import { RestView } from './components/rest-view';
import { loadActiveWorkout } from './load-active';
import { discardStaleSession, finishExercise, logSet, previewStepAfterSet, saveWorkoutNote, startNextSet } from './session';

function openSummary(workoutId: number) {
  router.replace({ pathname: '/workout/summary/[id]', params: { id: String(workoutId) } });
}

/** Active workout: the current set, or the rest between sets (docs/design/Active, LogSet, Rest). */
export function ActiveWorkoutScreen() {
  const session = useActiveWorkout();
  const workoutId = session.workoutId;
  const { data, error } = useDbQuery(() => (workoutId === null ? null : loadActiveWorkout(workoutId)), [workoutId]);
  const [pendingEnd, setPendingEnd] = useState<number | null>(null);
  // Set when the workout ends here, so the cleared session does not also trigger the "stale" exit.
  const finishing = useRef(false);

  // Leave when there is nothing to show (no session, or its workout was finished or deleted).
  const loaded = data !== undefined || error !== undefined;
  const stale = workoutId === null || (loaded && (!data || data.status !== 'in_progress'));
  useEffect(() => {
    if (!stale || finishing.current) return;
    if (workoutId !== null) discardStaleSession(data?.status ?? null);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [stale, workoutId, data?.status]);

  if (stale || !data) return <SafeAreaView style={styles.screen} />;

  const items = data.items;
  const index = Math.min(session.itemIndex, items.length - 1);
  const item = items[index];
  if (!item) return <SafeAreaView style={styles.screen} />;

  const step = previewStepAfterSet(items, index);
  const isFinal = step.kind === 'finished';
  // No rest row when the workout ends or the next superset member follows straight away.
  const nextMember =
    step.kind === 'set' && step.restSec === 0 && item.supersetGroup && items[step.itemIndex].supersetGroup === item.supersetGroup
      ? items[step.itemIndex].label
      : null;
  const sheetRestSec = step.kind === 'set' && nextMember === null ? step.restSec : null;

  const finish = (result: 'set' | 'rest' | 'finished') => {
    if (result !== 'finished') return;
    finishing.current = true;
    openSummary(data.id);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {session.phase === 'rest' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <RestView
            startedAt={data.startedAt ?? session.setStartedAt}
            restEndsAt={session.restEndsAt ?? 0}
            restTotalSec={session.restTotalSec}
            lastSet={session.lastSet}
            nextItem={item}
            tipIndex={session.tipIndex}
            onStart={startNextSet}
          />
        </ScrollView>
      ) : (
        <ActiveView
          workout={data}
          item={item}
          itemIndex={index}
          setStartedAt={session.setStartedAt}
          warmups={session.warmups}
          logSheet={
            pendingEnd === null
              ? null
              : {
                  durationSec: secondsExcludingWarmup(session.warmups, session.setStartedAt, pendingEnd),
                  restSec: sheetRestSec,
                  saveLabel: isFinal
                    ? 'Зберегти і завершити'
                    : nextMember
                      ? `Зберегти, далі ${nextMember}`
                      : 'Зберегти і відпочити',
                }
          }
          onFinishSet={() => setPendingEnd(Date.now())}
          onCloseSheet={() => setPendingEnd(null)}
          onSaveSet={(values) => {
            const endedAt = pendingEnd ?? Date.now();
            setPendingEnd(null);
            finish(logSet(items, { ...values, endedAt }));
          }}
          onFinishExercise={() => finish(finishExercise(items))}
          onSaveNote={(text) => saveWorkoutNote(data.id, text)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: screenPadding, paddingTop: space.md, gap: space.lg },
});
