import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface ExpandableCardProps {
  title: string;
  icon?: string;
  badge?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  preview?: React.ReactNode;
}

export const ExpandableCard = React.memo(function ExpandableCard({
  title, icon, badge, defaultExpanded = false, children, preview,
}: ExpandableCardProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(defaultExpanded ? 90 : 0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    setExpanded(!expanded);
    rotation.value = withTiming(expanded ? 0 : 90, { duration: 200 });
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={toggle} style={styles.header} activeOpacity={0.7}>
        {icon && <SymbolView name={icon as any} size={18} tintColor={colors.textMuted} />}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {badge && <Text style={styles.badge}>{badge}</Text>}
        <Animated.View style={chevronStyle}>
          <SymbolView name="chevron.right" size={14} tintColor={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>
      {!expanded && preview}
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  card: { backgroundColor: c.toolBg, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.cardBorder, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  title: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: c.text },
  badge: { fontSize: FontSize.xs, color: c.textMuted, backgroundColor: c.cardBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
});
