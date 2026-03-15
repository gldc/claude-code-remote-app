import { useState, useRef, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, Keyboard, ActivityIndicator, Switch, StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated, { useSharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { useCreateCronJob, useProjectsList } from '../lib/api';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { shadowElevated } from '../constants/shadows';
import { SchedulePicker } from './SchedulePicker';
import type { CronExecutionMode } from '../lib/types';

export const CreateCronJobSheet = forwardRef<BottomSheet>(
  function CreateCronJobSheet(_props, ref) {
    const bottomSheetRef = useRef<BottomSheet>(null);
    useImperativeHandle(ref, () => bottomSheetRef.current!, []);
    const snapPoints = useMemo(() => ['8%', '85%'], []);
    const animatedIndex = useSharedValue(0);
    const colors = useColors();
    const styles = useThemedStyles(colors, makeStyles);

    const [name, setName] = useState('');
    const [projectDir, setProjectDir] = useState('');
    const [prompt, setPrompt] = useState('');
    const [schedule, setSchedule] = useState('0 9 * * *');
    const [executionMode, setExecutionMode] = useState<CronExecutionMode>('spawn');
    const [skipPermissions, setSkipPermissions] = useState(true);
    const [useSandbox, setUseSandbox] = useState(false);
    const [timeoutMinutes, setTimeoutMinutes] = useState('');
    const [promptTemplate, setPromptTemplate] = useState('');
    const [model, setModel] = useState('');
    const [maxBudget, setMaxBudget] = useState('');

    const createCronJob = useCreateCronJob();
    const { data: projects } = useProjectsList();

    const titleStyle = useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(animatedIndex.value, [0, 1], [0.65, 1]) }],
      opacity: interpolate(animatedIndex.value, [0, 1], [0.5, 1]),
    }));

    const resetForm = useCallback(() => {
      setName('');
      setProjectDir('');
      setPrompt('');
      setSchedule('0 9 * * *');
      setExecutionMode('spawn');
      setSkipPermissions(true);
      setUseSandbox(false);
      setTimeoutMinutes('');
      setPromptTemplate('');
      setModel('');
      setMaxBudget('');
    }, []);

    const handleCreate = () => {
      if (!name.trim() || !prompt.trim()) {
        Alert.alert('Missing Fields', 'Name and prompt are required.');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Keyboard.dismiss();

      const timeout = timeoutMinutes.trim() ? parseInt(timeoutMinutes, 10) : undefined;

      createCronJob.mutate(
        {
          name: name.trim(),
          schedule,
          execution_mode: executionMode,
          session_config: {
            name: name.trim(),
            project_dir: projectDir.trim() || 'cron',
            initial_prompt: promptTemplate.trim() || prompt.trim(),
            skip_permissions: skipPermissions,
            use_sandbox: useSandbox,
            model: model.trim() || undefined,
            max_budget_usd: maxBudget.trim() ? parseFloat(maxBudget) : undefined,
          },
          project_dir: projectDir.trim() || undefined,
          timeout_minutes: timeout,
          prompt_template: promptTemplate.trim() || undefined,
        },
        {
          onSuccess: () => {
            resetForm();
            bottomSheetRef.current?.snapToIndex(0);
          },
          onError: (err) => {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create cron job');
          },
        },
      );
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
            New Cron Job
          </Animated.Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., daily-code-review"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Schedule</Text>
          <SchedulePicker value={schedule} onChange={setSchedule} />

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
            placeholder="Leave blank for default cron folder"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Model (optional)</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="e.g., claude-sonnet-4-5-20250514"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Prompt</Text>
          <TextInput
            style={[styles.input, styles.promptInput]}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="What should Claude do?"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Execution Mode</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, executionMode === 'spawn' && styles.chipActive]}
              onPress={() => setExecutionMode('spawn')}
            >
              <Text style={[styles.chipText, executionMode === 'spawn' && styles.chipTextActive]}>
                New session each run
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, executionMode === 'persistent' && styles.chipActive]}
              onPress={() => setExecutionMode('persistent')}
            >
              <Text style={[styles.chipText, executionMode === 'persistent' && styles.chipTextActive]}>
                Reuse persistent session
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Prompt Template (optional)</Text>
          <TextInput
            style={[styles.input, styles.promptInput]}
            value={promptTemplate}
            onChangeText={setPromptTemplate}
            placeholder="e.g., Run check on {{date}} for {{branch}}"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            Variables: {'{{date}}'}, {'{{time}}'}, {'{{branch}}'}, {'{{project}}'}, {'{{run_number}}'}
          </Text>

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

          <Text style={styles.label}>Approval Timeout (minutes, optional)</Text>
          <TextInput
            style={styles.input}
            value={timeoutMinutes}
            onChangeText={setTimeoutMinutes}
            placeholder="Leave blank for no timeout"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>Max Budget USD (optional)</Text>
          <TextInput
            style={styles.input}
            value={maxBudget}
            onChangeText={setMaxBudget}
            placeholder="e.g., 5.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.createButton, createCronJob.isPending && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={createCronJob.isPending}
            activeOpacity={0.8}
          >
            {createCronJob.isPending ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={styles.createButtonText}>Create Cron Job</Text>
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
    sheetIndicator: { backgroundColor: c.cardBorder, width: 36 },
    sheetContent: { padding: Spacing.lg, paddingTop: 0 },
    sheetTitle: {
      fontSize: FontSize.xl, fontWeight: '700', color: c.text,
      marginBottom: Spacing.md, textAlign: 'center',
    },
    label: {
      fontSize: FontSize.sm, fontWeight: '600', color: c.textMuted,
      marginBottom: Spacing.xs, marginTop: Spacing.md,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    input: {
      backgroundColor: c.background, borderRadius: BorderRadius.md,
      padding: Spacing.md, color: c.text, fontSize: FontSize.md,
      borderWidth: 1, borderColor: c.inputBorder,
    },
    promptInput: { minHeight: 80, paddingTop: Spacing.md },
    hint: { fontSize: FontSize.xs, color: c.textMuted, marginTop: Spacing.xs },
    chipScroll: { marginBottom: Spacing.sm },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
    chip: {
      paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: c.cardBorder,
      backgroundColor: c.background, marginRight: Spacing.sm,
    },
    chipActive: { borderColor: c.primary, backgroundColor: c.primaryBg20 },
    chipText: { fontSize: FontSize.sm, color: c.textMuted },
    chipTextActive: { color: c.primary },
    toggleRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingVertical: Spacing.sm, marginTop: Spacing.sm,
    },
    toggleInfo: { flex: 1 },
    toggleLabel: { fontSize: FontSize.md, fontWeight: '600', color: c.text },
    toggleHint: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 1 },
    createButton: {
      backgroundColor: c.primary, borderRadius: BorderRadius.md,
      padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.lg,
    },
    createButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: c.buttonText },
  });
