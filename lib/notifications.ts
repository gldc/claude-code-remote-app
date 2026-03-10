import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useRegisterPushToken } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return data;
  } catch {
    // Push tokens unavailable in Expo Go — requires a development build
    console.warn('Push notifications unavailable (requires development build)');
    return null;
  }
}

export function useNotificationSetup() {
  const registerToken = useRegisterPushToken();

  useEffect(() => {
    getExpoPushToken().then((token) => {
      if (token) {
        registerToken.mutate(token);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        const sessionId = data?.session_id as string | undefined;
        if (sessionId) {
          router.push(`/(tabs)/sessions/${sessionId}`);
        }
      }
    );

    return () => subscription.remove();
  }, []);
}
