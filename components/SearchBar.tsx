import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  value?: string;
}

export const SearchBar = React.memo(function SearchBar({
  placeholder = 'Search...', onSearch, value: controlledValue,
}: SearchBarProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const [text, setText] = useState(controlledValue ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((newText: string) => {
    setText(newText);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(newText), 300);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setText('');
    onSearch('');
  }, [onSearch]);

  return (
    <View style={styles.container}>
      <SymbolView name="magnifyingglass" size={16} tintColor={colors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={handleChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {text.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={8}>
          <SymbolView name="xmark.circle.fill" size={18} tintColor={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: c.card, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: c.inputBorder,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  input: { flex: 1, fontSize: FontSize.md, color: c.text, padding: 0 },
});
