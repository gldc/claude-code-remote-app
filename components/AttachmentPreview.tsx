import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';

export interface PendingAttachment {
  uri: string;
  name: string;
  type: string;
}

interface Props {
  attachments: PendingAttachment[];
  onRemove: (index: number) => void;
}

export function AttachmentPreview({ attachments, onRemove }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  if (!attachments.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {attachments.map((att, i) => {
        const isImage = att.type.startsWith('image/');
        return (
          <View key={`${att.name}-${i}`} style={styles.item}>
            {isImage ? (
              <Image source={{ uri: att.uri }} style={styles.thumbnail} />
            ) : (
              <View style={styles.fileBadge}>
                <Ionicons name="document" size={20} color={colors.textMuted} />
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>
              {att.name}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(i)}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      maxHeight: 80,
    },
    content: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      gap: Spacing.sm,
    },
    item: {
      width: 64,
      alignItems: 'center',
      position: 'relative',
    },
    thumbnail: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius.md,
      backgroundColor: c.card,
    },
    fileBadge: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius.md,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      marginTop: 2,
      width: 60,
      textAlign: 'center',
    },
    removeButton: {
      position: 'absolute',
      top: -4,
      right: -2,
    },
  });
