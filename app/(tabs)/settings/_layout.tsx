import { Stack } from 'expo-router';
import { useColors } from '../../../constants/theme';

export default function SettingsLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="templates/index" options={{ title: 'Templates' }} />
      <Stack.Screen name="templates/[id]" options={{ title: 'Template' }} />
    </Stack>
  );
}
