import { Stack } from 'expo-router';
import { useColors } from '../../../constants/theme';

export default function CronLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Cron Jobs' }} />
      <Stack.Screen name="[id]" options={{ title: 'Cron Job' }} />
    </Stack>
  );
}
