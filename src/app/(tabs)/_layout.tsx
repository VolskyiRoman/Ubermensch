import { Tabs } from 'expo-router/js-tabs';

import { TabBar, type TabKey } from '@/components/ui';
import { colors } from '@/theme/theme';

const routeByTab: Record<TabKey, string> = {
  dashboard: 'index',
  calendar: 'calendar',
  progress: 'progress',
  habits: 'habits',
  profile: 'profile',
};

const tabByRoute = Object.fromEntries(Object.entries(routeByTab).map(([tab, route]) => [route, tab])) as Record<
  string,
  TabKey
>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={({ state, navigation, insets }) => (
        <TabBar
          active={tabByRoute[state.routes[state.index].name]}
          onChange={(tab) => navigation.navigate(routeByTab[tab])}
          bottomInset={insets.bottom}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
