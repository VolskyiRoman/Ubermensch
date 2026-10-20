# Specification: workout & habit tracker (Expo, React Native)

Working name: Übermensch (use `ubermensch` in code and identifiers).
UI language: **Ukrainian** (all user-facing strings stay in Ukrainian, as in the designs). Units: kilograms only.
Data: stored locally on the device only (`expo-sqlite`), no accounts, no server.
Distribution: personal build, not published to any store.

Design: `docs/design/` folder (screen source files exported from Claude Design) and `docs/design/UiKit.dc.html`.
Tokens: `src/theme/theme.ts`.

---

## 1. Navigation

Tab bar (5 tabs): **Дашборд (Dashboard) · Календар (Calendar) · Прогрес (Progress) · Звички (Habits) · Профіль (Profile)**.

Outside the tab bar (stack or modal screens):
- New workout (modal, opened from Calendar via "+")
- Active workout → Log set (bottom sheet) → Rest
- Workout summary
- Templates (from Profile, from New workout, from Summary)

While a workout is in progress, the Dashboard shows a card that returns to it.

## 2. Screens

| Screen | Design file | Key points |
|---|---|---|
| Dashboard | `Dashboard.dc.html` | header = today's date (no "Today" title, no streak badge); "Perfect day" hero card with streak number and flame icon; daily donut chart (one segment per daily item); 4 category cards in "done/total" format + per-category streak; today's workout card with "Почати тренування" (Start workout); 7-day volume bars; latest PR; overall counters |
| Calendar | `Calendar.dc.html`, `CalendarEmpty.dc.html` | month grid; day cells are filled by status: completed — `successSoft` bg / `success` text, planned — `accentSoft` bg / `accentPressed` text, missed — `danger` bg / white text; today — `accent` outline with 2 px offset; tapping a day selects it; selected day shows its workout card or the "День відпочинку" (rest day) placeholder; no Start button here |
| Habits | `Habits.dc.html`, `HabitsEmpty.dc.html` | week strip with "x/y" per day; sections Habits / Food / Sleep, each with "x/y" and a section streak; row = checkbox + name + meta line; empty state with a sprout illustration |
| Progress | `Progress.dc.html` | counters; plan completion ring (%); 26-week activity heatmap; workouts & volume per week; per-exercise progress (est. 1RM / max weight / volume); PR list; average duration |
| Profile | `Profile.dc.html` | body weight + chart + "Записати" (Log) button; default rest (stepper, 15 s step); notification toggles; links to Templates and Exercise library; CSV export |
| Templates | `Templates.dc.html`, `TemplatesEmpty.dc.html` | template list with "Призначити" (Schedule); empty state with a clipboard illustration |
| New workout | `NewWorkout.dc.html` | name, date, template picker, exercise list, supersets (group A1/A2, rounds, rest after round), exercise search with dropdown, "Create custom exercise", "Save as template" toggle |
| Active workout | `Active.dc.html` | exercise progress bar, exercise name, "Last time" hint, current set timer, sets table; buttons "Завершити підхід" (Finish set, primary), "Розминка" (Warm-up), "Завершити вправу" (Finish exercise); "Нотатка" (Note) at top right |
| Log set | `LogSet.dc.html` | set duration (captured automatically), weight ±2.5, reps ±1, one-tap "Як минулий: W × R" (Same as last), rest after this set (±15 s), "Зберегти і відпочити" (Save and rest) |
| Rest | `Rest.dc.html`, `RestTips.dc.html` | countdown ring, −15 s / +30 s / Skip, next-set card, illustrated tip placeholder (10 variants, "Інша порада" cycles them), tip sits directly on the background (no card) |
| Summary | `Summary.dc.html` | streak +1; 6 metrics; actual vs planned rest; comparison with the previous identical workout; new PRs; offer to create a template; note; "Готово" (Done) |

## 3. Workout flow

1. Calendar → "+" → New workout: date, template or manual exercises, supersets, rest time (defaults to the setting, 3:00) → "Призначити" (Schedule).
2. On the workout day: Dashboard → "Почати тренування" (Start workout).
3. Active workout shows the first exercise. The set timer runs from the moment the set starts.
4. "Finish set" → bottom sheet: set duration is recorded; the user enters weight and reps (or taps "Same as last"); rest can be adjusted → "Save and rest".
5. Rest: countdown derived from `restEndsAt`. When it ends — local notification + vibration. After rest — next set.
6. Superset: after a set of A1 go straight to A2 with no rest; rest happens after the whole round.
7. "Warm-up": a separate toggle button. While warm-up is running the button shows its timer. Warm-up time is counted neither as rest, nor as active time, nor in set statistics.
8. "Finish exercise" → next exercise; after the last one → Summary.
9. Summary: persist statistics; if no template with the same set of exercises exists, offer to create one.

