import { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius, ComponentSize } from '../constants/theme';
import { CommandAutocomplete } from './CommandAutocomplete';
import { AttachmentPreview, type PendingAttachment } from './AttachmentPreview';
import { AttachmentPicker } from './AttachmentPicker';
import type { SlashCommand } from '../constants/commands';

interface InputBarProps {
  onSend: (text: string, attachments?: PendingAttachment[]) => void;
  onCommand?: (command: SlashCommand) => void;
  disabled?: boolean;
  placeholder?: string;
  initialText?: string | null;
}

export function InputBar({ onSend, onCommand, disabled, placeholder, initialText }: InputBarProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !attachments.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setText('');
    setAttachments([]);
  };

  const handleCommandSelect = (command: SlashCommand) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
    setAttachments([]);
    if (command.type === 'app') {
      onCommand?.(command);
    } else {
      onSend(`/${command.name}`);
    }
  };

  const handleAttach = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPicker(true);
  };

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.fileName || `photo-${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        },
      ]);
    }
  };

  const pickLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const newAttachments = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName || `image-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
    });
    if (!result.canceled) {
      const newAttachments = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const showAutocomplete = text.startsWith('/') && text.trim().length > 0;
  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled;

  return (
    <View style={styles.container}>
      {showAutocomplete && (
        <CommandAutocomplete filter={text.trim()} onSelect={handleCommandSelect} />
      )}
      <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />
      <View style={styles.inputRow}>
        <TouchableOpacity
          onPress={handleAttach}
          disabled={disabled}
          style={styles.attachButton}
        >
          <Ionicons
            name="attach"
            size={22}
            color={disabled ? colors.textMuted : colors.textSecondary}
          />
        </TouchableOpacity>
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
      <AttachmentPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onCamera={pickCamera}
        onLibrary={pickLibrary}
        onDocument={pickDocument}
      />
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
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingLeft: 4,
      paddingRight: 4,
      paddingVertical: 4,
      gap: Spacing.xs,
    },
    attachButton: {
      width: ComponentSize.sendButton,
      height: ComponentSize.sendButton,
      alignItems: 'center',
      justifyContent: 'center',
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
      width: ComponentSize.sendButton,
      height: ComponentSize.sendButton,
      borderRadius: ComponentSize.sendButton / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.cardBorder,
    },
    sendButtonActive: {
      backgroundColor: c.primary,
    },
  });
