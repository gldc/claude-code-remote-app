import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSkills } from '../../../../lib/api';
import { useAppStore } from '../../../../lib/store';
import type { Skill } from '../../../../lib/types';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../../../../constants/theme';

function SkillCard({ skill, onPress }: { skill: Skill; onPress: () => void }) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.skillName}>{skill.name}</Text>
      {skill.description ? (
        <Text style={styles.skillDescription}>{skill.description}</Text>
      ) : null}
      {skill.parameters && skill.parameters.length > 0 && (
        <View style={styles.paramRow}>
          {skill.parameters.map((p) => (
            <View key={p.name} style={styles.paramChip}>
              <Text style={styles.paramText}>
                {p.name}{p.required ? '*' : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SessionSkillsScreen() {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: skills, isLoading } = useSkills();
  const router = useRouter();
  const setPendingSkillInsert = useAppStore((s) => s.setPendingSkillInsert);

  const handleSkillPress = (skill: Skill) => {
    setPendingSkillInsert(`/${skill.name}`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Skills' }} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={skills || []}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => <SkillCard skill={item} onPress={() => handleSkillPress(item)} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No skills available</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
    list: { padding: Spacing.md },
    card: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
    },
    skillName: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.text,
    },
    skillDescription: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginTop: Spacing.xs,
      lineHeight: 20,
    },
    paramRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.xs,
      marginTop: Spacing.sm,
    },
    paramChip: {
      backgroundColor: c.background,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
    },
    paramText: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      fontFamily: 'monospace',
    },
    emptyText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
  });
