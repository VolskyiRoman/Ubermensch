import {
  Exo2_400Regular,
  Exo2_600SemiBold,
  Exo2_700Bold,
  Exo2_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/exo-2';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/theme/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Exo2_400Regular, Exo2_600SemiBold, Exo2_700Bold, Exo2_800ExtraBold });

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}
