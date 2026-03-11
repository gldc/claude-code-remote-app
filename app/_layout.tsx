import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from '../lib/api';
import { useNotificationSetup } from '../lib/notifications';
import { useColors } from '../constants/theme';
import { useAppStore } from '../lib/store';
import { OnboardingSheet } from '../components/OnboardingSheet';

function AppContent() {
  useNotificationSetup();
  const scheme = useColorScheme();
  const colors = useColors();
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {!hasOnboarded && <OnboardingSheet />}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
