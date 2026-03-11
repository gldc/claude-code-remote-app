import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

export interface ColorPalette {
  background: string;
  card: string;
  cardBorder: string;
  inputBorder: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  // Component-specific
  toolBg: string;
  toolIconBg: string;
  codeBg: string;
  codeText: string;
  codespanBg: string;
  codespanText: string;
  shadowColor: string;
  // NEW: Action button text (always white on primary bg)
  buttonText: string;
  // NEW: Overlay backgrounds (primary at various opacities)
  primaryBg10: string;
  primaryBg15: string;
  primaryBg20: string;
  // NEW: Git status colors
  gitRenamed: string;
  gitUntracked: string;
  // NEW: Avatar accent palette (theme-aware)
  avatarColors: string[];
  // NEW: ANSI standard link/info blue
  info: string;
}

export const LightColors: ColorPalette = {
  background: '#F3EDE5',
  card: '#FFFFFF',
  cardBorder: '#E5DDD3',
  inputBorder: '#D9D0C4',
  primary: '#C4613C',
  success: '#2D8A4E',
  warning: '#BF8700',
  error: '#CF222E',
  text: '#1A1A1A',
  textMuted: '#7C7268',
  textSecondary: '#4A4540',
  tabBar: '#FDFAF6',
  tabBarBorder: '#E5DDD3',
  tabBarActive: '#C4613C',
  tabBarInactive: '#6E6560',
  toolBg: '#EDE8E0',
  toolIconBg: '#E0D8CE',
  codeBg: '#2D2A26',
  codeText: '#E8DDD0',
  codespanBg: '#EDE5D8',
  codespanText: '#5D4037',
  shadowColor: '#000000',
  buttonText: '#FFFFFF',
  primaryBg10: '#C4613C1A',
  primaryBg15: '#C4613C26',
  primaryBg20: '#C4613C33',
  gitRenamed: '#0969DA',
  gitUntracked: '#6E7781',
  avatarColors: ['#C4613C', '#2D8A4E', '#0969DA', '#8250DF', '#BF8700', '#1B7C83', '#CF222E'],
  info: '#0969DA',
};

export const DarkColors: ColorPalette = {
  background: '#1A1816',
  card: '#2A2724',
  cardBorder: '#3D3935',
  inputBorder: '#4A4540',
  primary: '#D4785A',
  success: '#3DA665',
  warning: '#D4A017',
  error: '#E5534B',
  text: '#E8E0D8',
  textMuted: '#9C9389',
  textSecondary: '#B8AFA6',
  tabBar: '#211F1C',
  tabBarBorder: '#3D3935',
  tabBarActive: '#D4785A',
  tabBarInactive: '#7C7268',
  toolBg: '#232019',
  toolIconBg: '#342F2A',
  codeBg: '#141210',
  codeText: '#E8DDD0',
  codespanBg: '#3D3935',
  codespanText: '#D4A87C',
  shadowColor: '#000000',
  buttonText: '#FFFFFF',
  primaryBg10: '#D4785A1A',
  primaryBg15: '#D4785A26',
  primaryBg20: '#D4785A33',
  gitRenamed: '#539BF5',
  gitUntracked: '#8B949E',
  avatarColors: ['#D4785A', '#3DA665', '#539BF5', '#B87FFF', '#D4A017', '#39C5CF', '#E5534B'],
  info: '#539BF5',
};

/** Backwards-compatible — defaults to light */
export const Colors = LightColors;

export function useColors(): ColorPalette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : LightColors;
}

/**
 * Create themed styles — call inside a component with useColors().
 *
 * Usage:
 *   const colors = useColors();
 *   const styles = useThemedStyles(colors, (c) => ({ container: { backgroundColor: c.background } }));
 */
export function useThemedStyles<T>(
  colors: ColorPalette,
  factory: (c: ColorPalette) => T,
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(colors), [colors]);
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
};

export const FontFamily = {
  mono: 'Menlo',
  default: undefined,
};

export const IconSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const ComponentSize = {
  avatarSm: 26,
  avatar: 36,
  avatarLg: 40,
  statusDot: 8,
  statusDotSm: 6,
  sendButton: 34,
  fab: 56,
  fabIcon: 28,
};

export const Opacity = {
  xs: 0.04,
  sm: 0.08,
  md: 0.15,
  lg: 0.25,
  xl: 0.4,
  xxl: 0.6,
};
