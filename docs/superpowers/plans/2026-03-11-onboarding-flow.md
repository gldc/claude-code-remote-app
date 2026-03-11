# Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bottom sheet carousel onboarding flow that guides first-time users through server setup, feature tour, and notification permissions.

**Architecture:** A `@gorhom/bottom-sheet` overlay with `react-native-pager-view` carousel, triggered by a persisted `hasOnboarded` flag in Zustand. Five step components live in `components/onboarding/`. The sheet renders in `app/_layout.tsx` over the tab navigator.

**Tech Stack:** React Native, Expo, `@gorhom/bottom-sheet` (already installed), `react-native-pager-view` (new dependency), Zustand + SecureStore, `expo-notifications`, `expo-linking`, `expo-haptics`.

**Spec:** `docs/superpowers/specs/2026-03-11-onboarding-flow-design.md`

---

## Chunk 1: Foundation (Store + Dependencies + Theme)

### Task 1: Install react-native-pager-view

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the package**

```bash
npx expo install react-native-pager-view
```

This is an Expo-compatible native module. It provides `PagerView` for horizontal swipe navigation without gesture conflicts inside bottom sheets.

- [ ] **Step 2: Verify installation**

```bash
npx expo-doctor
```

Expected: no compatibility errors for `react-native-pager-view`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-native-pager-view for onboarding carousel"
```

---

### Task 2: Add `hasOnboarded` flag to Zustand store

**Files:**
- Modify: `lib/store.ts`

- [ ] **Step 1: Add `hasOnboarded` and `setHasOnboarded` to the store**

In `lib/store.ts`, add `hasOnboarded` to the `AppState` interface and implement it in the store creator. **Critical:** update `partialize` to persist it.

Add to the `AppState` interface (after `pendingSkillInsert` lines):

```typescript
hasOnboarded: boolean;
setHasOnboarded: (value: boolean) => void;
```

Add to the store creator (after `setPendingSkillInsert`):

```typescript
hasOnboarded: false,
setHasOnboarded: (value) => set({ hasOnboarded: value }),
```

Update `partialize` to include `hasOnboarded`:

```typescript
partialize: (state) => ({
  hostConfig: state.hostConfig,
  hasOnboarded: state.hasOnboarded,
}),
```

**Migration for existing users:** Add an `onRehydrateStorage` callback to the persist config so that users who already have a `hostConfig.address` configured are auto-marked as onboarded. This prevents existing users from seeing onboarding on upgrade.

```typescript
onRehydrateStorage: () => (state) => {
  if (state && state.hostConfig.address && !state.hasOnboarded) {
    state.setHasOnboarded(true);
  }
},
```

Add this inside the persist options object (alongside `name`, `storage`, `partialize`).

- [ ] **Step 2: Verify the store compiles**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 3: Commit**

```bash
git add lib/store.ts
git commit -m "feat: add hasOnboarded flag to Zustand store with persistence"
```

---

### Task 2b: Add opacity theme tokens for success, warning, error

**Files:**
- Modify: `constants/theme.ts`

The existing theme has `primaryBg10`, `primaryBg15`, `primaryBg20` tokens for primary color at various opacities. The onboarding steps need similar tokens for `success`, `warning`, and `error` to avoid fragile inline hex string manipulation (`${colors.success}1A`).

- [ ] **Step 1: Add new tokens to ColorPalette interface**

In `constants/theme.ts`, add to the `ColorPalette` interface (after the existing `primaryBg20`):

```typescript
successBg10: string;
warningBg10: string;
errorBg10: string;
```

- [ ] **Step 2: Add values to LightColors and DarkColors**

In `LightColors`:
```typescript
successBg10: '#2D8A4E1A',
warningBg10: '#BF87001A',
errorBg10: '#CF222E1A',
```

In `DarkColors`:
```typescript
successBg10: '#3DA6651A',
warningBg10: '#D4A0171A',
errorBg10: '#E5534B1A',
```

- [ ] **Step 3: Verify it compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add constants/theme.ts
git commit -m "feat: add success, warning, error opacity tokens to theme"
```

