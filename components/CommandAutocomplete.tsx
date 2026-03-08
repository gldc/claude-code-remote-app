import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
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
  const filtered = allCommands.filter((cmd) => cmd.name.startsWith(query));

  if (filtered.length === 0) return null;

  const visible = filtered.slice(0, 5);

  return (
    <View style={styles.container}>
      {visible.map((cmd) => (
        <TouchableOpacity
          key={cmd.name}
          style={styles.item}
          onPress={() => onSelect(cmd)}
          activeOpacity={0.6}
        >
          <Text style={styles.name}>/{cmd.name}</Text>
          <Text style={styles.description}>{cmd.description}</Text>
        </TouchableOpacity>
      ))}
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
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.xs,
      shadowColor: c.shadowColor,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.cardBorder,
      gap: Spacing.sm,
    },
    name: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.primary,
    },
    description: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      flex: 1,
    },
  });
