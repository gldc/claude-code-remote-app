import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, TextInput, Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useWorkflow, useRunWorkflow, useAddWorkflowStep, useProjectsList } from '../../../../lib/api';
import { DAGView } from '../../../../components/DAGView';
import { StatusBadge } from '../../../../components/StatusBadge';
import { ModelPicker } from '../../../../components/ModelPicker';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../../../../constants/theme';
import type { WorkflowStepStatus } from '../../../../lib/types';

export default function WorkflowDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const navigation = useNavigation();

  const { data: workflow, isLoading } = useWorkflow(id ?? '');
  const runWorkflow = useRunWorkflow(id ?? '');
  const addStep = useAddWorkflowStep(id ?? '');
  const { data: projects } = useProjectsList();

  const [showForm, setShowForm] = useState(false);
  const [stepName, setStepName] = useState('');
  const [projectDir, setProjectDir] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedDeps, setSelectedDeps] = useState<string[]>([]);

  useEffect(() => {
    if (workflow) {
      navigation.setOptions({
        title: workflow.name,
        headerRight: () => (
          <StatusBadge status={workflow.status as any} />
        ),
      });
    }
  }, [workflow, navigation]);

  const resetForm = () => {
    setStepName('');
    setProjectDir('');
    setPrompt('');
    setSelectedModel(null);
    setSelectedDeps([]);
  };

  const handleAddStep = () => {
    if (!stepName.trim() || !projectDir.trim() || !prompt.trim()) {
      Alert.alert('Missing Fields', 'Name, project, and prompt are required.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addStep.mutate(
      {
        session_config: {
          name: stepName.trim(),
          project_dir: projectDir.trim(),
          initial_prompt: prompt.trim(),
          model: selectedModel || undefined,
        },
        depends_on: selectedDeps,
      },
      {
        onSuccess: () => {
          resetForm();
          setShowForm(false);
        },
        onError: (err) => {
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add step');
        },
      }
    );
  };

  const toggleDep = (stepId: string) => {
    setSelectedDeps((prev) =>
      prev.includes(stepId) ? prev.filter((d) => d !== stepId) : [...prev, stepId]
    );
  };

  if (isLoading || !workflow) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      </View>
    );
  }

  const dagNodes = workflow.steps.map((step) => ({
    id: step.id,
    label: step.session_config.name || step.id,
    status: step.status as WorkflowStepStatus,
    dependsOn: step.depends_on,
  }));

  const isRunning = workflow.status === 'running';

  const stepStatusColor = (status: WorkflowStepStatus) => {
    const map: Record<WorkflowStepStatus, string> = {
      pending: colors.textMuted,
      running: colors.success,
      completed: colors.textMuted,
      error: colors.error,
    };
    return map[status] ?? colors.textMuted;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dependency Graph</Text>
        {dagNodes.length > 0 ? (
          <DAGView nodes={dagNodes} />
        ) : (
          <Text style={styles.emptyText}>No steps defined</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Steps ({workflow.steps.length})</Text>
        {workflow.steps.map((step) => (
          <View key={step.id} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepDot, { backgroundColor: stepStatusColor(step.status) }]} />
              <Text style={styles.stepName} numberOfLines={1}>
                {step.session_config.name || step.id}
              </Text>
              <Text style={[styles.stepStatus, { color: stepStatusColor(step.status) }]}>
                {step.status}
              </Text>
            </View>
            {step.depends_on.length > 0 && (
              <Text style={styles.stepDeps}>
                Depends on: {step.depends_on.join(', ')}
              </Text>
            )}
            {step.session_id && (
              <Text style={styles.stepSession}>Session: {step.session_id}</Text>
            )}
          </View>
        ))}

        {!showForm ? (
          <TouchableOpacity
            style={styles.addStepButton}
            activeOpacity={0.7}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addStepButtonText}>Add Step</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Step</Text>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm(); }}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={stepName}
              onChangeText={setStepName}
              placeholder="e.g., run-tests"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Project Directory</Text>
            {projects && projects.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
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

            <Text style={styles.label}>Prompt</Text>
            <TextInput
              style={[styles.input, styles.promptInput]}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="What should this step do?"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Model</Text>
            <ModelPicker selected={selectedModel} onSelect={setSelectedModel} />

            {workflow.steps.length > 0 && (
              <>
                <Text style={styles.label}>Depends On</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {workflow.steps.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, selectedDeps.includes(s.id) && styles.chipActive]}
                      onPress={() => toggleDep(s.id)}
                    >
                      <Text style={[styles.chipText, selectedDeps.includes(s.id) && styles.chipTextActive]}>
                        {s.session_config.name || s.id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={[styles.submitButton, addStep.isPending && { opacity: 0.6 }]}
              onPress={handleAddStep}
              disabled={addStep.isPending}
              activeOpacity={0.8}
            >
              {addStep.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Add Step</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.runButton, isRunning && styles.runButtonDisabled]}
        activeOpacity={0.8}
        onPress={() => runWorkflow.mutate()}
        disabled={isRunning || runWorkflow.isPending}
      >
        {runWorkflow.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color="#fff" />
            <Text style={styles.runButtonText}>
              {isRunning ? 'Running...' : 'Run Workflow'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    loader: { flex: 1, justifyContent: 'center' },
    content: { padding: Spacing.lg, paddingBottom: 40 },
    section: { marginBottom: Spacing.xl },
    sectionTitle: {
      fontSize: FontSize.lg, fontWeight: '700', color: c.text,
      marginBottom: Spacing.md,
    },
    emptyText: { fontSize: FontSize.sm, color: c.textMuted },
    stepCard: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    stepHeader: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    },
    stepDot: { width: 8, height: 8, borderRadius: 4 },
    stepName: { fontSize: FontSize.md, fontWeight: '600', color: c.text, flex: 1 },
    stepStatus: { fontSize: FontSize.xs, fontWeight: '600' },
    stepDeps: { fontSize: FontSize.xs, color: c.textMuted, marginTop: Spacing.xs },
    stepSession: { fontSize: FontSize.xs, color: c.textSecondary, marginTop: 2 },
    // Add Step button
    addStepButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: c.primary,
      borderStyle: 'dashed',
      marginTop: Spacing.sm,
    },
    addStepButtonText: {
      fontSize: FontSize.md, fontWeight: '600', color: c.primary,
    },
    // Form
    formCard: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      padding: Spacing.md,
      marginTop: Spacing.sm,
    },
    formHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    formTitle: { fontSize: FontSize.md, fontWeight: '700', color: c.text },
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
    chipRow: { marginBottom: Spacing.sm },
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
      backgroundColor: c.primary + '20',
    },
    chipText: { fontSize: FontSize.sm, color: c.textMuted },
    chipTextActive: { color: c.primary },
    submitButton: {
      backgroundColor: c.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    submitButtonText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
    // Run button
    runButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: c.primary,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
    },
    runButtonDisabled: { opacity: 0.5 },
    runButtonText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  });
