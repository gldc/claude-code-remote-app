import React from 'react';
import { Text, View, StyleSheet, useColorScheme } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontFamily } from '../constants/theme';

interface AnsiRendererProps {
  text: string;
}

interface StyledSpan {
  text: string;
  bold?: boolean;
  dim?: boolean;
  underline?: boolean;
  fgColor?: string;
  bgColor?: string;
}

const ANSI_COLORS_LIGHT: Record<number, string> = {
  30: '#1A1A1A', 31: '#CF222E', 32: '#2D8A4E', 33: '#BF8700',
  34: '#0969DA', 35: '#8250DF', 36: '#1B7C83', 37: '#D0D7DE',
  90: '#6E7781', 91: '#E5534B', 92: '#3DA665', 93: '#D4A017',
  94: '#539BF5', 95: '#B87FFF', 96: '#39C5CF', 97: '#FFFFFF',
};

const ANSI_COLORS_DARK: Record<number, string> = {
  30: '#6E7781', 31: '#E5534B', 32: '#3DA665', 33: '#D4A017',
  34: '#539BF5', 35: '#B87FFF', 36: '#39C5CF', 37: '#E8E0D8',
  90: '#6E7781', 91: '#E5534B', 92: '#3DA665', 93: '#D4A017',
  94: '#539BF5', 95: '#B87FFF', 96: '#39C5CF', 97: '#FFFFFF',
};

const ANSI_BG_COLORS_LIGHT: Record<number, string> = {
  40: '#1A1A1A', 41: '#CF222E', 42: '#2D8A4E', 43: '#BF8700',
  44: '#0969DA', 45: '#8250DF', 46: '#1B7C83', 47: '#D0D7DE',
};

const ANSI_BG_COLORS_DARK: Record<number, string> = {
  40: '#6E7781', 41: '#E5534B', 42: '#3DA665', 43: '#D4A017',
  44: '#539BF5', 45: '#B87FFF', 46: '#39C5CF', 47: '#E8E0D8',
};

function parseAnsi(text: string, fgPalette: Record<number, string>, bgPalette: Record<number, string>): StyledSpan[] {
  const spans: StyledSpan[] = [];
  const regex = /\x1b\[([0-9;]*)m/g;
  let lastIndex = 0;
  let bold = false, dim = false, underline = false;
  let fgColor: string | undefined, bgColor: string | undefined;

  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: text.slice(lastIndex, match.index), bold, dim, underline, fgColor, bgColor });
    }
    lastIndex = match.index + match[0].length;

    const codes = match[1].split(';').map(Number);
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      if (code === 0) { bold = false; dim = false; underline = false; fgColor = undefined; bgColor = undefined; }
      else if (code === 1) bold = true;
      else if (code === 2) dim = true;
      else if (code === 4) underline = true;
      else if (code >= 30 && code <= 37) fgColor = fgPalette[code];
      else if (code >= 90 && code <= 97) fgColor = fgPalette[code];
      else if (code >= 40 && code <= 47) bgColor = bgPalette[code];
      else if (code === 38 && codes[i + 1] === 5) {
        const n = codes[i + 2] || 0;
        if (n < 8) fgColor = fgPalette[30 + n];
        else if (n < 16) fgColor = fgPalette[90 + n - 8];
        else fgColor = fgPalette[37];
        i += 2;
      }
      else if (code === 39) fgColor = undefined;
      else if (code === 49) bgColor = undefined;
    }
  }

  if (lastIndex < text.length) {
    spans.push({ text: text.slice(lastIndex), bold, dim, underline, fgColor, bgColor });
  }

  return spans;
}

export const AnsiRenderer = React.memo(function AnsiRenderer({ text }: AnsiRendererProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const scheme = useColorScheme();
  const fgPalette = scheme === 'dark' ? ANSI_COLORS_DARK : ANSI_COLORS_LIGHT;
  const bgPalette = scheme === 'dark' ? ANSI_BG_COLORS_DARK : ANSI_BG_COLORS_LIGHT;
  const spans = parseAnsi(text, fgPalette, bgPalette);

  return (
    <View style={styles.container}>
      <Text style={styles.baseText}>
        {spans.map((span, i) => (
          <Text
            key={i}
            style={[
              span.fgColor ? { color: span.fgColor } : undefined,
              span.bgColor ? { backgroundColor: span.bgColor } : undefined,
              span.bold ? { fontWeight: '700' } : undefined,
              span.dim ? { opacity: 0.6 } : undefined,
              span.underline ? { textDecorationLine: 'underline' as const } : undefined,
            ]}
          >
            {span.text}
          </Text>
        ))}
      </Text>
    </View>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { backgroundColor: c.codeBg, borderRadius: 8, padding: Spacing.sm },
  baseText: { fontFamily: FontFamily.mono, fontSize: 12, color: c.codeText },
});
