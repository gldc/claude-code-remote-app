import { Stack } from 'expo-router';
import { useColors } from '../../../../constants/theme';

export default function SessionDetailLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
      }}
    />
  );
}
