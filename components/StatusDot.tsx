import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useColors, type ColorPalette } from '../constants/theme';

interface StatusDotProps {
  status: 'online' | 'warning' | 'offline' | 'unknown';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

const STATUS_MAP: Record<StatusDotProps['status'], keyof ColorPalette> = {
  online: 'success',
  warning: 'warning',
  offline: 'error',
  unknown: 'textMuted',
};

export const StatusDot = React.memo(function StatusDot({
  status, size = 'sm', pulse = false,
}: StatusDotProps) {
  const colors = useColors();
  const dotSize = size === 'sm' ? 8 : 12;
  const color = colors[STATUS_MAP[status]] as string;
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (pulse) {
      opacity.value = withRepeat(
        withTiming(0.3, { duration: 1000 }),
        -1,
        true,
      );
    } else {
      cancelAnimation(opacity);
      opacity.value = 1;
    }
  }, [pulse, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
});
