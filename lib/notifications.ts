import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useRegisterPushToken, useBaseUrl } from './api';
import { useAppStore } from './store';

// Lazy-load expo-notifications to avoid crashing in Expo Go on Android (SDK 53+)
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // expo-notifications unavailable (Expo Go on Android)
}

async function registerNotificationCategories(): Promise<void> {
  if (Platform.OS === 'web' || !Notifications) return;

  await Notifications.setNotificationCategoryAsync('approval_request', [
    {
      identifier: 'approve',
      buttonTitle: 'Approve',
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'deny',
      buttonTitle: 'Deny',
      options: { isDestructive: true, opensAppToForeground: false },
    },
  ]);
}

function getBaseUrlFromStore(): string {
  const { address, port } = useAppStore.getState().hostConfig;
  if (!address) return '';
  return `http://${address}:${port}`;
}

async function handleNotificationAction(
  actionIdentifier: string,
  sessionId: string,
): Promise<void> {
  const baseUrl = getBaseUrlFromStore();
  if (!baseUrl) return;

  let endpoint: string;
  if (actionIdentifier === 'approve') {
    endpoint = `${baseUrl}/api/sessions/${sessionId}/approve`;
  } else if (actionIdentifier === 'deny') {
    endpoint = `${baseUrl}/api/sessions/${sessionId}/deny`;
  } else {
    return;
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: actionIdentifier === 'deny'
        ? JSON.stringify({ approved: false })
        : undefined,
    });
  } catch (err) {
    // Silently fail — notification actions are best-effort
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Notifications) return null;

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
    return null;
  }
}

export function useNotificationSetup() {
  const registerToken = useRegisterPushToken();
  const baseUrl = useBaseUrl();

  useEffect(() => {
    if (!baseUrl) return;

    getExpoPushToken().then((token) => {
      if (token) {
        registerToken.mutate(token, {
          onError: () => {},  // Registration failure is non-fatal
        });
      }
    });
  }, [baseUrl]);

  useEffect(() => {
    if (!Notifications) return;

    registerNotificationCategories();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        try {
          const data = response.notification.request.content.data;
          const sessionId = data?.session_id as string | undefined;
          if (!sessionId) return;

          const action = response.actionIdentifier;

          if (action === 'approve' || action === 'deny') {
            handleNotificationAction(action, sessionId);
          } else {
            // Default tap — open session
            router.push(`/(tabs)/sessions/${sessionId}`);
          }
        } catch (err) {
          // Silently fail — user will see the notification and can tap again
        }
      }
    );
    return () => subscription.remove();
  }, []);
}
