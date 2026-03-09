import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Switch, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApprovalRules, useCreateApprovalRule, useDeleteApprovalRule } from '../../../lib/api';
import type { ApprovalRule } from '../../../lib/types';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../../../constants/theme';

export default function RulesScreen() {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: rules, refetch } = useApprovalRules();
  const createRule = useCreateApprovalRule();
  const deleteRule = useDeleteApprovalRule();

  const [toolPattern, setToolPattern] = useState('');
  const [isDeny, setIsDeny] = useState(false);

  const handleCreate = () => {
    if (!toolPattern.trim()) return;
    createRule.mutate(
      { tool_pattern: toolPattern.trim(), action: isDeny ? 'deny' : 'approve' },
      {
        onSuccess: () => {
          setToolPattern('');
          setIsDeny(false);
        },
      },
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Rule', 'Remove this approval rule?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRule.mutate(id) },
    ]);
  };

  const renderRule = ({ item }: { item: ApprovalRule }) => (
    <View style={styles.ruleRow}>
      <View style={[styles.actionBadge, { backgroundColor: item.action === 'approve' ? colors.success + '20' : colors.error + '20' }]}>
        <Text style={{ fontSize: FontSize.xs, color: item.action === 'approve' ? colors.success : colors.error, fontWeight: '600' }}>
          {item.action.toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rulePattern}>{item.tool_pattern}</Text>
        {item.project_dir && <Text style={styles.ruleScope}>{item.project_dir}</Text>}
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add Rule</Text>
        <TextInput
          style={styles.input}
          placeholder="Tool pattern (e.g., Bash*, Write)"
          placeholderTextColor={colors.textMuted}
          value={toolPattern}
          onChangeText={setToolPattern}
          autoCapitalize="none"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{isDeny ? 'Deny' : 'Approve'}</Text>
          <Switch
            value={isDeny}
            onValueChange={setIsDeny}
            trackColor={{ true: colors.error, false: colors.success }}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreate} disabled={!toolPattern.trim()}>
          <Ionicons name="add-circle" size={20} color="#FFF" />
          <Text style={styles.addButtonText}>Add Rule</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Active Rules</Text>
      <FlatList
        data={rules ?? []}
        renderItem={renderRule}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No rules configured</Text>}
      />
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: Spacing.lg },
    sectionTitle: {
      fontSize: FontSize.sm, fontWeight: '600', color: c.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.5,
      marginTop: Spacing.lg, marginBottom: Spacing.sm,
    },
    addSection: {
      backgroundColor: c.card, borderRadius: BorderRadius.lg, padding: Spacing.lg,
      borderWidth: 1, borderColor: c.cardBorder, gap: Spacing.sm,
    },
    input: {
      backgroundColor: c.background, borderRadius: BorderRadius.md, padding: Spacing.md,
      color: c.text, fontSize: FontSize.md, borderWidth: 1, borderColor: c.inputBorder,
    },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    switchLabel: { fontSize: FontSize.md, color: c.text },
    addButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
      backgroundColor: c.primary, borderRadius: BorderRadius.md, padding: Spacing.md,
    },
    addButtonText: { color: '#FFF', fontSize: FontSize.md, fontWeight: '600' },
    list: { gap: Spacing.sm },
    ruleRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      backgroundColor: c.card, borderRadius: BorderRadius.md, padding: Spacing.md,
      borderWidth: 1, borderColor: c.cardBorder,
    },
    actionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    rulePattern: { fontSize: FontSize.md, color: c.text, fontFamily: 'Menlo' },
    ruleScope: { fontSize: FontSize.xs, color: c.textMuted },
    emptyText: { fontSize: FontSize.md, color: c.textMuted, textAlign: 'center', padding: Spacing.xl },
  });
