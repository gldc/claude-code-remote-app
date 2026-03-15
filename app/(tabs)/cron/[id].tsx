import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useColors, useThemedStyles, type ColorPalette, FontSize } from '../../../constants/theme';

export default function CronDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Cron Job: {id}</Text>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background },
    text: { fontSize: FontSize.lg, color: c.textMuted },
  });