---

## Chunk 2: Step Components

Each step is a self-contained component in `components/onboarding/`. They all receive the same props interface and follow the app's theming pattern (`useColors`, `useThemedStyles`, `makeStyles`).

### Task 3: Create shared types and the step props interface

**Files:**
- Create: `components/onboarding/types.ts`

- [ ] **Step 1: Create the shared types file**

```typescript
export interface OnboardingStepProps {
  onNext: () => void;
  onSkip: () => void;
}
```

Steps 1-4 import `OnboardingStepProps`. `onNext` advances the carousel, `onSkip` dismisses the entire sheet. `DoneStep` uses its own `DoneStepProps` with `onFinish` (no skip button on the final step).

- [ ] **Step 2: Commit**

```bash
git add components/onboarding/types.ts
git commit -m "feat: add onboarding step shared types"
```

---

### Task 4: Create WelcomeStep component

**Files:**
- Create: `components/onboarding/WelcomeStep.tsx`

This is Step 1 of onboarding. It shows:
- A hero area with primary/terracotta gradient background, phone ⟷ laptop emoji illustration
- App name and tagline
- A link to the CCR server GitHub repo (opens in browser via `expo-linking`)
- "Get Started →" CTA button

- [ ] **Step 1: Create WelcomeStep.tsx**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { OnboardingStepProps } from './types';

const CCR_REPO_URL = 'https://github.com/anthropics/claude-code-remote';

export function WelcomeStep({ onNext, onSkip }: OnboardingStepProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={[styles.hero, { backgroundColor: colors.primaryBg15 }]}>
        <Text style={styles.heroEmoji}>📱  ⟷  💻</Text>
        <Text style={[styles.heroSubtext, { color: colors.primary }]}>
          Phone → Tailscale → Server
        </Text>
      </View>

      <Text style={styles.title}>Welcome to Claude Remote</Text>
      <Text style={styles.subtitle}>
        Control Claude Code sessions from anywhere over your secure Tailscale network
      </Text>

      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => Linking.openURL(CCR_REPO_URL)}
      >
        <Ionicons name="logo-github" size={18} color={colors.primary} />
        <Text style={styles.linkText}>Set up the server first →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={onNext}>
        <Text style={styles.ctaText}>Get Started →</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
    },
    skipButton: {
      alignSelf: 'flex-end',
      padding: Spacing.sm,
    },
    skipText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
    hero: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    heroEmoji: {
      fontSize: 28,
      marginBottom: Spacing.sm,
    },
    heroSubtext: {
      fontSize: FontSize.xs,
      fontWeight: '500',
    },
    title: {
      fontSize: FontSize.xl,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.lg,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    linkText: {
      fontSize: FontSize.md,
      color: c.primary,
      fontWeight: '500',
    },
    cta: {
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      alignItems: 'center',
      marginTop: 'auto',
    },
    ctaText: {
      fontSize: FontSize.lg,
      fontWeight: '600',
      color: c.buttonText,
    },
  });
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/WelcomeStep.tsx
git commit -m "feat: add WelcomeStep onboarding component"
```

---

### Task 5: Create ConnectStep component

**Files:**
- Create: `components/onboarding/ConnectStep.tsx`

This is Step 2. It shows:
- A hero with success/green gradient and connection icon
- Tailscale address input + port input (using `BottomSheetTextInput` for keyboard compat)
- "Test Connection" button that calls the server status API
- Green success banner or red error inline
- "Next →" CTA disabled until connection succeeds

The connection test uses the same `apiFetch` pattern from `lib/api.ts` but as a direct fetch call (not a React Query hook) since this is a one-shot test, not ongoing polling.

- [ ] **Step 1: Create ConnectStep.tsx**

```typescript
import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../lib/store';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { OnboardingStepProps } from './types';

interface ServerStatus {
  active_sessions: number;
  total_sessions: number;
}

