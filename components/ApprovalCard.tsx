import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApproveToolUse, useDenyToolUse, useCreateApprovalRule } from '../lib/api';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius, FontFamily } from '../constants/theme';

interface Props {
  sessionId: string;
  toolName: string;
  toolInput: Record<string, any>;
  description: string;
  resolved?: boolean;
  approved?: boolean;
  approvalCount?: { current: number; required: number };
}

export function ApprovalCard({ sessionId, toolName, toolInput, description, resolved, approved, approvalCount }: Props) {
  const approve = useApproveToolUse(sessionId);
  const deny = useDenyToolUse(sessionId);
  const createRule = useCreateApprovalRule();
  const [decision, setDecision] = useState<'approved' | 'denied' | null>(
    resolved ? (approved ? 'approved' : 'denied') : null,
  );
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const handleApprove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    approve.mutate(undefined, { onSuccess: () => setDecision('approved') });
  };

  const handleAlwaysApprove = () => {
    Alert.alert(
      'Always Approve?',
      `This will automatically approve ALL future "${toolName}" requests without asking. You can remove this rule in Settings > Rules.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Always Approve',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            createRule.mutate({ tool_pattern: toolName, action: 'approve' });
            approve.mutate(undefined, { onSuccess: () => setDecision('approved') });
          },
        },
      ],
    );
  };

  const handleDeny = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deny.mutate(undefined, { onSuccess: () => setDecision('denied') });
  };

  if (decision) {
    const isApproved = decision === 'approved';
    const color = isApproved ? colors.success : colors.error;
    const icon = isApproved ? 'checkmark-circle' : 'close-circle';
    const label = isApproved ? 'Approved' : 'Denied';

    return (
      <View style={[styles.resolved, { borderColor: color + '40' }]}>
        <Ionicons name={icon as any} size={16} color={color} />
        <Text style={[styles.resolvedLabel, { color }]}>{label}</Text>
        <Text style={styles.resolvedTool}>{toolName}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={20} color={colors.warning} />
        <Text style={styles.title}>Approval Required</Text>
      </View>
      <Text style={styles.toolName}>{toolName}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
      <View style={styles.inputPreview}>
        <Text style={styles.code} numberOfLines={10}>
          {JSON.stringify(toolInput, null, 2)}
        </Text>
      </View>
      {approvalCount && approvalCount.required > 1 && (
        <View style={styles.approvalProgress}>
          <Ionicons name="people" size={14} color={colors.textMuted} />
          <Text style={styles.approvalProgressText}>
            {approvalCount.current}/{approvalCount.required} approved
          </Text>
        </View>
      )}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={handleDeny}
          disabled={deny.isPending}
        >
          <Ionicons name="close" size={18} color={colors.error} />
          <Text style={[styles.buttonText, { color: colors.error }]}>Deny</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={handleApprove}
          disabled={approve.isPending}
        >
          <Ionicons name="checkmark" size={18} color={colors.buttonText} />
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>Approve</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.alwaysApproveButton}
        onPress={handleAlwaysApprove}
        disabled={createRule.isPending}
      >
        <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
        <Text style={styles.alwaysApproveText}>Always approve {toolName}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      marginHorizontal: Spacing.lg,
      marginVertical: Spacing.sm,
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 2,
      borderColor: c.warning,
      padding: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    title: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: c.warning,
    },
    toolName: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.text,
      marginBottom: Spacing.xs,
    },
    description: {
      fontSize: FontSize.sm,
      color: c.textSecondary,
      marginBottom: Spacing.sm,
    },
    inputPreview: {
      backgroundColor: c.codeBg,
      borderRadius: BorderRadius.sm,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    code: {
      fontFamily: FontFamily.mono,
      fontSize: FontSize.xs,
      color: c.codeText,
    },
    buttons: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      gap: Spacing.xs,
    },
    denyButton: {
      borderWidth: 1,
      borderColor: c.error,
    },
    approveButton: {
      backgroundColor: c.success,
    },
    buttonText: {
      fontSize: FontSize.md,
      fontWeight: '700',
    },
    resolved: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginHorizontal: Spacing.lg,
      marginVertical: 3,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: c.toolBg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
    resolvedLabel: {
      fontSize: FontSize.sm,
      fontWeight: '600',
    },
    resolvedTool: {
      fontSize: FontSize.sm,
      color: c.textMuted,
    },
    alwaysApproveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    alwaysApproveText: {
      fontSize: FontSize.xs,
      color: c.primary,
      fontWeight: '500',
    },
    approvalProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    approvalProgressText: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      fontWeight: '500',
    },
  });
