import React from 'react';
import { Text, View, StyleSheet, useColorScheme } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontFamily } from '../constants/theme';
import { FontSize_code } from '../constants/typography';
import { AnsiColorsLight, AnsiColorsDark, ansiToArray, ansiBrightToArray } from '../constants/ansiColors';

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

function parseAnsi(text: string, normalColors: string[], brightColors: string[]): StyledSpan[] {
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
      else if (code >= 30 && code <= 37) fgColor = normalColors[code - 30];
      else if (code >= 90 && code <= 97) fgColor = brightColors[code - 90];
      else if (code >= 40 && code <= 47) bgColor = normalColors[code - 40];
      else if (code === 38 && codes[i + 1] === 5) {
        const n = codes[i + 2] || 0;
        if (n < 8) fgColor = normalColors[n];
        else if (n < 16) fgColor = brightColors[n - 8];
        else fgColor = normalColors[7]; // white
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
  const palette = scheme === 'dark' ? AnsiColorsDark : AnsiColorsLight;
  const normalColors = ansiToArray(palette);
  const brightColors = ansiBrightToArray(palette);
  const spans = parseAnsi(text, normalColors, brightColors);

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
  baseText: { fontFamily: FontFamily.mono, fontSize: FontSize_code, color: c.codeText },
});