export function ConnectStep({ onNext, onSkip }: OnboardingStepProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const hostConfig = useAppStore((s) => s.hostConfig);
  const setHostConfig = useAppStore((s) => s.setHostConfig);

  const [address, setAddress] = useState(hostConfig.address);
  const [port, setPort] = useState(String(hostConfig.port));
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState<ServerStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setError('Please enter a Tailscale address');
      return;
    }

    setTesting(true);
    setError(null);
    setConnected(null);

    try {
      const portNum = parseInt(port) || 8080;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(`http://${trimmedAddress}:${portNum}/api/status`, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);
      const data: ServerStatus = await resp.json();
      setConnected(data);
      setHostConfig({ address: trimmedAddress, port: portNum });
    } catch {
      setError('Could not reach server — check the address and make sure Tailscale is connected');
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={[styles.hero, { backgroundColor: colors.successBg10 }]}>
        <Text style={styles.heroEmoji}>🔗</Text>
        <Text style={[styles.heroSubtext, { color: colors.success }]}>
          Secure WireGuard tunnel
        </Text>
      </View>

      <Text style={styles.title}>Connect Your Server</Text>
      <Text style={styles.subtitle}>Enter your Tailscale address</Text>

      <Text style={styles.label}>Tailscale Address</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={address}
        onChangeText={(v) => {
          setAddress(v);
          setConnected(null);
          setError(null);
        }}
        placeholder="macbook.tailnet-xxxx"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Port</Text>
      <BottomSheetTextInput
        style={styles.input}
        value={port}
        onChangeText={(v) => {
          setPort(v);
          setConnected(null);
          setError(null);
        }}
        keyboardType="number-pad"
        placeholderTextColor={colors.textMuted}
      />

      {!connected && (
        <TouchableOpacity
          style={[styles.testButton, testing && { opacity: 0.6 }]}
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.testButtonText}>Test Connection</Text>
          )}
        </TouchableOpacity>
      )}

      {connected && (
        <View style={[styles.statusBanner, { backgroundColor: colors.successBg10 }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[styles.statusText, { color: colors.success }]}>
            Connected — {connected.active_sessions} active session{connected.active_sessions !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {error && (
        <View style={[styles.statusBanner, { backgroundColor: colors.errorBg10 }]}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={[styles.statusText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.cta,
          { backgroundColor: colors.primary },
          !connected && styles.ctaDisabled,
        ]}
        onPress={onNext}
        disabled={!connected}
      >
        <Text style={styles.ctaText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
    },
    skipButton: {
      alignSelf: 'flex-end',
      padding: Spacing.sm,
    },
    skipText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
    hero: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    heroEmoji: {
      fontSize: 28,
      marginBottom: Spacing.sm,
    },
    heroSubtext: {
      fontSize: FontSize.xs,
      fontWeight: '500',
    },
    title: {
      fontSize: FontSize.xl,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: FontSize.sm,
      color: c.textSecondary,
      marginBottom: Spacing.xs,
      marginTop: Spacing.md,
      fontWeight: '500',
    },
    input: {
      backgroundColor: c.background,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      color: c.text,
      fontSize: FontSize.md,
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    testButton: {
      borderWidth: 1,
      borderColor: c.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    testButtonText: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.primary,
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    statusText: {
      fontSize: FontSize.sm,
      flex: 1,
    },
    cta: {
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      alignItems: 'center',
      marginTop: 'auto',
    },
    ctaDisabled: {
      opacity: 0.4,
    },
    ctaText: {
      fontSize: FontSize.lg,
      fontWeight: '600',
      color: c.buttonText,
    },
  });
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/ConnectStep.tsx
git commit -m "feat: add ConnectStep onboarding component with connection validation"
```

---

### Task 6: Create FeaturesStep component

**Files:**
- Create: `components/onboarding/FeaturesStep.tsx`

Step 3. Three colored feature cards for Sessions, Projects, Settings. No hero area — the cards ARE the content.

- [ ] **Step 1: Create FeaturesStep.tsx**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { OnboardingStepProps } from './types';

const FEATURES = [
  {
    icon: 'chatbubbles' as const,
    title: 'Sessions',
    description: 'Create, stream, and approve tool use',
    colorKey: 'primary' as const,
    bgKey: 'primaryBg10' as const,
  },
  {
    icon: 'folder' as const,
    title: 'Projects',
    description: 'Manage repos and clone from Git',
    colorKey: 'success' as const,
    bgKey: 'successBg10' as const,
  },
  {
    icon: 'settings' as const,
    title: 'Settings',
    description: 'Templates, MCP servers, approval rules',
    colorKey: 'info' as const,
    bgKey: 'primaryBg10' as const,
  },
];

export function FeaturesStep({ onNext, onSkip }: OnboardingStepProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Text style={styles.title}>What You Can Do</Text>
      <Text style={styles.subtitle}>Three tabs, everything you need</Text>

      <View style={styles.cards}>
        {FEATURES.map((feature) => {
          const accent = colors[feature.colorKey];
          return (
            <View
              key={feature.title}
              style={[styles.card, { backgroundColor: colors[feature.bgKey] }]}
            >
              <Ionicons name={feature.icon} size={24} color={accent} />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{feature.title}</Text>
                <Text style={styles.cardDesc}>{feature.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={[styles.cta, { backgroundColor: colors.primary }]} onPress={onNext}>
        <Text style={styles.ctaText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
    },
    skipButton: {
      alignSelf: 'flex-end',
      padding: Spacing.sm,
    },
    skipText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
    title: {
      fontSize: FontSize.xl,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    cards: {
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: FontSize.md,
      fontWeight: '600',
      color: c.text,
    },
    cardDesc: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginTop: 2,
    },
    cta: {
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      alignItems: 'center',
      marginTop: 'auto',
    },
    ctaText: {
      fontSize: FontSize.lg,
      fontWeight: '600',
      color: c.buttonText,
    },
  });
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/FeaturesStep.tsx
git commit -m "feat: add FeaturesStep onboarding component"
```

---

### Task 7: Create NotificationsStep component

**Files:**
- Create: `components/onboarding/NotificationsStep.tsx`

Step 4. Amber/warning hero. Explains what notifications are for. CTA triggers `getExpoPushToken()` which prompts iOS permission. "Not now" link advances without prompting.

- [ ] **Step 1: Create NotificationsStep.tsx**

```typescript
import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExpoPushToken } from '../../lib/notifications';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import type { OnboardingStepProps } from './types';

const NOTIFICATION_TYPES = [
  { icon: 'flash' as const, label: 'Approval Requests', color: 'warning' as const },
  { icon: 'checkmark-circle' as const, label: 'Session Completions', color: 'success' as const },
  { icon: 'alert-circle' as const, label: 'Session Errors', color: 'error' as const },
];

export function NotificationsStep({ onNext, onSkip }: OnboardingStepProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const [requesting, setRequesting] = useState(false);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      await getExpoPushToken();
    } finally {
      setRequesting(false);
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={[styles.hero, { backgroundColor: colors.warningBg10 }]}>
        <Text style={styles.heroEmoji}>🔔</Text>
        <Text style={[styles.heroSubtext, { color: colors.warning }]}>
          Never miss an approval request
        </Text>
      </View>

      <Text style={styles.title}>Stay in the Loop</Text>
      <Text style={styles.subtitle}>Get notified when Claude needs you</Text>

      <View style={styles.typeList}>
        {NOTIFICATION_TYPES.map((type) => (
          <View key={type.label} style={styles.typeRow}>
            <Ionicons name={type.icon} size={18} color={colors[type.color]} />
            <Text style={styles.typeLabel}>{type.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footerText}>
        You can customize notification types in Settings
      </Text>

      <TouchableOpacity
        style={[styles.cta, { backgroundColor: colors.primary }, requesting && { opacity: 0.6 }]}
        onPress={handleEnable}
        disabled={requesting}
      >
        {requesting ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={styles.ctaText}>Enable Notifications →</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.notNowButton} onPress={onNext}>
        <Text style={styles.notNowText}>Not now</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.sm,
    },
    skipButton: {
      alignSelf: 'flex-end',
      padding: Spacing.sm,
    },
    skipText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
    hero: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    heroEmoji: {
      fontSize: 28,
      marginBottom: Spacing.sm,
    },
    heroSubtext: {
      fontSize: FontSize.xs,
      fontWeight: '500',
    },
    title: {
      fontSize: FontSize.xl,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    typeList: {
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    typeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.background,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    typeLabel: {
      fontSize: FontSize.md,
      color: c.text,
    },
    footerText: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    cta: {
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      alignItems: 'center',
      marginTop: 'auto',
    },
    ctaText: {
      fontSize: FontSize.lg,
      fontWeight: '600',
      color: c.buttonText,
    },
    notNowButton: {
      padding: Spacing.md,
      alignItems: 'center',
    },
    notNowText: {
      fontSize: FontSize.md,
      color: c.textMuted,
    },
  });
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/NotificationsStep.tsx
git commit -m "feat: add NotificationsStep onboarding component"
```

---

### Task 8: Create DoneStep component

**Files:**
- Create: `components/onboarding/DoneStep.tsx`

Step 5. Green success hero, celebration. "Start Your First Session" CTA. No skip button.

- [ ] **Step 1: Create DoneStep.tsx**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../../constants/theme';

interface DoneStepProps {
  onFinish: () => void;
}

export function DoneStep({ onFinish }: DoneStepProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { backgroundColor: colors.successBg10 }]}>
        <Text style={styles.heroEmoji}>🎉</Text>
        <Text style={[styles.heroSubtext, { color: colors.success }]}>
          You're all set!
        </Text>
      </View>

      <Text style={styles.title}>Ready to Go</Text>
      <Text style={styles.subtitle}>
        Your server is connected and notifications are enabled. Start your first session!
      </Text>

      <TouchableOpacity
        style={[styles.cta, { backgroundColor: colors.primary }]}
        onPress={onFinish}
      >
        <Text style={styles.ctaText}>Start Your First Session 🚀</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xl,
      justifyContent: 'center',
    },
    hero: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xxl,
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    heroEmoji: {
      fontSize: 40,
      marginBottom: Spacing.sm,
    },
    heroSubtext: {
      fontSize: FontSize.md,
      fontWeight: '600',
    },
    title: {
      fontSize: FontSize.xl,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: FontSize.md,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.xxl,
    },
    cta: {
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      alignItems: 'center',
    },
    ctaText: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: c.buttonText,
    },
  });
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/DoneStep.tsx
git commit -m "feat: add DoneStep onboarding component"
```

---

## Chunk 3: Container + Integration

### Task 9: Create OnboardingSheet container

**Files:**
- Create: `components/OnboardingSheet.tsx`

The main container that ties everything together:
- `@gorhom/bottom-sheet` with snap points `['85%']`, `enableDismissOnClose`
- `react-native-pager-view` inside the sheet for horizontal carousel
- Progress bars at the top (5 bars)
- Manages current page index
- `onSkip` closes the sheet (sets `hasOnboarded = true`)
- `onFinish` (from DoneStep) sets `hasOnboarded = true` and navigates to sessions

Key patterns from the existing `CreateSessionSheet.tsx`:
- Uses `BottomSheet` from `@gorhom/bottom-sheet`
- `backgroundStyle` for sheet background
- `handleIndicatorStyle` for the drag handle

**Pre-requisite:** Before creating this component, add a `pendingCreateSession` flag to the Zustand store so that `handleFinish` can signal the sessions screen to open `CreateSessionSheet`. In `lib/store.ts`:

Add to `AppState` interface:
```typescript
pendingCreateSession: boolean;
setPendingCreateSession: (value: boolean) => void;
```

Add to store creator:
```typescript
pendingCreateSession: false,
setPendingCreateSession: (value) => set({ pendingCreateSession: value }),
```

Do NOT add to `partialize` — this is transient state only.

Then in `app/(tabs)/sessions/index.tsx`, add a ref to `CreateSessionSheet` and consume the flag:

```typescript
const pendingCreate = useAppStore((s) => s.pendingCreateSession);
const setPendingCreateSession = useAppStore((s) => s.setPendingCreateSession);
const createSheetRef = useRef<BottomSheet>(null);

useEffect(() => {
  if (pendingCreate) {
    createSheetRef.current?.snapToIndex(1);
    setPendingCreateSession(false);
  }
}, [pendingCreate, setPendingCreateSession]);
```

And pass `ref={createSheetRef}` to `<CreateSessionSheet ref={createSheetRef} />`.

- [ ] **Step 1: Create OnboardingSheet.tsx**

```typescript
import { useState, useRef, useCallback } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import PagerView from 'react-native-pager-view';
import { useAppStore } from '../lib/store';
import { useColors, useThemedStyles, type ColorPalette, Spacing } from '../constants/theme';
import { shadowElevated } from '../constants/shadows';
import { WelcomeStep } from './onboarding/WelcomeStep';
import { ConnectStep } from './onboarding/ConnectStep';
import { FeaturesStep } from './onboarding/FeaturesStep';
import { NotificationsStep } from './onboarding/NotificationsStep';
import { DoneStep } from './onboarding/DoneStep';

const TOTAL_STEPS = 5;
const SNAP_POINTS = ['85%'];

export function OnboardingSheet() {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const { width } = useWindowDimensions();

  const sheetRef = useRef<BottomSheet>(null);
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const setHasOnboarded = useAppStore((s) => s.setHasOnboarded);
  const setPendingCreateSession = useAppStore((s) => s.setPendingCreateSession);

  const dismiss = useCallback(() => {
    setHasOnboarded(true);
    sheetRef.current?.close();
  }, [setHasOnboarded]);

  const goNext = useCallback(() => {
    const next = currentPage + 1;
    if (next < TOTAL_STEPS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      pagerRef.current?.setPage(next);
    }
  }, [currentPage]);

  const handleFinish = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasOnboarded(true);
    setPendingCreateSession(true);
    sheetRef.current?.close();
    router.replace('/(tabs)/sessions');
  }, [setHasOnboarded, setPendingCreateSession]);

  const handlePageSelected = useCallback((e: { nativeEvent: { position: number } }) => {
    setCurrentPage(e.nativeEvent.position);
  }, []);

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={SNAP_POINTS}
      enableDismissOnClose
      enablePanDownToClose
      onClose={() => setHasOnboarded(true)}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.sheetIndicator}
    >
      <BottomSheetView style={styles.content}>
        {/* Progress bars */}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                { backgroundColor: i <= currentPage ? colors.primary : colors.cardBorder },
              ]}
            />
          ))}
        </View>

        {/* Pager */}
        <PagerView
          ref={pagerRef}
          style={{ flex: 1, width }}
          initialPage={0}
          onPageSelected={handlePageSelected}
          scrollEnabled={false}
        >
          <View key="welcome" style={{ flex: 1 }}>
            <WelcomeStep onNext={goNext} onSkip={dismiss} />
          </View>
          <View key="connect" style={{ flex: 1 }}>
            <ConnectStep onNext={goNext} onSkip={dismiss} />
          </View>
          <View key="features" style={{ flex: 1 }}>
            <FeaturesStep onNext={goNext} onSkip={dismiss} />
          </View>
          <View key="notifications" style={{ flex: 1 }}>
            <NotificationsStep onNext={goNext} onSkip={dismiss} />
          </View>
          <View key="done" style={{ flex: 1 }}>
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
    content: {
      flex: 1,
    },
    progressRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    progressBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
    },
  });
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/OnboardingSheet.tsx
git commit -m "feat: add OnboardingSheet container with pager and progress bars"
```

---

### Task 10: Integrate OnboardingSheet into app layout

**Files:**
- Modify: `app/_layout.tsx`

Render `<OnboardingSheet>` conditionally when `hasOnboarded` is `false`. It renders over the tab navigator inside the `AppContent` component.

- [ ] **Step 1: Add OnboardingSheet to AppContent**

In `app/_layout.tsx`, add the import and conditional render:

Add import at top:
```typescript
import { useAppStore } from '../lib/store';
import { OnboardingSheet } from '../components/OnboardingSheet';
```

Inside `AppContent`, after `useNotificationSetup()`:
```typescript
const hasOnboarded = useAppStore((s) => s.hasOnboarded);
```

Inside the `<>` fragment, after the `</Stack>` closing tag and before `</>`:
```typescript
{!hasOnboarded && <OnboardingSheet />}
```

The final `AppContent` should look like:

```typescript
function AppContent() {
  useNotificationSetup();
  const scheme = useColorScheme();
  const colors = useColors();
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {!hasOnboarded && <OnboardingSheet />}
    </>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: render OnboardingSheet on first launch"
```

---

### Task 11: Add "Replay Onboarding" to Settings

**Files:**
- Modify: `app/(tabs)/settings/index.tsx`

Add a new "App" section at the bottom of the Settings screen with a "Replay Onboarding" list item that resets `hasOnboarded` to `false`.

- [ ] **Step 1: Add the replay button**

In `app/(tabs)/settings/index.tsx`:

Add `useAppStore` import for `setHasOnboarded` (it's already imported for `hostConfig`):
```typescript
const setHasOnboarded = useAppStore((s) => s.setHasOnboarded);
```

Add a new section before the final `<View style={{ height: Spacing.xxl * 2 }} />` spacer:

```typescript
<SectionHeader>App</SectionHeader>
<ListItem
  icon="refresh"
  title="Replay Onboarding"
  onPress={() => {
    setHasOnboarded(false);
    router.push('/(tabs)/sessions');
  }}
  spaced={false}
/>
```

The `onPress` resets the flag and navigates to sessions (where the sheet will appear since `hasOnboarded` is now `false`).

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/settings/index.tsx
git commit -m "feat: add Replay Onboarding option in Settings"
```

---

### Task 12: Add .superpowers to .gitignore

**Files:**
- Modify: `.gitignore`

The brainstorming session created `.superpowers/` (dot-prefixed, in project root) with mockup HTML files. This is separate from `docs/superpowers/` which contains specs and plans. Add the dot-prefixed directory to `.gitignore`.

- [ ] **Step 1: Add to .gitignore**

Append to `.gitignore`:
```
# Superpowers brainstorming artifacts
.superpowers/
```

- [ ] **Step 2: Remove any cached .superpowers files if tracked**

```bash
git rm -r --cached .superpowers/ 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add .superpowers to gitignore"
```

---

### Task 13: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
npx expo start
```

- [ ] **Step 2: Test full onboarding flow on device/simulator**

Verify:
1. App launches → bottom sheet appears with Welcome step
2. "Get Started" advances to Connect step
3. Enter valid Tailscale address → "Test Connection" → green banner → Next enabled
4. Features step shows three cards → Next
5. Notifications step → "Enable Notifications" triggers iOS permission → advances to Done
6. "Start Your First Session" dismisses sheet
7. Relaunch app → sheet does NOT appear (flag persisted)

- [ ] **Step 3: Test skip flow**

Reset by going to Settings → App → Replay Onboarding. Then:
1. On Welcome step, tap "Skip" → sheet dismisses
2. Replay again → on Connect step, swipe sheet down → dismisses
3. Verify host config is empty after skip (Settings shows blank address)

- [ ] **Step 4: Test dark mode**

Switch device to dark mode. Verify all steps render with correct dark theme colors.

- [ ] **Step 5: Final commit if any tweaks were needed**

```bash
git add -A
git commit -m "fix: onboarding polish from manual testing"
```
