import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import type { Template } from '../lib/types';

export function TemplateCard({ template }: { template: Template }) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/settings/templates/${template.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{template.name}</Text>
        <Text style={styles.prompt} numberOfLines={2}>{template.initial_prompt}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    info: { flex: 1 },
    name: { fontSize: FontSize.md, fontWeight: '600', color: c.text },
    prompt: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
  });
