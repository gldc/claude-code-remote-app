import { Platform, ViewStyle } from 'react-native';
import { Opacity } from './theme';

type ShadowStyle = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

function shadow(opacity: number, radius: number, elevation: number, offsetY = 1): ShadowStyle {
  return Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
  }) as ShadowStyle;
}

/** Subtle card/list-item shadow */
export const shadowCard = shadow(Opacity.xs, 3, 1);

/** Elevated menus, sheets, popovers */
export const shadowElevated = shadow(Opacity.sm, 8, 4, 2);

/** FAB / prominent floating buttons */
export const shadowFab = shadow(Opacity.lg, 4, 5, 2);
