import { Platform, TextStyle } from 'react-native';
import { FontSize, FontFamily } from './theme';

const monoFamily = Platform.select({
  ios: FontFamily.mono,
  android: 'monospace',
  default: FontFamily.mono,
});

export const FontSize_code = 12;

export const TextVariants = {
  h1: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    lineHeight: 34,
  } as TextStyle,
  h2: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    lineHeight: 26,
  } as TextStyle,
  h3: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,
  body: {
    fontSize: FontSize.md,
    fontWeight: '400',
    lineHeight: 21,
  } as TextStyle,
  bodyStrong: {
    fontSize: FontSize.md,
    fontWeight: '600',
    lineHeight: 21,
  } as TextStyle,
  small: {
    fontSize: FontSize.sm,
    fontWeight: '400',
    lineHeight: 19,
  } as TextStyle,
  smallStrong: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    lineHeight: 19,
  } as TextStyle,
  caption: {
    fontSize: FontSize.xs,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,
  captionStrong: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    lineHeight: 16,
  } as TextStyle,
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    lineHeight: 19,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  code: {
    fontFamily: monoFamily,
    fontSize: FontSize_code,
    lineHeight: 18,
  } as TextStyle,
  button: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    lineHeight: 22,
  } as TextStyle,
  buttonSmall: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    lineHeight: 19,
  } as TextStyle,
} as const;
