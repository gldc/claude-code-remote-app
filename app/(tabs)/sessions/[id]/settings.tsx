import { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet, Share } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
  useSession, useSendPrompt, useExportSession,
  useArchiveSession, useDeleteSession, useRenameSession,
} from '../../../../lib/api';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../../../../constants/theme';

interface ActionRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  subtitle?: string;
}

function ActionRow({ icon, label, onPress, destructive, subtitle }: ActionRowProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.iconCircle, destructive && { backgroundColor: colors.error + '18' }]}>
        <Ionicons
          name={icon as any}
          size={20}
          color={destructive ? colors.error : colors.primary}
        />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && { color: colors.error }]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={{ fontSize: FontSize.xs, color: colors.textMuted, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {title}
    </Text>
  );
}

export default function SessionSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const { data: session } = useSession(id);
  const sendPrompt = useSendPrompt(id);
  const exportSession = useExportSession(id);
  const archiveSession = useArchiveSession();
  const deleteSession = useDeleteSession();
  const renameSession = useRenameSession();

  const handleRename = useCallback(() => {
    Alert.prompt('Rename Session', 'Enter new name:', (name) => {
      if (name?.trim()) renameSession.mutate({ id, name: name.trim() });
    }, 'plain-text', session?.name);
  }, [id, session?.name, renameSession]);

  const handleChangeModel = useCallback(() => {
    Alert.prompt('Change Model', 'Enter model name:', (model) => {
      if (model?.trim()) sendPrompt.mutate(`/model ${model.trim()}`);
    }, 'plain-text', session?.current_model || '');
  }, [session?.current_model, sendPrompt]);

  const handleCompact = useCallback(() => {
    sendPrompt.mutate('/compact');
    router.back();
  }, [sendPrompt, router]);

  const handleCopyId = useCallback(() => {
    Clipboard.setStringAsync(id);
    Alert.alert('Copied', 'Session ID copied to clipboard');
  }, [id]);

  const handleExport = useCallback(() => {
    exportSession.mutate(undefined, {
      onSuccess: (data) => Share.share({ message: JSON.stringify(data, null, 2) }),
    });
  }, [exportSession]);

  const handleArchive = useCallback(() => {
    if (!session) return;
    archiveSession.mutate({ id, archived: !session.archived });
    router.back();
  }, [id, session, archiveSession, router]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Session', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSession.mutate(id, {
            onSuccess: () => {
              router.dismissAll();
            },
          });
        },
      },
    ]);
  }, [id, deleteSession, router]);

  if (!session) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Session Settings' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Session" />
        <View style={styles.section}>
          <ActionRow icon="pencil" label="Rename Session" subtitle={session.name} onPress={handleRename} />
          <View style={styles.separator} />
          <ActionRow icon="cube-outline" label="Change Model" subtitle={session.current_model || 'Default'} onPress={handleChangeModel} />
          <View style={styles.separator} />
          <ActionRow icon="contract-outline" label="Compact Context" subtitle={`${session.context_percent}% used`} onPress={handleCompact} />
        </View>

        <SectionHeader title="Info" />
        <View style={styles.section}>
          <ActionRow icon="server-outline" label="MCP Servers" onPress={() => router.push({ pathname: '/(tabs)/sessions/[id]/mcp', params: { id, projectDir: session.project_dir } })} />
          <View style={styles.separator} />
          <ActionRow icon="flash-outline" label="Skills" onPress={() => router.push({ pathname: '/(tabs)/sessions/[id]/skills', params: { id } })} />
        </View>

        <SectionHeader title="Actions" />
        <View style={styles.section}>
          <ActionRow icon="copy-outline" label="Copy Session ID" onPress={handleCopyId} />
          <View style={styles.separator} />
          <ActionRow icon="share-outline" label="Export Session" onPress={handleExport} />
          <View style={styles.separator} />
          <ActionRow icon="archive-outline" label={session.archived ? 'Unarchive' : 'Archive'} onPress={handleArchive} />
        </View>

        <SectionHeader title="" />
        <View style={styles.section}>
          <ActionRow icon="trash-outline" label="Delete Session" onPress={handleDelete} destructive />
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: Spacing.xxl * 2 },
    section: {
      marginHorizontal: Spacing.md,
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: c.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1 },
    rowLabel: {
      fontSize: FontSize.md,
      color: c.text,
    },
    rowSubtitle: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      marginTop: 1,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.cardBorder,
      marginLeft: Spacing.lg + 34 + Spacing.md,
    },
  });
