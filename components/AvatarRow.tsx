import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize } from '../constants/theme';

interface AvatarRowProps {
  identities: string[];
  onAdd?: () => void;
  onRemove?: (identity: string) => void;
  maxVisible?: number;
}

function getInitials(identity: string): string {
  const parts = identity.trim().split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return identity.slice(0, 2).toUpperCase();
}

function getAvatarColor(identity: string): string {
  const COLORS = ['#C4613C', '#2D8A4E', '#0969DA', '#8250DF', '#BF8700', '#1B7C83', '#CF222E'];
  let hash = 0;
  for (let i = 0; i < identity.length; i++) hash = (hash * 31 + identity.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

const AVATAR_SIZE = 36;
const OVERLAP = -10;

export const AvatarRow = React.memo(function AvatarRow({
  identities, onAdd, onRemove, maxVisible = 5,
}: AvatarRowProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const visible = identities.slice(0, maxVisible);
  const overflow = identities.length - maxVisible;

  return (
    <View style={styles.container}>
      {visible.map((identity, idx) => (
        <TouchableOpacity
          key={identity}
          onLongPress={onRemove ? () => onRemove(identity) : undefined}
          activeOpacity={onRemove ? 0.7 : 1}
          style={[
            styles.avatar,
            { backgroundColor: getAvatarColor(identity), zIndex: visible.length - idx },
            idx > 0 && { marginLeft: OVERLAP },
          ]}
        >
          <Text style={styles.initials}>{getInitials(identity)}</Text>
        </TouchableOpacity>
      ))}
      {overflow > 0 && (
        <View style={[styles.avatar, styles.overflowAvatar, { marginLeft: OVERLAP }]}>
          <Text style={styles.overflowText}>+{overflow}</Text>
        </View>
      )}
      {onAdd && (
        <TouchableOpacity onPress={onAdd} style={[styles.avatar, styles.addButton, identities.length > 0 && { marginLeft: OVERLAP }]}>
          <SymbolView name="plus" size={16} tintColor={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: c.background,
  },
  initials: { fontSize: FontSize.xs, fontWeight: '700', color: c.buttonText },
  overflowAvatar: { backgroundColor: c.cardBorder },
  overflowText: { fontSize: FontSize.xs, fontWeight: '600', color: c.textMuted },
  addButton: { backgroundColor: c.card, borderStyle: 'dashed' as const, borderColor: c.primary },
});
