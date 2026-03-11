import { Stack } from 'expo-router';
import { useColors } from '../../../../constants/theme';

export default function WorkflowsLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Workflows' }} />
      <Stack.Screen name="[id]" options={{ title: 'Workflow' }} />
    </Stack>
  );
}
