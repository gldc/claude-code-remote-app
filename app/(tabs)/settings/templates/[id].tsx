import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useTemplatesList, useCreateTemplate, useUpdateTemplate, useDeleteTemplate,
} from '../../../../lib/api';
import { Colors, FontSize, Spacing, BorderRadius } from '../../../../constants/theme';

export default function TemplateEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const { data: templates } = useTemplatesList();
  const template = isNew ? null : templates?.find((t) => t.id === id);

  const [name, setName] = useState('');
  const [projectDir, setProjectDir] = useState('');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [model, setModel] = useState('');
  const [budgetCap, setBudgetCap] = useState('');

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  useEffect(() => {
    if (template) {
      setName(template.name);
      setProjectDir(template.project_dir || '');
      setInitialPrompt(template.initial_prompt);
      setModel(template.model || '');
      setBudgetCap(template.max_budget_usd ? String(template.max_budget_usd) : '');
    }
  }, [template]);

  const handleSave = () => {
    if (!name.trim() || !initialPrompt.trim()) {
      Alert.alert('Missing Fields', 'Name and prompt are required.');
      return;
    }

    const data = {
      name: name.trim(),
      project_dir: projectDir.trim() || undefined,
      initial_prompt: initialPrompt.trim(),
      model: model.trim() || undefined,
      max_budget_usd: budgetCap ? parseFloat(budgetCap) : undefined,
    };

    if (isNew) {
      createTemplate.mutate(data, {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create template'),
      });
    } else {
      updateTemplate.mutate({ id, ...data }, {
        onSuccess: () => router.back(),
        onError: (err) =>
          Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update template'),
      });
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Template', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTemplate.mutate(id, {
            onSuccess: () => router.back(),
          });
        },
      },
    ]);
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: isNew ? 'New Template' : 'Edit Template' }} />

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Template name"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Project Directory (optional)</Text>
      <TextInput
        style={styles.input}
        value={projectDir}
        onChangeText={setProjectDir}
        placeholder="/path/to/project"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Initial Prompt</Text>
      <TextInput
        style={[styles.input, styles.promptInput]}
        value={initialPrompt}
        onChangeText={setInitialPrompt}
        placeholder="What should Claude do?"
        placeholderTextColor={Colors.textMuted}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>Model (optional)</Text>
      <TextInput
        style={styles.input}
        value={model}
        onChangeText={setModel}
        placeholder="e.g., claude-sonnet-4-6"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Budget Cap USD (optional)</Text>
      <TextInput
        style={styles.input}
        value={budgetCap}
        onChangeText={setBudgetCap}
        placeholder="e.g., 5.00"
        placeholderTextColor={Colors.textMuted}
        keyboardType="decimal-pad"
      />

      <TouchableOpacity
        style={[styles.saveButton, isPending && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={isPending}
        activeOpacity={0.8}
      >
        {isPending ? (
          <ActivityIndicator color={Colors.text} />
        ) : (
          <Text style={styles.saveButtonText}>{isNew ? 'Create Template' : 'Save Changes'}</Text>
        )}
      </TouchableOpacity>

      {!isNew && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={18} color={Colors.error} />
          <Text style={styles.deleteButtonText}>Delete Template</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: Spacing.xxl * 2 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    marginTop: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  promptInput: { minHeight: 120, paddingTop: Spacing.md },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  saveButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.error },
});
