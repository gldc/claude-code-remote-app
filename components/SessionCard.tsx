import { useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Alert, Animated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBadge } from './StatusBadge';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { shadowCard } from '../constants/shadows';
import type { SessionSummary } from '../lib/types';
import { useShowCost, useHideSession, useHostname } from '../lib/api';

interface Props {
  session: SessionSummary;
  onDelete: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
}

export function SessionCard({ session, onDelete, onArchive }: Props) {
  const swipeableRef = useRef<Swipeable>(null);
  const showCost = useShowCost();
  const hostname = useHostname();
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const hideSession = useHideSession();

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (session.source === 'native') {
      Alert.alert(
        'Hide Session',
        `Permanently hide "${session.name}"? It will no longer appear in the list.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => swipeableRef.current?.close() },
          {
            text: 'Hide',
            style: 'destructive',
            onPress: () => hideSession.mutate({ sessionId: session.id, permanent: true }),
          },
        ],
      );
    } else {
      Alert.alert(
        'Delete Session',
        `Delete "${session.name}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => swipeableRef.current?.close() },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(session.id),
          },
        ],
      );
    }
  };

  const handleArchive = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (session.source === 'native') {
      hideSession.mutate({ sessionId: session.id });
    } else {
      onArchive(session.id, !session.archived);
    }
    swipeableRef.current?.close();
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });
    return (
      <RectButton style={styles.deleteAction} onPress={handleDelete}>
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <Ionicons name="trash-outline" size={22} color={colors.buttonText} />
          <Text style={styles.actionText}>Delete</Text>
        </Animated.View>
      </RectButton>
    );
  };

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });
    return (
      <RectButton style={styles.archiveAction} onPress={handleArchive}>
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <Ionicons
            name={session.archived ? 'arrow-undo-outline' : 'archive-outline'}
            size={22}
            color={colors.buttonText}
          />
          <Text style={styles.actionText}>
            {session.archived ? 'Unarchive' : 'Archive'}
          </Text>
        </Animated.View>
      </RectButton>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
    >
      <TouchableOpacity
        style={[styles.card, session.archived && styles.cardArchived]}
        onPress={() => router.push(`/(tabs)/sessions/${session.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 }}>
            {session.cron_job_id && (
              <Ionicons name="timer-outline" size={14} color={colors.primary} />
            )}
            <Text style={[styles.name, session.archived && styles.textArchived]} numberOfLines={1}>
              {session.name}
            </Text>
            {session.source === 'native' && (
              <View style={{ backgroundColor: colors.toolBg, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, marginLeft: 6, maxWidth: 120 }}>
                <Text style={{ fontSize: 10, color: colors.textSecondary }} numberOfLines={1}>{hostname ?? 'Terminal'}</Text>
              </View>
            )}
          </View>
          {session.native_pid ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' }} />
              <Text style={{ fontSize: 11, color: '#22c55e' }}>Live</Text>
            </View>
          ) : (
            <View style={{ marginLeft: 8 }}>
              <StatusBadge status={session.status} />
            </View>
          )}
        </View>
        <Text style={styles.project} numberOfLines={1}>
          {session.project_dir.split('/').pop()}
        </Text>
        {session.last_message_preview && (
          <Text style={styles.preview} numberOfLines={2}>
            {session.last_message_preview}
          </Text>
        )}
        <View style={styles.footer}>
          {showCost && <Text style={styles.cost}>${session.total_cost_usd.toFixed(2)}</Text>}
          <Text style={styles.time}>
            {new Date(session.updated_at).toLocaleTimeString()}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.cardBorder,
      ...shadowCard,
    },
    cardArchived: {
      opacity: 0.6,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    name: {
      fontSize: FontSize.lg,
      fontWeight: '600',
      color: c.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    textArchived: {
      color: c.textMuted,
    },
    project: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginBottom: Spacing.sm,
    },
    preview: {
      fontSize: FontSize.sm,
      color: c.textSecondary,
      marginBottom: Spacing.sm,
      lineHeight: 19,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    cost: {
      fontSize: FontSize.sm,
      color: c.primary,
      fontWeight: '500',
    },
    time: {
      fontSize: FontSize.sm,
      color: c.textMuted,
    },
    deleteAction: {
      backgroundColor: c.error,
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      marginBottom: Spacing.sm,
      marginRight: Spacing.lg,
      borderRadius: BorderRadius.lg,
    },
    archiveAction: {
      backgroundColor: c.textMuted,
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.lg,
      borderRadius: BorderRadius.lg,
    },
    actionContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
    },
    actionText: {
      color: c.buttonText,
      fontSize: FontSize.xs,
      fontWeight: '600',
    },
  });
