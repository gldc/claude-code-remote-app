import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../../lib/store';
import { useServerStatus, usePushSettings, useUpdatePushSettings } from '../../../lib/api';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../../constants/theme';

export default function SettingsScreen() {
  const hostConfig = useAppStore((s) => s.hostConfig);
  const setHostConfig = useAppStore((s) => s.setHostConfig);
  const { data: serverStatus } = useServerStatus();
  const { data: pushSettings } = usePushSettings();
  const updatePush = useUpdatePushSettings();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Host Connection</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Tailscale Address</Text>
        <TextInput
          style={styles.input}
          value={hostConfig.address}
          onChangeText={(v) => setHostConfig({ ...hostConfig, address: v })}
          placeholder="e.g., macbook.tailnet-xxxx or 100.x.y.z"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.label}>Port</Text>
        <TextInput
          style={styles.input}
          value={String(hostConfig.port)}
          onChangeText={(v) => setHostConfig({ ...hostConfig, port: parseInt(v) || 8080 })}
          keyboardType="number-pad"
          placeholderTextColor={colors.textMuted}
        />
        {serverStatus && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.statusText}>
              Connected | {serverStatus.active_sessions} active / {serverStatus.total_sessions} total
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Templates</Text>
      <TouchableOpacity
        style={styles.navRow}
        onPress={() => router.push('/(tabs)/settings/templates')}
      >
        <Ionicons name="document-text" size={20} color={colors.primary} />
        <Text style={styles.navRowText}>Manage Templates</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.section}>
        {(() => {
          const settings = pushSettings ?? {
            notify_approvals: true,
            notify_completions: true,
            notify_errors: true,
          };
          return (
            <>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Approval Requests</Text>
                <Switch
                  value={settings.notify_approvals}
                  onValueChange={(v) =>
                    updatePush.mutate({ ...settings, notify_approvals: v })
                  }
                  trackColor={{ true: colors.primary }}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Session Completions</Text>
                <Switch
                  value={settings.notify_completions}
                  onValueChange={(v) =>
                    updatePush.mutate({ ...settings, notify_completions: v })
                  }
                  trackColor={{ true: colors.primary }}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Session Errors</Text>
                <Switch
                  value={settings.notify_errors}
                  onValueChange={(v) =>
                    updatePush.mutate({ ...settings, notify_errors: v })
                  }
                  trackColor={{ true: colors.primary }}
                />
              </View>
            </>
          );
        })()}
      </View>

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: Spacing.lg },
    sectionTitle: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    section: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    label: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginBottom: Spacing.xs,
      marginTop: Spacing.sm,
    },
    input: {
      backgroundColor: c.background,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      color: c.text,
      fontSize: FontSize.md,
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: FontSize.sm, color: c.success },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      gap: Spacing.md,
    },
    navRowText: { flex: 1, fontSize: FontSize.md, color: c.text },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    switchLabel: { fontSize: FontSize.md, color: c.text },
  });
