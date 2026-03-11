import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius, IconSize } from '../../constants/theme';
import { useAppStore } from '../../lib/store';
import type { OnboardingStepProps } from './types';

export function ConnectStep({ onNext, onSkip }: OnboardingStepProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const hostConfig = useAppStore((s) => s.hostConfig);
  const setHostConfig = useAppStore((s) => s.setHostConfig);

  const [address, setAddress] = useState(hostConfig.address);
  const [port, setPort] = useState(String(hostConfig.port || 8080));
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSessions, setActiveSessions] = useState<number | null>(null);

  const handleTestConnection = async () => {
    if (!address.trim()) {
      setConnectionStatus('error');
      setErrorMessage('Please enter a Tailscale address.');
      return;
    }

    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      setConnectionStatus('error');
      setErrorMessage('Please enter a valid port number (1–65535).');
      return;
    }

    setTesting(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const url = `http://${address.trim()}:${portNum}/api/status`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        setHostConfig({ address: address.trim(), port: portNum });
        try {
          const data = await response.json();
          setActiveSessions(typeof data.active_sessions === 'number' ? data.active_sessions : null);
        } catch {
          setActiveSessions(null);
        }
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setErrorMessage(`Server returned ${response.status}. Check address and port.`);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        setConnectionStatus('error');
        setErrorMessage('Connection timed out after 10 seconds. Is the server running?');
      } else {
        setConnectionStatus('error');
        setErrorMessage('Could not reach server. Check your Tailscale connection.');
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip button top-right */}
      <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Hero area */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🔗</Text>
      </View>

      <Text style={styles.title}>Connect to Server</Text>
      <Text style={styles.subtitle}>
        Enter your CCR server's Tailscale address and port.
      </Text>

      {/* Address input */}
      <Text style={styles.label}>Tailscale Address</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={address}
        onChangeText={(text) => {
          setAddress(text);
          setConnectionStatus('idle');
        }}
        placeholder="e.g. 100.64.0.1 or hostname"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />

      {/* Port input */}
      <Text style={styles.label}>Port</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={port}
        onChangeText={(text) => {
          setPort(text);
          setConnectionStatus('idle');
        }}
        placeholder="8080"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
      />

      {/* Test Connection button */}
      <TouchableOpacity
        style={[styles.testButton, testing && { opacity: 0.6 }]}
        onPress={handleTestConnection}
        disabled={testing}
        activeOpacity={0.8}
      >
        {testing ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Ionicons name="wifi-outline" size={IconSize.md} color={colors.primary} />
        )}
        <Text style={styles.testButtonText}>
          {testing ? 'Testing…' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      {/* Status banners */}
      {connectionStatus === 'success' && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={IconSize.md} color={colors.success} />
          <Text style={styles.successText}>
            {activeSessions !== null
              ? `Connected — ${activeSessions} active session${activeSessions === 1 ? '' : 's'}`
              : 'Connected successfully!'}
          </Text>
        </View>
      )}

      {connectionStatus === 'error' && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={IconSize.md} color={colors.error} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Next CTA — only active after successful connection */}
      <TouchableOpacity
        style={[styles.ctaButton, connectionStatus !== 'success' && styles.ctaButtonDisabled]}
        onPress={onNext}
        disabled={connectionStatus !== 'success'}
        activeOpacity={0.8}
      >
        <Text style={[styles.ctaText, connectionStatus !== 'success' && styles.ctaTextDisabled]}>
          Next
        </Text>
        <Ionicons
          name="arrow-forward"
          size={IconSize.lg}
          color={connectionStatus === 'success' ? colors.buttonText : colors.textMuted}
        />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: Spacing.xl,
    },
    skipButton: {
      alignSelf: 'flex-end',
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
    skipText: {
      fontSize: FontSize.sm,
      color: c.textMuted,
    },
    hero: {
      marginTop: Spacing.lg,
      marginBottom: Spacing.lg,
      backgroundColor: c.successBg10,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.xl,
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    heroEmoji: {
      fontSize: 48,
      textAlign: 'center',
    },
    title: {
      fontSize: FontSize.xl,
      fontWeight: '700',
      color: c.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: FontSize.sm,
      color: c.textSecondary,
      marginBottom: Spacing.lg,
      lineHeight: 20,
    },
    label: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: c.textMuted,
      marginBottom: Spacing.xs,
      marginTop: Spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
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
    testButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.primary,
      paddingVertical: Spacing.md,
      marginTop: Spacing.lg,
    },
    testButtonText: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.primary,
    },
    successBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.successBg10,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    successText: {
      fontSize: FontSize.sm,
      color: c.success,
      fontWeight: '600',
      flex: 1,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.errorBg10,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    errorText: {
      fontSize: FontSize.sm,
      color: c.error,
      flex: 1,
      lineHeight: 18,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      marginTop: Spacing.xl,
    },
    ctaButtonDisabled: {
      backgroundColor: c.cardBorder,
      opacity: 0.6,
    },
    ctaText: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: c.buttonText,
    },
    ctaTextDisabled: {
      color: c.textMuted,
    },
  });
