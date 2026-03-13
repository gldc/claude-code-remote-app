import { useCallback } from 'react';
import { View, Text, TextInput, Switch, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';

let updateChannel: string | undefined;
try {
  updateChannel = require('expo-updates').channel;
} catch {
  // expo-updates unavailable in Expo Go
}
import { useAppStore } from '../../../lib/store';
import { useServerStatus, usePushSettings, useUpdatePushSettings } from '../../../lib/api';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../../constants/theme';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { ListItem } from '../../../components/ui/ListItem';

export default function SettingsScreen() {
  const hostConfig = useAppStore((s) => s.hostConfig);
  const setHostConfig = useAppStore((s) => s.setHostConfig);
  const setHasOnboarded = useAppStore((s) => s.setHasOnboarded);
  const { data: serverStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = useServerStatus();
  const { data: pushSettings } = usePushSettings();
  const updatePush = useUpdatePushSettings();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const validateAddress = useCallback((address: string) => {
    const trimmed = address.trim();
    if (!trimmed) return;

    const isTailscale =
      trimmed.startsWith('100.') ||
      trimmed.includes('.ts.net') ||
      trimmed.includes('tailnet') ||
      trimmed === 'localhost' ||
      trimmed === '127.0.0.1';

    if (!isTailscale) {
      Alert.alert(
        'Non-Tailscale Address',
        'This address doesn\'t appear to be a Tailscale IP or hostname. Traffic will be unencrypted. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Anyway' },
        ],
      );
    }
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoadingStatus} onRefresh={refetchStatus} tintColor={colors.primary} />}
    >
      <SectionHeader>Host Connection</SectionHeader>
      <View style={styles.section}>
        <Text style={styles.label}>Tailscale Address</Text>
        <TextInput
          style={styles.input}
          value={hostConfig.address}
          onChangeText={(v) => setHostConfig({ ...hostConfig, address: v })}
          onBlur={() => validateAddress(hostConfig.address)}
          placeholder="e.g., macbook.tailnet-xxxx or 100.x.y.z"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helperText}>
          Use your Tailscale IP (100.x.x.x) or MagicDNS name
        </Text>
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

      <SectionHeader>Usage</SectionHeader>
      <View style={{ gap: Spacing.sm }}>
        <ListItem
          icon="speedometer"
          title="Usage Dashboard"
          onPress={() => router.push('/(tabs)/settings/usage')}
          spaced={false}
        />
        <ListItem
          icon="analytics"
          title="Analytics"
          onPress={() => router.push('/(tabs)/settings/analytics')}
          spaced={false}
        />
      </View>

      <SectionHeader>Automation</SectionHeader>
      <ListItem
        icon="shield-checkmark"
        title="Approval Rules"
        onPress={() => router.push('/(tabs)/settings/rules')}
        spaced={false}
      />

      <SectionHeader>Templates</SectionHeader>
      <ListItem
        icon="document-text"
        title="Manage Templates"
        onPress={() => router.push('/(tabs)/settings/templates')}
        spaced={false}
      />

      <SectionHeader>MCP Servers</SectionHeader>
      <ListItem
        icon="server"
        title="Manage MCP Servers"
        onPress={() => router.push('/(tabs)/settings/mcp')}
        spaced={false}
      />

      <SectionHeader>Notifications</SectionHeader>
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

      <SectionHeader>App</SectionHeader>
      <ListItem
        icon="refresh"
        title="Replay Onboarding"
        onPress={() => {
          setHasOnboarded(false);
          router.push('/(tabs)/sessions');
        }}
        spaced={false}
      />

      <Text style={styles.versionTag}>
        v{Constants.expoConfig?.version ?? '?'}
        {updateChannel && updateChannel !== 'production' ? ` (${updateChannel})` : ''}
      </Text>

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: Spacing.lg },
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
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
    },
    switchLabel: { fontSize: FontSize.md, color: c.text },
    helperText: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      marginTop: Spacing.xs,
    },
    versionTag: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: Spacing.xl,
    },
  });