## 4. Data model (expo-sqlite + Drizzle)

```
exercises(id, name, muscle_group, equipment, is_custom, created_at)
templates(id, name, created_at, last_used_at)
template_items(id, template_id, exercise_id, position, superset_group NULL, target_sets, target_reps NULL, target_weight_kg NULL, rest_sec)
workouts(id, name, scheduled_date 'YYYY-MM-DD', template_id NULL, status 'planned'|'in_progress'|'completed'|'missed', started_at NULL, finished_at NULL, notes NULL)
workout_items(id, workout_id, exercise_id, position, superset_group NULL, target_sets, rest_sec, notes NULL)
sets(id, workout_item_id, set_index, weight_kg, reps, started_at, ended_at, duration_sec, rest_planned_sec, rest_actual_sec NULL)
warmups(id, workout_id, started_at, ended_at NULL)
habits(id, name, category 'habit'|'food'|'sleep', description NULL, position, archived 0|1, created_at)
habit_logs(habit_id, date 'YYYY-MM-DD', done 0|1, PRIMARY KEY(habit_id, date))   -- no row = not done
body_weight(id, date, weight_kg)
settings(key PRIMARY KEY, value)   -- default_rest_sec=180, notif_rest=1, notif_workout_day=1
```

Store dates as local `YYYY-MM-DD`; timestamps as ISO strings or epoch ms.

## 5. Streaks

First, on every app launch (and whenever the day changes): every `workouts` row with `status='planned'` and `scheduled_date < today` → `missed`.

- **Workout streak.** Take scheduled workouts ordered by date; count consecutive `completed` ones going back from the most recent until the first `missed`. Days with no scheduled workout do not break the streak. A workout scheduled for today and not yet done does not break it.
- **Category streak (habits / food / sleep).** Number of consecutive days on which every active item in the category was checked. Today counts if it is already complete; an incomplete today does not break the streak yet. An item left unchecked on a past day = not done.
- **Per-habit streak** — consecutive days with `done=1`.
- **Perfect day (overall streak).** A day counts if all habits, food and sleep items are done AND the workout scheduled for that day (if any) is `completed`.
- Keep the best value for every streak (store it or derive it from history).

## 6. Statistics

Per workout:
- Duration = `finished_at − started_at`.
- Active time = Σ set `duration_sec`.
- Warm-up = Σ `warmups` durations.
- Rest = duration − active time − warm-up.
- Volume (tonnage) = Σ `weight_kg × reps`.
- Sets, reps, exercises (and how many were in supersets).
- Density = volume / workout minutes excluding warm-up.
- Actual vs planned rest = average `rest_actual_sec` vs average `rest_planned_sec`.
- Comparison with the previous workout with the same `template_id` (fallback: same name): volume %, duration, reps.
- PRs per exercise: max weight; estimated 1RM (Epley: `w × (1 + r/30)`); most reps at a given weight; volume per session.

Dashboard & Progress: streaks; daily donut; heatmap (level = day volume, 4 levels); workouts and volume per week; per-exercise progress; PR feed; average duration; counters (workouts, hours, tonnes); plan completion over the last 30 days.

## 7. Background rest timer

- Store `restEndsAt` (end timestamp), not a countdown; remaining = `restEndsAt − now`.
- Schedule a local notification with `expo-notifications` at `restEndsAt` (sound + vibration); cancel and reschedule on Skip, ±15/30 s, or when the next set starts early.
- In the foreground, use `expo-haptics` + sound instead of the notification.
- Persist the active-workout state (Zustand) to SQLite/AsyncStorage so it survives an app restart.
- iOS with free signing: add a config plugin that strips the `aps-environment` entitlement (push is not needed; local notifications work without it).

## 8. Export

CSV: workouts, sets, habits, body weight — separate files, via `expo-file-system` + `expo-sharing`.

## 9. Empty states

Calendar (day without a workout) — a dumbbell sleeping on a pillow; Habits — a sprout in a pot; Templates — a clipboard with a plus; Rest — 10 illustrated tips (`RestTip.dc.html`). Implement the illustrations as inline SVG with `react-native-svg`; copy the path data from the design files.
