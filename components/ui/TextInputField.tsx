import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, BorderRadius, FontSize } from '../../constants/theme';

interface TextInputFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
}

export function TextInputField({ label, helperText, ...inputProps }: TextInputFieldProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...inputProps} />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  label: { fontSize: FontSize.sm, color: c.textMuted, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  input: { backgroundColor: c.background, borderRadius: BorderRadius.md, padding: Spacing.md, color: c.text, fontSize: FontSize.md, borderWidth: 1, borderColor: c.inputBorder },
  helper: { fontSize: FontSize.xs, color: c.textMuted, marginTop: Spacing.xs },
});
