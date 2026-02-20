import { Tabs, Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { useStore } from '../../store/useStore';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '🏋️',
    analysis: '📊',
    simulation: '✨',
    profile: '👤',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 22 }}>{icons[name] || '📱'}</Text>
    </View>
  );
}

export default function TabLayout() {
  const onboarded = useStore((s) => s.onboarded);

  if (!onboarded) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.cardBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '운동',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: '분석',
          tabBarIcon: ({ focused }) => <TabIcon name="analysis" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="simulation"
        options={{
          title: 'AI 시뮬',
          tabBarIcon: ({ focused }) => <TabIcon name="simulation" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
