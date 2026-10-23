// Local notifications only (docs/SPEC.md §7): rest end and workout-day reminders.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, fromDateKey } from './dates';

type NotificationKind = 'rest' | 'workout-day';

const REST_CHANNEL = 'rest';
const REMINDER_CHANNEL = 'reminders';
/** Workout-day reminders fire at 08:00. */
const REMINDER_HOUR = 8;
const MAX_REMINDERS = 30;

/** Call once at startup. In the foreground the rest notification only plays its sound (haptics come from the screen). */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isRest = (notification.request.content.data as { kind?: NotificationKind } | undefined)?.kind === 'rest';
      return { shouldPlaySound: true, shouldShowBanner: !isRest, shouldShowList: !isRest, shouldSetBadge: false };
    },
  });

  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync(REST_CHANNEL, {
      name: 'Таймер відпочинку',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 400, 200, 400],
    });
    void Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Нагадування про тренування',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/** Asks for permission if it has not been decided yet. */
export async function ensureNotificationPermission() {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function scheduleRestEnd(at: number, body: string) {
  if (!(await ensureNotificationPermission())) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Відпочинок завершено', body, sound: true, data: { kind: 'rest' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: REST_CHANNEL },
    });
  } catch {
    return null;
  }
}

export function cancelNotification(id: string | null) {
  if (id) void Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

/** Replaces all workout-day reminders with one per upcoming planned workout. */
export async function syncWorkoutReminders(enabled: boolean, planned: { date: string; name: string }[], today: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => (n.content.data as { kind?: NotificationKind } | undefined)?.kind === 'workout-day')
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    if (!enabled || planned.length === 0) return;
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;

    const now = Date.now();
    const upcoming = planned
      .filter((w) => w.date >= today && w.date <= addDays(today, 60))
      .map((w) => {
        const at = fromDateKey(w.date);
        at.setHours(REMINDER_HOUR);
        return { ...w, at: at.getTime() };
      })
      .filter((w) => w.at > now)
      .slice(0, MAX_REMINDERS);

    for (const w of upcoming) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Сьогодні тренування', body: w.name, data: { kind: 'workout-day' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: w.at, channelId: REMINDER_CHANNEL },
      });
    }
  } catch {
    // Notifications are best-effort; the app works without them.
  }
}
