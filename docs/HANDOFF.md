# Claude Code handoff package

## Contents
- `CLAUDE.md` — project rules (Claude Code reads them automatically).
- `docs/SPEC.md` — screens, flows, data model, streaks, statistics, rest timer.
- `src/theme/theme.ts` — design tokens for theme 8 "Light Sport".
- `docs/design/` — screen and UI kit source files exported from Claude Design (HTML with inline styles, the visual reference for every screen; UI text is in Ukrainian).

## Getting started
```bash
npx create-expo-app@latest ubermensch -t default
cd ubermensch
# already done: CLAUDE.md in the root, spec and designs in docs/, tokens in src/theme/
claude
```

## Prompts, in order (one at a time, review each result)
1. "Read CLAUDE.md and docs/SPEC.md. Set up the project: Expo Router with 5 tabs, Exo 2 font, expo-sqlite + Drizzle, Zustand, react-native-svg, expo-notifications, expo-haptics. Placeholder screens only."
2. "Build the base components from docs/design/UiKit.dc.html in src/components/ui, plus a demo screen showing every state."
3. "Create the database schema and migrations from docs/SPEC.md §4, seed an exercise library (30–40 common exercises) and default settings."
4. "Implement src/domain: streaks (§5), statistics and PRs (§6), marking missed workouts on launch. With unit tests."
5. "Habits screen from docs/design/Habits.dc.html and HabitsEmpty.dc.html."
6. "New workout from docs/design/NewWorkout.dc.html, including supersets and templates."
7. "Calendar from docs/design/Calendar.dc.html and CalendarEmpty.dc.html."
8. "Active workout, Log set, Rest and Warm-up from docs/design/Active, LogSet, Rest, RestTip. Background rest timer per docs/SPEC.md §7."
9. "Workout summary from docs/design/Summary.dc.html, with the template suggestion."
10. "Dashboard from docs/design/Dashboard.dc.html."
11. "Progress from docs/design/Progress.dc.html."
12. "Profile and Templates, CSV export."

## Syncing with Claude Design
Once the components exist in code, run `/design-sync` in Claude Code to push them into a Claude Design design system.
