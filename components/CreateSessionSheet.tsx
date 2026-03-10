import { useState, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, Keyboard, ActivityIndicator, Switch, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated, {
  useSharedValue, useAnimatedStyle, interpolate,
} from 'react-native-reanimated';
import { useCreateSession, useProjectsList, useTemplatesList } from '../lib/api';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { shadowElevated } from '../constants/shadows';

interface Props {
  projectDir?: string;
}

export const CreateSessionSheet = forwardRef<BottomSheet, Props>(
  function CreateSessionSheet({ projectDir: fixedProjectDir }, ref) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  useImperativeHandle(ref, () => bottomSheetRef.current!, []);
  const snapPoints = useMemo(() => ['8%', '80%'], []);
  const animatedIndex = useSharedValue(0);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const [name, setName] = useState('');
  const [projectDir, setProjectDir] = useState(fixedProjectDir ?? '');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [skipPermissions, setSkipPermissions] = useState(true);
  const [useSandbox, setUseSandbox] = useState(false);

  const createSession = useCreateSession();
  const { data: projects } = useProjectsList();
  const { data: templates } = useTemplatesList();

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(animatedIndex.value, [0, 1], [0.65, 1]) }],
    opacity: interpolate(animatedIndex.value, [0, 1], [0.5, 1]),
  }));

  const resetForm = useCallback(() => {
    setName('');
    setProjectDir(fixedProjectDir ?? '');
    setPrompt('');
    setSelectedTemplate(null);
    setSkipPermissions(true);
    setUseSandbox(false);
  }, [fixedProjectDir]);

  const handleCreate = () => {
    if (!name.trim() || !projectDir.trim() || !prompt.trim()) {
      Alert.alert('Missing Fields', 'Name, project, and prompt are required.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Keyboard.dismiss();
    createSession.mutate(
      {
        name: name.trim(),
        project_dir: projectDir.trim(),
        initial_prompt: prompt.trim(),
        template_id: selectedTemplate || undefined,
        skip_permissions: skipPermissions,
        use_sandbox: useSandbox,
      },
      {
        onSuccess: (session) => {
          resetForm();
          bottomSheetRef.current?.snapToIndex(0);
          router.push(`/(tabs)/sessions/${session.id}`);
        },
        onError: (err) => {
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create session');
        },
      },
    );
  };

  const applyTemplate = (templateId: string) => {
    const t = templates?.find((tmpl) => tmpl.id === templateId);
    if (t) {
      setSelectedTemplate(templateId);
      if (t.project_dir && !fixedProjectDir) setProjectDir(t.project_dir);
      if (t.initial_prompt) setPrompt(t.initial_prompt);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
      animatedIndex={animatedIndex}
    >
      <BottomSheetScrollView style={styles.sheetContent} keyboardShouldPersistTaps="handled">
        <Animated.Text style={[styles.sheetTitle, titleStyle]}>
          New Session
        </Animated.Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., fix-auth-bug"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
        />

        {!fixedProjectDir && (
          <>
            <Text style={styles.label}>Project</Text>
            {projects && projects.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {projects.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, projectDir === p.path && styles.chipActive]}
                    onPress={() => setProjectDir(p.path)}
                  >
                    <Text style={[styles.chipText, projectDir === p.path && styles.chipTextActive]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TextInput
              style={styles.input}
              value={projectDir}
              onChangeText={setProjectDir}
              placeholder="/path/to/project"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
          </>
        )}

        {templates && templates.length > 0 && (
          <>
            <Text style={styles.label}>Template</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {templates.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, selectedTemplate === t.id && styles.chipActive]}
                  onPress={() => applyTemplate(t.id)}
                >
                  <Text style={[styles.chipText, selectedTemplate === t.id && styles.chipTextActive]}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={styles.label}>Prompt</Text>
        <TextInput
          style={[styles.input, styles.promptInput]}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="What should Claude work on?"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Skip Permissions</Text>
            <Text style={styles.toggleHint}>Auto-approve all tool use</Text>
          </View>
          <Switch
            value={skipPermissions}
            onValueChange={setSkipPermissions}
            trackColor={{ false: colors.cardBorder, true: colors.warning + '60' }}
            thumbColor={skipPermissions ? colors.warning : colors.textMuted}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Sandbox</Text>
            <Text style={styles.toggleHint}>Run in isolated environment</Text>
          </View>
          <Switch
            value={useSandbox}
            onValueChange={setUseSandbox}
            trackColor={{ false: colors.cardBorder, true: colors.primary + '60' }}
            thumbColor={useSandbox ? colors.primary : colors.textMuted}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, createSession.isPending && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={createSession.isPending}
          activeOpacity={0.8}
        >
          {createSession.isPending ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={styles.createButtonText}>Create Session</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: Spacing.xxl }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
  },
);

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    sheetBackground: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      ...shadowElevated,
    },
    sheetIndicator: {
      backgroundColor: c.cardBorder,
      width: 36,
    },
    sheetContent: {
      padding: Spacing.lg,
      paddingTop: 0,
    },
    sheetTitle: {
      fontSize: FontSize.xl,
      fontWeight: '700',
      color: c.text,
      marginBottom: Spacing.md,
      textAlign: 'center',
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
    promptInput: { minHeight: 80, paddingTop: Spacing.md },
    chipScroll: { marginBottom: Spacing.sm },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.background,
      marginRight: Spacing.sm,
    },
    chipActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryBg20,
    },
    chipText: { fontSize: FontSize.sm, color: c.textMuted },
    chipTextActive: { color: c.primary },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      marginTop: Spacing.sm,
    },
    toggleInfo: { flex: 1 },
    toggleLabel: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.text,
    },
    toggleHint: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      marginTop: 1,
    },
    createButton: {
      backgroundColor: c.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    createButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: c.buttonText },
  });
