import { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { CommandAutocomplete } from './CommandAutocomplete';
import type { SlashCommand } from '../constants/commands';

interface InputBarProps {
  onSend: (text: string) => void;
  onCommand?: (command: SlashCommand) => void;
  disabled?: boolean;
  placeholder?: string;
  initialText?: string | null;
}

export function InputBar({ onSend, onCommand, disabled, placeholder, initialText }: InputBarProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed);
    setText('');
  };

  const handleCommandSelect = (command: SlashCommand) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
    if (command.type === 'app') {
      onCommand?.(command);
    } else {
      onSend(`/${command.name}`);
    }
  };

  const showAutocomplete = text.startsWith('/') && text.trim().length > 0;
  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      {showAutocomplete && (
        <CommandAutocomplete filter={text.trim()} onSelect={handleCommandSelect} />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder || 'Message Claude...'}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={10000}
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, canSend && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color={canSend ? colors.buttonText : colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xl,
      backgroundColor: c.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.cardBorder,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: c.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingLeft: Spacing.lg,
      paddingRight: 4,
      paddingVertical: 4,
      gap: Spacing.sm,
    },
    input: {
      flex: 1,
      color: c.text,
      fontSize: FontSize.md,
      maxHeight: 120,
      paddingVertical: Spacing.sm,
      lineHeight: 21,
    },
    sendButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.cardBorder,
    },
    sendButtonActive: {
      backgroundColor: c.primary,
    },
  });
