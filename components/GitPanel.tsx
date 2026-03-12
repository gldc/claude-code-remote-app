import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGitStatus, useGitDiff } from '../lib/api';
import { ExpandableCard } from './ExpandableCard';
import { FileList } from './FileList';
import { DiffViewer } from './DiffViewer';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface GitPanelProps {
  sessionId: string;
}

export function GitPanel({ sessionId }: GitPanelProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { data: gitStatus } = useGitStatus(sessionId);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { data: diffData } = useGitDiff(sessionId, selectedFile ?? undefined);

  if (!gitStatus?.branch) return null;

  const totalChanges =
    (gitStatus.counts.modified ?? 0) +
    (gitStatus.counts.staged ?? 0) +
    (gitStatus.counts.untracked ?? 0);

  const allFiles = [
    ...gitStatus.modified,
    ...gitStatus.staged,
    ...gitStatus.untracked.map((p) => ({ path: p, status: '?' })),
  ];

  return (
    <>
      <ExpandableCard
        title={gitStatus.branch}
        icon={{ ios: 'arrow.triangle.branch', android: 'fork_right' }}
        badge={totalChanges > 0 ? `${totalChanges} changes` : undefined}
      >
        <FileList files={allFiles} onSelect={setSelectedFile} />
      </ExpandableCard>

      <Modal visible={!!selectedFile} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedFile?.split('/').pop()}
            </Text>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {diffData?.diff ? (
              <DiffViewer diff={diffData.diff} />
            ) : (
              <Text style={styles.emptyText}>No diff available</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: c.background },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '600', color: c.text, flex: 1 },
    closeButton: { fontSize: FontSize.md, color: c.primary, fontWeight: '600' },
    modalContent: { flex: 1, padding: Spacing.md },
    emptyText: { fontSize: FontSize.md, color: c.textMuted, textAlign: 'center', padding: Spacing.xl },
  });
