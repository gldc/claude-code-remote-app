import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function SessionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sessions' }} />
      <Stack.Screen name="create" options={{ title: 'New Session' }} />
      <Stack.Screen name="[id]" options={{ title: 'Session' }} />
    </Stack>
  );
}
