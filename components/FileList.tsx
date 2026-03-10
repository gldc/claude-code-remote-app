import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize } from '../constants/theme';

interface FileListProps {
  files: { path: string; status: string }[];
  onSelect?: (path: string) => void;
}

function getStatusColor(status: string, c: ColorPalette): string {
  switch (status) {
    case 'M': return c.warning;
    case 'A': return c.success;
    case 'D': return c.error;
    case 'R': return c.gitRenamed;
    case '?': return c.gitUntracked;
    default: return c.textMuted;
  }
}

function getDisplayPath(fullPath: string): string {
  const parts = fullPath.split('/');
  if (parts.length <= 2) return fullPath;
  return '.../' + parts.slice(-2).join('/');
}

const FileRow = React.memo(function FileRow({
  file, onSelect, colors, styles,
}: {
  file: { path: string; status: string };
  onSelect?: (path: string) => void;
  colors: ColorPalette;
  styles: ReturnType<typeof makeStyles>;
}) {
  const statusColor = getStatusColor(file.status, colors);
  const Wrapper = onSelect ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onSelect ? () => onSelect(file.path) : undefined}
      style={styles.row}
      activeOpacity={0.7}
    >
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <Text style={styles.status}>{file.status}</Text>
      <Text style={styles.path} numberOfLines={1}>{getDisplayPath(file.path)}</Text>
    </Wrapper>
  );
});

export const FileList = React.memo(function FileList({ files, onSelect }: FileListProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const renderItem = useCallback(({ item }: { item: { path: string; status: string } }) => (
    <FileRow file={item} onSelect={onSelect} colors={colors} styles={styles} />
  ), [onSelect, colors, styles]);

  const keyExtractor = useCallback((item: { path: string }) => item.path, []);

  return (
    <FlatList
      data={files}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      scrollEnabled={false}
    />
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  status: { fontSize: FontSize.xs, color: c.textMuted, fontFamily: 'Menlo', width: 16 },
  path: { fontSize: FontSize.sm, color: c.text, flex: 1 },
});
