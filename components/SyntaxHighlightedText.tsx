import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontFamily } from '../constants/theme';
import { FontSize_code } from '../constants/typography';

interface SyntaxHighlightedTextProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

interface Token {
  text: string;
  type: 'keyword' | 'string' | 'comment' | 'number' | 'plain';
}

const JS_KEYWORDS = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'class', 'async', 'await', 'new', 'this', 'true', 'false', 'null', 'undefined', 'typeof', 'instanceof']);
const PY_KEYWORDS = new Set(['def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'import', 'from', 'with', 'as', 'try', 'except', 'finally', 'raise', 'async', 'await', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'yield', 'pass', 'break', 'continue']);

function getKeywords(language?: string): Set<string> {
  if (!language) return new Set([...JS_KEYWORDS, ...PY_KEYWORDS]);
  const lang = language.toLowerCase();
  if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(lang)) return JS_KEYWORDS;
  if (['py', 'python'].includes(lang)) return PY_KEYWORDS;
  return new Set([...JS_KEYWORDS, ...PY_KEYWORDS]);
}

function tokenize(code: string, language?: string): Token[][] {
  const keywords = getKeywords(language);
  const lines = code.split('\n');

  return lines.map(line => {
    const tokens: Token[] = [];
    let i = 0;

    while (i < line.length) {
      if ((line[i] === '/' && line[i + 1] === '/') || (line[i] === '#' && (i === 0 || line[i - 1] === ' '))) {
        tokens.push({ text: line.slice(i), type: 'comment' });
        break;
      }

      if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
        const quote = line[i];
        let j = i + 1;
        while (j < line.length && line[j] !== quote) {
          if (line[j] === '\\') j++;
          j++;
        }
        tokens.push({ text: line.slice(i, j + 1), type: 'string' });
        i = j + 1;
        continue;
      }

      if (/\d/.test(line[i]) && (i === 0 || /[\s(,=[\{+\-*/]/.test(line[i - 1]))) {
        let j = i;
        while (j < line.length && /[\d.xXa-fA-F_]/.test(line[j])) j++;
        tokens.push({ text: line.slice(i, j), type: 'number' });
        i = j;
        continue;
      }

      if (/[a-zA-Z_$]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
        const word = line.slice(i, j);
        tokens.push({ text: word, type: keywords.has(word) ? 'keyword' : 'plain' });
        i = j;
        continue;
      }

      let j = i;
      while (j < line.length && !/[a-zA-Z0-9_$"'`#/]/.test(line[j]) && !(line[j] === '/' && line[j + 1] === '/')) {
        j++;
        if (j >= line.length) break;
      }
      if (j === i) j = i + 1;
      tokens.push({ text: line.slice(i, j), type: 'plain' });
      i = j;
    }

    if (tokens.length === 0) tokens.push({ text: '', type: 'plain' });
    return tokens;
  });
}

export const SyntaxHighlightedText = React.memo(function SyntaxHighlightedText({
  code, language, showLineNumbers = false,
}: SyntaxHighlightedTextProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const tokenLines = tokenize(code, language);
  const lineNumWidth = showLineNumbers ? String(tokenLines.length).length * 8 + 12 : 0;

  const colorMap: Record<Token['type'], string> = {
    keyword: colors.primary,
    string: colors.success,
    comment: colors.textMuted,
    number: colors.warning,
    plain: colors.codeText,
  };

  return (
    <ScrollView horizontal style={styles.container} showsHorizontalScrollIndicator={false}>
      <View style={styles.codeBlock}>
        {tokenLines.map((tokens, lineIdx) => (
          <View key={lineIdx} style={styles.line}>
            {showLineNumbers && (
              <Text style={[styles.lineNum, { width: lineNumWidth }]}>{lineIdx + 1}</Text>
            )}
            <Text selectable style={styles.lineText}>
              {tokens.map((token, tokenIdx) => (
                <Text key={tokenIdx} style={{ color: colorMap[token.type] }}>
                  {token.text}
                </Text>
              ))}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { backgroundColor: c.codeBg, borderRadius: 8, maxHeight: 300 },
  codeBlock: { padding: Spacing.sm },
  line: { flexDirection: 'row', minHeight: 18 },
  lineNum: { color: c.textMuted, fontFamily: FontFamily.mono, fontSize: FontSize_code, textAlign: 'right', marginRight: 8, opacity: 0.5 },
  lineText: { fontFamily: FontFamily.mono, fontSize: FontSize_code, flexShrink: 1 },
});
