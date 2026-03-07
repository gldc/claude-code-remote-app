import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApproveToolUse, useDenyToolUse } from '../lib/api';
import { Colors, FontSize, Spacing, BorderRadius, FontFamily } from '../constants/theme';

interface Props {
  sessionId: string;
  toolName: string;
  toolInput: Record<string, any>;
  description: string;
}

export function ApprovalCard({ sessionId, toolName, toolInput, description }: Props) {
  const approve = useApproveToolUse(sessionId);
  const deny = useDenyToolUse(sessionId);

  const handleApprove = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    approve.mutate();
  };

  const handleDeny = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deny.mutate(undefined);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={20} color={Colors.warning} />
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
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={handleDeny}
          disabled={deny.isPending}
        >
          <Ionicons name="close" size={18} color={Colors.error} />
          <Text style={[styles.buttonText, { color: Colors.error }]}>Deny</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={handleApprove}
          disabled={approve.isPending}
        >
          <Ionicons name="checkmark" size={18} color={Colors.background} />
          <Text style={[styles.buttonText, { color: Colors.background }]}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.warning,
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
    color: Colors.warning,
  },
  toolName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputPreview: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  code: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
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
    borderColor: Colors.error,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  buttonText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
