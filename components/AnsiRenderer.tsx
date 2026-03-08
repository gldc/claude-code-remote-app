import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
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

const ANSI_COLORS: Record<number, string> = {
  30: '#1A1A1A', 31: '#CF222E', 32: '#2D8A4E', 33: '#BF8700',
  34: '#0969DA', 35: '#8250DF', 36: '#1B7C83', 37: '#D0D7DE',
  90: '#6E7781', 91: '#E5534B', 92: '#3DA665', 93: '#D4A017',
  94: '#539BF5', 95: '#B87FFF', 96: '#39C5CF', 97: '#FFFFFF',
};

const ANSI_BG_COLORS: Record<number, string> = {
  40: '#1A1A1A', 41: '#CF222E', 42: '#2D8A4E', 43: '#BF8700',
  44: '#0969DA', 45: '#8250DF', 46: '#1B7C83', 47: '#D0D7DE',
};

function parseAnsi(text: string): StyledSpan[] {
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
      else if (code >= 30 && code <= 37) fgColor = ANSI_COLORS[code];
      else if (code >= 90 && code <= 97) fgColor = ANSI_COLORS[code];
      else if (code >= 40 && code <= 47) bgColor = ANSI_BG_COLORS[code];
      else if (code === 38 && codes[i + 1] === 5) {
        const n = codes[i + 2] || 0;
        if (n < 8) fgColor = ANSI_COLORS[30 + n];
        else if (n < 16) fgColor = ANSI_COLORS[90 + n - 8];
        else fgColor = ANSI_COLORS[37];
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
  const spans = parseAnsi(text);

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
