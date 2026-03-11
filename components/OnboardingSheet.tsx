import { useState, useRef, useMemo } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import PagerView from 'react-native-pager-view';
import { useAppStore } from '../lib/store';
import { useColors, useThemedStyles, type ColorPalette, Spacing, BorderRadius } from '../constants/theme';
import { shadowElevated } from '../constants/shadows';
import { WelcomeStep } from './onboarding/WelcomeStep';
import { ConnectStep } from './onboarding/ConnectStep';
import { FeaturesStep } from './onboarding/FeaturesStep';
import { NotificationsStep } from './onboarding/NotificationsStep';
import { DoneStep } from './onboarding/DoneStep';

const TOTAL_PAGES = 5;

export function OnboardingSheet() {
  const setHasOnboarded = useAppStore((s) => s.setHasOnboarded);
  const setPendingCreateSession = useAppStore((s) => s.setPendingCreateSession);
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const pagerRef = useRef<PagerView>(null);
  const snapPoints = useMemo(() => ['85%'], []);
  const { height: screenHeight } = useWindowDimensions();
  const sheetContentHeight = screenHeight * 0.85 - 40; // 85% snap minus handle area

  const [currentPage, setCurrentPage] = useState(0);

  const goNext = () => {
    const next = currentPage + 1;
    if (next < TOTAL_PAGES) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      pagerRef.current?.setPage(next);
      setCurrentPage(next);
    }
  };

  const dismiss = () => {
    setHasOnboarded(true);
    bottomSheetRef.current?.close();
  };

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasOnboarded(true);
    setPendingCreateSession(true);
    bottomSheetRef.current?.close();
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={() => setHasOnboarded(true)}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
    >
      <BottomSheetView style={styles.container}>
        {/* Progress bars */}
        <View style={styles.progressContainer}>
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                { backgroundColor: i <= currentPage ? colors.primary : colors.cardBorder },
              ]}
            />
          ))}
        </View>

        {/* Pager — needs explicit height since BottomSheetView sizes to content */}
        <PagerView
          ref={pagerRef}
          style={[styles.pager, { height: sheetContentHeight - 30 }]}
          initialPage={0}
          scrollEnabled={false}
          onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        >
          <View key="welcome" style={styles.page}>
            <WelcomeStep onNext={goNext} onSkip={dismiss} />
          </View>
          <View key="connect" style={styles.page}>
            <ConnectStep onNext={goNext} onSkip={dismiss} />
          </View>
          <View key="features" style={styles.page}>
            <FeaturesStep onNext={goNext} onSkip={dismiss} />
          </View>
          <View key="notifications" style={styles.page}>
            <NotificationsStep onNext={goNext} onSkip={dismiss} />
          </View>
          <View key="done" style={styles.page}>
            <DoneStep onFinish={handleFinish} />
          </View>
        </PagerView>
      </BottomSheetView>
    </BottomSheet>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    sheetBackground: {
      backgroundColor: c.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      ...shadowElevated,
    },
    sheetIndicator: {
      backgroundColor: c.cardBorder,
      width: 36,
    },
    container: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
    },
    progressContainer: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    progressBar: {
      flex: 1,
      height: 4,
      borderRadius: BorderRadius.sm,
    },
    pager: {
      flex: 1,
    },
    page: {
      flex: 1,
    },
  });
