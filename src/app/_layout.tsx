import {
  Exo2_400Regular,
  Exo2_600SemiBold,
  Exo2_700Bold,
  Exo2_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/exo-2';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatabaseGate } from '@/db/database-gate';
import { configureNotifications } from '@/lib/notifications';
import { colors } from '@/theme/theme';

configureNotifications();

const modal = { presentation: 'modal' } as const;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Exo2_400Regular, Exo2_600SemiBold, Exo2_700Bold, Exo2_800ExtraBold });

  if (!fontsLoaded) return null;

  return (
    <DatabaseGate>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/plan" options={modal} />
        <Stack.Screen name="templates/edit" options={modal} />
        <Stack.Screen name="habit/[id]" options={modal} />
        <Stack.Screen name="workout/active" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="workout/summary/[id]" options={{ gestureEnabled: false }} />
      </Stack>
    </DatabaseGate>
  );
}
