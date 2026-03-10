import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMCPServers, useCreateMCPServer, useDeleteMCPServer } from '../../../lib/api';
import { ExpandableCard } from '../../../components/ExpandableCard';
import { StatusDot } from '../../../components/StatusDot';
import { SearchBar } from '../../../components/SearchBar';
import {
  useColors,
  useThemedStyles,
  type ColorPalette,
  Spacing,
  FontSize,
  BorderRadius,
} from '../../../constants/theme';

type ServerType = 'stdio' | 'sse';

export default function MCPServersScreen() {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: servers, isLoading, refetch } = useMCPServers();
  const createServer = useCreateMCPServer();
  const deleteServer = useDeleteMCPServer();

  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ServerType>('stdio');
  const [command, setCommand] = useState('');

  const filtered = (servers ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = useCallback(() => {
    const trimmedName = name.trim();
    const trimmedCommand = command.trim();
    if (!trimmedName || !trimmedCommand) {
      Alert.alert('Missing fields', 'Name and command/URL are required.');
      return;
    }
    const payload: Record<string, unknown> = {
      name: trimmedName,
      type,
    };
    if (type === 'stdio') {
      payload.command = trimmedCommand;
    } else {
      payload.url = trimmedCommand;
    }
    createServer.mutate(payload as any, {
      onSuccess: () => {
        setName('');
        setCommand('');
      },
    });
  }, [name, type, command, createServer]);

  const handleDelete = useCallback(
    (serverName: string) => {
      Alert.alert('Delete Server', `Remove "${serverName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteServer.mutate(serverName),
        },
      ]);
    },
    [deleteServer],
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
      }
    >
      <SearchBar placeholder="Filter servers..." onSearch={setSearch} />

      <View style={styles.list}>
        {filtered.length === 0 && !isLoading && (
          <Text style={styles.emptyText}>No MCP servers configured.</Text>
        )}
        {filtered.map((server) => (
          <ExpandableCard
            key={server.name}
            title={server.name}
            preview={
              <View style={styles.previewRow}>
                <StatusDot status="online" size="sm" />
                <Text style={styles.previewType}>{server.type}</Text>
              </View>
            }
          >
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{server.type}</Text>

              {server.command && (
                <>
                  <Text style={styles.detailLabel}>Command</Text>
                  <Text style={styles.detailValue} selectable>
                    {server.command}
                    {server.args.length > 0 ? ` ${server.args.join(' ')}` : ''}
                  </Text>
                </>
              )}

              {server.url && (
                <>
                  <Text style={styles.detailLabel}>URL</Text>
                  <Text style={styles.detailValue} selectable>
                    {server.url}
                  </Text>
                </>
              )}

              {Object.keys(server.env).length > 0 && (
                <>
                  <Text style={styles.detailLabel}>Environment</Text>
                  {Object.entries(server.env).map(([key]) => (
                    <Text key={key} style={styles.envRow}>
                      {key}=••••••••
                    </Text>
                  ))}
                </>
              )}

              <Text style={styles.detailLabel}>Scope</Text>
              <Text style={styles.detailValue}>{server.scope}</Text>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(server.name)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text style={styles.deleteText}>Remove Server</Text>
              </TouchableOpacity>
            </View>
          </ExpandableCard>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Add Server</Text>
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., my-mcp-server"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.formLabel}>Type</Text>
        <View style={styles.typePicker}>
          {(['stdio', 'sse'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeOption, type === t && styles.typeOptionActive]}
              onPress={() => setType(t)}
            >
              <Text
                style={[styles.typeOptionText, type === t && styles.typeOptionTextActive]}
              >
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>{type === 'stdio' ? 'Command' : 'URL'}</Text>
        <TextInput
          style={styles.input}
          value={command}
          onChangeText={setCommand}
          placeholder={type === 'stdio' ? 'e.g., npx -y @modelcontextprotocol/server' : 'e.g., http://localhost:3000/sse'}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.addButton, createServer.isPending && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={createServer.isPending}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>
            {createServer.isPending ? 'Adding...' : 'Add Server'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: Spacing.lg },
    list: { gap: Spacing.sm, marginTop: Spacing.md },
    emptyText: {
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    previewType: { fontSize: FontSize.sm, color: c.textMuted },
    detailSection: { gap: Spacing.xs },
    detailLabel: {
      fontSize: FontSize.xs,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: Spacing.sm,
    },
    detailValue: { fontSize: FontSize.md, color: c.text },
    envRow: {
      fontSize: FontSize.sm,
      color: c.textSecondary,
      fontFamily: 'Menlo',
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    deleteText: { fontSize: FontSize.md, color: c.error },
    sectionTitle: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    formCard: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    formLabel: {
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
    typePicker: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    typeOption: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.inputBorder,
      alignItems: 'center',
    },
    typeOptionActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    typeOptionText: { fontSize: FontSize.sm, fontWeight: '600', color: c.textMuted },
    typeOptionTextActive: { color: '#FFFFFF' },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.lg,
    },
    addButtonDisabled: { opacity: 0.6 },
    addButtonText: { fontSize: FontSize.md, fontWeight: '600', color: '#FFFFFF' },
  });
