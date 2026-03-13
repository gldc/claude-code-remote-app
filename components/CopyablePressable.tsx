import React, { useRef, useCallback } from 'react';
import { Pressable, Animated, type ViewStyle, type StyleProp } from 'react-native';
import { useCopyText } from '../lib/useCopyText';

interface Props {
  text: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function CopyablePressable({ text, children, style }: Props) {
  const copyText = useCopyText();
  const opacity = useRef(new Animated.Value(1)).current;

  const handleLongPress = useCallback(() => {
    copyText(text);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.5, duration: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [text, copyText, opacity]);

  return (
    <Pressable onLongPress={handleLongPress}>
      <Animated.View style={[style, { opacity }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
