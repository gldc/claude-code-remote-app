import { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useColors,
  useThemedStyles,
  type ColorPalette,
  FontSize,
  Spacing,
  BorderRadius,
} from '../constants/theme';

interface AttachmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  onDocument: () => void;
}

interface PickerOption {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
  bg: string;
}

export function AttachmentPicker({
  visible,
  onClose,
  onCamera,
  onLibrary,
  onDocument,
}: AttachmentPickerProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const handleOption = useCallback(
    (action: () => void) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      // Small delay so the sheet closes before picker opens
      setTimeout(action, 150);
    },
    [onClose]
  );

  const options: PickerOption[] = [
    {
      icon: 'camera',
      label: 'Camera',
      onPress: () => handleOption(onCamera),
      color: colors.primary,
      bg: colors.primaryBg15,
    },
    {
      icon: 'images',
      label: 'Photos',
      onPress: () => handleOption(onLibrary),
      color: colors.success,
      bg: colors.successBg10,
    },
    {
      icon: 'document',
      label: 'File',
      onPress: () => handleOption(onDocument),
      color: colors.info,
      bg: `${colors.info}1A`,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.optionsRow}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={styles.option}
                onPress={opt.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: opt.bg }]}>
                  <Ionicons name={opt.icon} size={24} color={opt.color} />
                </View>
                <Text style={styles.optionLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xxl + Spacing.lg,
      paddingHorizontal: Spacing.xl,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.cardBorder,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.cardBorder,
      alignSelf: 'center',
      marginBottom: Spacing.lg,
    },
    optionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      paddingVertical: Spacing.md,
    },
    option: {
      alignItems: 'center',
      gap: Spacing.sm,
      width: 80,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionLabel: {
      fontSize: FontSize.sm,
      color: c.text,
      fontWeight: '500',
    },
  });
