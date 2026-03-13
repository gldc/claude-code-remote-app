import React, { type ReactNode, useMemo } from 'react';
import { Text, ScrollView, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { CopyablePressable } from './CopyablePressable';
import Markdown, { Renderer } from 'react-native-marked';
import { useColors, type ColorPalette, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { TextVariants, FontSize_code } from '../constants/typography';

function createRenderer(colors: ColorPalette) {
  return class ChatRenderer extends Renderer {
    code(
      text: string,
      language?: string,
      containerStyle?: ViewStyle,
      _textStyle?: TextStyle,
    ): ReactNode {
      return super.code(text, language, containerStyle, {
        fontFamily: 'Menlo',
        fontSize: FontSize_code,
        color: colors.codeText,
      });
    }

    table(
      header: ReactNode[][],
      rows: ReactNode[][][],
      tableStyle?: ViewStyle,
      rowStyle?: ViewStyle,
      cellStyle?: ViewStyle,
    ): ReactNode {
      const node = super.table(header, rows, tableStyle, rowStyle, cellStyle);
      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          key={this.getKey()}
          style={mdStyles.tableScroll}
        >
          {node}
        </ScrollView>
      );
    }
  };
}

export function AssistantTextCard({ text }: { text: string }) {
  const colors = useColors();
  const renderer = useMemo(() => {
    const Cls = createRenderer(colors);
    const instance = new Cls();
    // Override the library's private getTextNode to remove `selectable` prop.
    // react-native-marked hardcodes <Text selectable> which causes inconsistent
    // selection behavior across platforms. Our CopyablePressable handles copying.
    (instance as any).getTextNode = function (
      children: string | ReactNode[],
      styles?: TextStyle,
    ): ReactNode {
      return <Text key={this.getKey()} style={styles}>{children}</Text>;
    };
    return instance;
  }, [colors]);

  return (
    <CopyablePressable text={text} style={styles.container}>
      <Markdown
        value={text}
        flatListProps={{ scrollEnabled: false, style: { backgroundColor: 'transparent' } }}
        renderer={renderer}
        theme={{
          colors: {
            text: colors.text,
            link: colors.primary,
            code: colors.codespanText,
            border: colors.cardBorder,
          },
        }}
        styles={{
          text: {
            fontSize: FontSize.md,
            lineHeight: 21,
          },
          h1: {
            ...TextVariants.h2,
            marginTop: Spacing.md,
            marginBottom: Spacing.xs,
          },
          h2: {
            ...TextVariants.h3,
            marginTop: Spacing.md,
            marginBottom: Spacing.xs,
          },
          h3: {
            ...TextVariants.bodyStrong,
            marginTop: Spacing.sm,
            marginBottom: 2,
          },
          h4: {
            fontSize: FontSize.md,
            fontWeight: '600',
            marginTop: Spacing.sm,
            marginBottom: 2,
          },
          h5: {
            fontSize: FontSize.md,
            fontWeight: '600',
            marginTop: Spacing.sm,
            marginBottom: 2,
          },
          h6: {
            fontSize: FontSize.md,
            fontWeight: '600',
            marginTop: Spacing.sm,
            marginBottom: 2,
          },
          paragraph: {
            marginVertical: 4,
          },
          list: {
            marginVertical: 4,
          },
          li: {
            fontSize: FontSize.md,
          },
          strong: {
            fontWeight: '600',
          },
          link: {
            color: colors.primary,
            textDecorationLine: 'none',
          },
          blockquote: {
            borderLeftWidth: 2,
            borderLeftColor: colors.cardBorder,
            paddingLeft: Spacing.md,
            marginVertical: 4,
          },
          table: {
            marginVertical: 8,
          },
          tableRow: {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderColor: colors.cardBorder,
          },
          tableCell: {
            paddingVertical: 6,
            paddingHorizontal: 8,
          },
          codespan: {
            backgroundColor: colors.codespanBg,
            borderRadius: 4,
            paddingHorizontal: 5,
            paddingVertical: 1,
            fontFamily: 'Menlo',
            fontSize: FontSize_code,
            color: colors.codespanText,
          },
          code: {
            backgroundColor: colors.codeBg,
            borderRadius: BorderRadius.sm,
            padding: Spacing.md,
          },
        }}
      />
    </CopyablePressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
  },
});

const mdStyles = StyleSheet.create({
  tableScroll: {
    marginVertical: 8,
  },
});
