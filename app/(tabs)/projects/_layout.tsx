import { Stack } from 'expo-router';
import { useColors } from '../../../constants/theme';

export default function ProjectsLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Projects' }} />
      <Stack.Screen name="create" options={{ title: 'New Project' }} />
      <Stack.Screen name="[id]" options={{ title: 'Project' }} />
      <Stack.Screen name="terminal" options={{ title: 'Terminal', headerShown: true }} />
    </Stack>
  );
}
