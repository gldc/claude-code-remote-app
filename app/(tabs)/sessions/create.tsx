import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCreateSession, useProjectsList, useTemplatesList } from '../../../lib/api';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../../constants/theme';
import { ModelPicker } from '../../../components/ModelPicker';
import { ChipSelector } from '../../../components/ChipSelector';

const TOOL_OPTIONS = [
  { value: 'Read', label: 'Read' },
  { value: 'Write', label: 'Write' },
  { value: 'Edit', label: 'Edit' },
  { value: 'Bash', label: 'Bash' },
  { value: 'Glob', label: 'Glob' },
  { value: 'Grep', label: 'Grep' },
  { value: 'WebFetch', label: 'WebFetch' },
  { value: 'WebSearch', label: 'WebSearch' },
  { value: 'Agent', label: 'Agent' },
];

export default function CreateSessionScreen() {
  const [name, setName] = useState('');
  const [projectDir, setProjectDir] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const createSession = useCreateSession();
  const { data: projects } = useProjectsList();
  const { data: templates } = useTemplatesList();

  const handleCreate = () => {
    if (!name.trim() || !projectDir.trim() || !prompt.trim()) {
      Alert.alert('Missing Fields', 'Name, project, and prompt are required.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    createSession.mutate(
      {
        name: name.trim(),
        project_dir: projectDir.trim(),
        initial_prompt: prompt.trim(),
        template_id: selectedTemplate || undefined,
        model: selectedModel || undefined,
        allowed_tools: allowedTools.length > 0 ? allowedTools : undefined,
      },
      {
        onSuccess: (session) => {
          router.replace(`/(tabs)/sessions/${session.id}`);
        },
        onError: (err) => {
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create session');
        },
      }
    );
  };

  const applyTemplate = (templateId: string) => {
    const t = templates?.find((tmpl) => tmpl.id === templateId);
    if (t) {
      setSelectedTemplate(templateId);
      if (t.project_dir) setProjectDir(t.project_dir);
      if (t.initial_prompt) setPrompt(t.initial_prompt);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Session Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., fix-auth-bug"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Project Directory</Text>
      {projects && projects.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectPicker}>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.projectChip,
                projectDir === p.path && styles.projectChipActive,
              ]}
              onPress={() => setProjectDir(p.path)}
            >
              <Text
                style={[
                  styles.projectChipText,
                  projectDir === p.path && styles.projectChipTextActive,
                ]}
              >
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

      <Text style={styles.label}>Model</Text>
      <ModelPicker selected={selectedModel} onSelect={setSelectedModel} />

      <ChipSelector
        label="Allowed Tools"
        options={TOOL_OPTIONS}
        selected={allowedTools}
        onToggle={(tool) =>
          setAllowedTools((prev) =>
            prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
          )
        }
      />

      {templates && templates.length > 0 && (
        <>
          <Text style={styles.label}>Template (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectPicker}>
            {templates.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.projectChip,
                  selectedTemplate === t.id && styles.projectChipActive,
                ]}
                onPress={() => applyTemplate(t.id)}
              >
                <Text
                  style={[
                    styles.projectChipText,
                    selectedTemplate === t.id && styles.projectChipTextActive,
                  ]}
                >
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

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, padding: Spacing.lg },
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
    promptInput: { minHeight: 120, paddingTop: Spacing.md },
    projectPicker: { marginBottom: Spacing.sm },
    projectChip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.card,
      marginRight: Spacing.sm,
    },
    projectChipActive: {
      borderColor: c.primary,
      backgroundColor: c.primary + '20',
    },
    projectChipText: { fontSize: FontSize.sm, color: c.textMuted },
    projectChipTextActive: { color: c.primary },
    createButton: {
      backgroundColor: c.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      alignItems: 'center',
      marginTop: Spacing.xl,
    },
    createButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: c.buttonText },
  });
