import { Stack } from 'expo-router';
import { useColors } from '../../../constants/theme';

export default function SessionsLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Sessions' }} />
      <Stack.Screen name="create" options={{ title: 'New Session' }} />
      <Stack.Screen name="[id]" options={{ title: 'Session' }} />
    </Stack>
  );
}
