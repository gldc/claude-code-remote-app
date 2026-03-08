import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { useColors, FontSize } from '../constants/theme';

interface TimeCountdownProps {
  seconds: number;
  prefix?: string;
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
  seconds, prefix = 'Resets in',
}: TimeCountdownProps) {
  const colors = useColors();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 60));
    }, 60000);
    return () => clearInterval(interval);
  }, [seconds]);

  return (
    <Text style={{ fontSize: FontSize.xs, color: colors.textMuted }}>
      {prefix} {formatCountdown(remaining)}
    </Text>
  );
});
