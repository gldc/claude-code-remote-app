import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { shadowElevated } from '../constants/shadows';
import { COMMANDS, SlashCommand } from '../constants/commands';
import { useSkills } from '../lib/api';

interface CommandAutocompleteProps {
  filter: string;
  onSelect: (command: SlashCommand) => void;
}

export function CommandAutocomplete({ filter, onSelect }: CommandAutocompleteProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: skills } = useSkills();

  const allCommands = useMemo(() => {
    const staticNames = new Set(COMMANDS.map((c) => c.name));
    const dynamicSkills: SlashCommand[] = (skills ?? [])
      .filter((s) => !staticNames.has(s.name))
      .map((s) => ({ name: s.name, description: s.description, type: 'skill' as const }));
    return [...COMMANDS, ...dynamicSkills];
  }, [skills]);

  const query = filter.startsWith('/') ? filter.slice(1).toLowerCase() : '';
  const filtered = allCommands.filter((cmd) => cmd.name.toLowerCase().includes(query));

  if (filtered.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={filtered.length > 4}
      >
        {filtered.map((cmd) => (
          <TouchableOpacity
            key={cmd.name}
            style={styles.item}
            onPress={() => onSelect(cmd)}
            activeOpacity={0.6}
          >
            <Text style={styles.name} numberOfLines={1}>/{cmd.name}</Text>
            {cmd.description ? (
              <Text style={styles.description} numberOfLines={1}>{cmd.description}</Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
      marginBottom: Spacing.xs,
      ...shadowElevated,
      overflow: 'hidden',
    },
    scrollView: {
      maxHeight: 220,
    },
    item: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
    },
    name: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.primary,
    },
    description: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      marginTop: Spacing.xs,
    },
  });
