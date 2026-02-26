import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import { useStore } from '../store/useStore';

let mobileAds: any = null;
try {
  mobileAds = require('react-native-google-mobile-ads').default;
} catch (e) {}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const loadFromStorage = useStore((s) => s.loadFromStorage);

  useEffect(() => {
    // AdMob SDK 초기화 (광고 로드 전에 반드시 필요)
    mobileAds?.().initialize().catch(() => {});
    loadFromStorage().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/index" options={{ animation: 'fade' }} />
        <Stack.Screen name="workout/index" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}
