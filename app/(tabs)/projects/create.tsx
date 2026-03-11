import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCreateProject, useCloneProject, useGitCheck } from '../../../lib/api';
import {
  useColors, useThemedStyles, type ColorPalette,
  FontSize, Spacing, BorderRadius,
} from '../../../constants/theme';

type Mode = 'blank' | 'clone';

export default function CreateProjectScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>((params.mode as Mode) || 'blank');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const createProject = useCreateProject();
  const cloneProject = useCloneProject();
  const { data: gitCheck } = useGitCheck();

  const isPending = createProject.isPending || cloneProject.isPending;

  // Auto-fill name from URL
  const handleUrlChange = (text: string) => {
    setUrl(text);
    if (!name.trim()) {
      const match = text.match(/\/([^/]+?)(?:\.git)?\/?\s*$/);
      if (match) setName(match[1]);
    }
  };

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Project name is required.');
      return;
    }
    if (mode === 'clone' && !url.trim()) {
      Alert.alert('Missing URL', 'Repository URL is required.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const onSuccess = (project: { id: string; path: string }) => {
      router.replace({
        pathname: '/(tabs)/projects/[id]',
        params: {
          id: project.id,
          path: encodeURIComponent(project.path),
          newProject: 'true',
        },
      });
    };

    const onError = (err: unknown) => {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create project');
    };

    if (mode === 'blank') {
      createProject.mutate({ name: name.trim() }, { onSuccess, onError });
    } else {
      cloneProject.mutate(
        { url: url.trim(), name: name.trim() || undefined },
        { onSuccess, onError },
      );
    }
  };

  const showSshWarning = mode === 'clone' && gitCheck && (!gitCheck.ssh_key || !gitCheck.github_ssh);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'blank' && styles.modeButtonActive]}
          onPress={() => setMode('blank')}
        >
          <Ionicons
            name="document-outline"
            size={16}
            color={mode === 'blank' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.modeButtonText, mode === 'blank' && styles.modeButtonTextActive]}>
            Blank
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'clone' && styles.modeButtonActive]}
          onPress={() => setMode('clone')}
        >
          <Ionicons
            name="git-branch-outline"
            size={16}
            color={mode === 'clone' ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.modeButtonText, mode === 'clone' && styles.modeButtonTextActive]}>
            Clone
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'clone' && (
        <>
          <Text style={styles.label}>Repository URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={handleUrlChange}
            placeholder="https://github.com/user/repo.git"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {showSshWarning && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text style={styles.warningText}>
                SSH not configured — private repos may fail. Run `ccr doctor` on your server.
              </Text>
            </View>
          )}
        </>
      )}

      <Text style={styles.label}>Project Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="my-project"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.hint}>
        Will be created in ~/Developer/{name.trim() || '...'}
      </Text>

      <TouchableOpacity
        style={[styles.createButton, isPending && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={isPending}
        activeOpacity={0.8}
      >
        {isPending ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={styles.createButtonText}>
            {mode === 'blank' ? 'Create Project' : 'Clone Repository'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: Spacing.lg },
    modeToggle: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
      overflow: 'hidden',
      marginBottom: Spacing.lg,
    },
    modeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.md,
    },
    modeButtonActive: {
      backgroundColor: c.primaryBg15,
      borderBottomWidth: 2,
      borderBottomColor: c.primary,
    },
    modeButtonText: {
      fontSize: FontSize.md, fontWeight: '600', color: c.textMuted,
    },
    modeButtonTextActive: { color: c.primary },
    label: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: c.textMuted,
      marginBottom: Spacing.xs,
      marginTop: Spacing.lg,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      color: c.text,
      fontSize: FontSize.md,
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    hint: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      marginTop: Spacing.xs,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: c.warning + '15',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.sm,
    },
    warningText: {
      fontSize: FontSize.xs, color: c.warning, flex: 1,
    },
    createButton: {
      backgroundColor: c.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.xl,
    },
    createButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: c.buttonText },
  });
