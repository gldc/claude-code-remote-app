import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMCPServers, useMCPHealthCheck } from '../../../../lib/api';
import type { MCPServer } from '../../../../lib/types';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../../../../constants/theme';

function HealthDot({ healthy }: { healthy?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: healthy === undefined ? colors.textMuted : healthy ? colors.success : colors.error,
      }}
    />
  );
}

function ServerCard({ server }: { server: MCPServer }) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: health } = useMCPHealthCheck(server.name);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.serverName}>{server.name}</Text>
        <HealthDot healthy={health?.healthy} />
      </View>
      <Text style={styles.serverType}>{server.type}</Text>
      {server.scope !== 'user' && (
        <Text style={styles.serverScope}>{server.scope}</Text>
      )}
    </View>
  );
}

export default function SessionMCPScreen() {
  const { projectDir } = useLocalSearchParams<{ id: string; projectDir: string }>();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: servers, isLoading } = useMCPServers(projectDir);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'MCP Servers' }} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={servers || []}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => <ServerCard server={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No MCP servers configured</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl },
    list: { padding: Spacing.md },
    card: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    serverName: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.text,
      flex: 1,
    },
    serverType: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginTop: Spacing.xs,
    },
    serverScope: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      marginTop: Spacing.xs,
    },
    emptyText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
  });
