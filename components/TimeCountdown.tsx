import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { useColors, FontSize } from '../constants/theme';

interface TimeCountdownProps {
  /** ISO 8601 timestamp when the window resets */
  resetsAt: string;
  prefix?: string;
}

function secondsUntil(isoDate: string): number {
  return Math.max(0, Math.floor((new Date(isoDate).getTime() - Date.now()) / 1000));
}

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'now';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

export const TimeCountdown = React.memo(function TimeCountdown({
  resetsAt, prefix = 'Resets in',
}: TimeCountdownProps) {
  const colors = useColors();
  const [remaining, setRemaining] = useState(() => secondsUntil(resetsAt));

  useEffect(() => {
    setRemaining(secondsUntil(resetsAt));
    const interval = setInterval(() => {
      setRemaining(secondsUntil(resetsAt));
    }, 60000);
    return () => clearInterval(interval);
  }, [resetsAt]);

  return (
    <Text style={{ fontSize: FontSize.xs, color: colors.textMuted }}>
      {prefix} {formatCountdown(remaining)}
    </Text>
  );
});
