# Project rules

Workout and habit tracker built with Expo (React Native). Full specification: `docs/SPEC.md`. Design: `docs/design/`. Original handoff notes and the build plan: `docs/HANDOFF.md`.

## Stack
- Expo SDK 57 (pinned to the version supported by the store Expo Go; do not upgrade without asking), TypeScript, Expo Router (tabs + stack).
- Data: `expo-sqlite` + Drizzle ORM, migrations in `src/db/migrations`.
- Active workout state: Zustand, persisted so it survives an app restart.
- Charts and illustrations: `react-native-svg` (custom components, no heavy chart libraries).
- Notifications: `expo-notifications` (local only), vibration: `expo-haptics`.
- Font: `@expo-google-fonts/exo-2`.

## Must follow
- Colors, fonts, spacing and radii come only from `src/theme/theme.ts`. No hex values inside components.
- Before building a screen, open the matching file in `docs/design/` and reproduce its structure, sizes and colors. `.dc.html` files are HTML with inline styles: `{{...}}` are data bindings, `<sc-for>` is a loop, `<sc-if>` is a condition, `<dc-import>` is a nested component.
- All user-facing text is in **Ukrainian**, exactly as in the design files. Code, comments, identifiers and commit messages are in English.
- Base components live in `src/components/ui` (Button, Chip, Checkbox, Toggle, Stepper, Card, StatCard, FlameIcon, Donut, CalendarDay, TabBar...). Screens are composed from them.
- Weight is in kg only, step 2.5.
- Touch targets are at least 44 px. Buttons are real `Pressable`s with `accessibilityRole`, and icon-only buttons have an `accessibilityLabel`.
- Business logic (streaks, statistics, PRs) lives in pure functions in `src/domain`, covered by unit tests (Jest).
- No network data: everything is local.

## How to work
- One request = one step. After each step run `npx tsc --noEmit` and the tests.
- Do not add features that are not in `docs/SPEC.md` unless asked.

---

# Expo notes

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

### Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

### Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

### Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

### Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

### Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
