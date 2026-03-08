# Layer 1: App Foundation Components — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 14 reusable React Native components that Layer 2 features depend on.

**Architecture:** Each component follows the existing pattern: `useColors()` + `useThemedStyles(colors, makeStyles)` factory. All components are standalone with typed props, no external state dependencies.

**Tech Stack:** React Native 0.83, Expo 55, TypeScript, Reanimated 4, react-native-svg (new dep)

**Repo:** `/Users/gldc/Developer/claude-code-remote-app`

**Patterns to follow:**
- Theme: `const colors = useColors(); const styles = useThemedStyles(colors, makeStyles);`
- Style factory: `const makeStyles = (c: ColorPalette) => StyleSheet.create({ ... });`
- Imports from: `../constants/theme` for `useColors, useThemedStyles, ColorPalette, Spacing, FontSize, BorderRadius, FontFamily`
- Memoize with `React.memo` for list items

---

## Pre-requisite: Install react-native-svg

```bash
cd /Users/gldc/Developer/claude-code-remote-app
npx expo install react-native-svg
```

Commit: `chore: add react-native-svg dependency`

---

## Task 1: ProgressMeter

**File:** Create `components/ProgressMeter.tsx`

**Props:**
```typescript
interface ProgressMeterProps {
  label: string;                    // "Session", "Weekly"
  percent: number;                  // 0-100 (percent remaining)
  subtitle?: string;                // "Resets in 2h 55m"
  reservePercent?: number;          // Optional reserve segment (weekly)
  size?: 'sm' | 'md';              // sm=4px height, md=8px height
}
```

**Implementation:**

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize } from '../constants/theme';

function getBarColor(percent: number, colors: ColorPalette): string {
  if (percent > 50) return colors.success;
  if (percent > 20) return colors.warning;
  return colors.error;
}

export const ProgressMeter = React.memo(function ProgressMeter({
  label, percent, subtitle, reservePercent, size = 'md',
}: ProgressMeterProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const barHeight = size === 'sm' ? 4 : 8;
  const barColor = getBarColor(percent, colors);
  const fillWidth = `${Math.max(0, Math.min(100, percent))}%`;
  const reserveWidth = reservePercent ? `${Math.min(reservePercent, 100 - percent)}%` : '0%';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.percent}>{Math.round(percent)}% left</Text>
      </View>
      <View style={[styles.track, { height: barHeight }]}>
        <View style={[styles.fill, { width: fillWidth, backgroundColor: barColor }]} />
        {reservePercent ? (
          <View style={[styles.reserve, { width: reserveWidth, backgroundColor: barColor, opacity: 0.4 }]} />
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  container: { gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: FontSize.md, fontWeight: '600', color: c.text },
  percent: { fontSize: FontSize.sm, color: c.textMuted },
  track: { backgroundColor: c.cardBorder, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  fill: { borderRadius: 4 },
  reserve: { borderRadius: 4 },
  subtitle: { fontSize: FontSize.xs, color: c.textMuted },
});
```

**Test:** Visual verification — import into settings screen temporarily.

**Commit:** `feat: add ProgressMeter component`

---

## Task 2: TimeCountdown

**File:** Create `components/TimeCountdown.tsx`

**Props:**
```typescript
interface TimeCountdownProps {
  seconds: number;                  // Seconds until reset
  prefix?: string;                  // "Resets in" (default)
}
```

**Implementation:**

```typescript
import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { useColors, FontSize } from '../constants/theme';

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'now';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${totalSeconds}s`;
}

export const TimeCountdown = React.memo(function TimeCountdown({
  seconds, prefix = 'Resets in',
}: TimeCountdownProps) {
  const colors = useColors();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 60));
    }, 60000);
    return () => clearInterval(interval);
  }, [seconds]);

  return (
    <Text style={{ fontSize: FontSize.xs, color: colors.textMuted }}>
      {prefix} {formatCountdown(remaining)}
    </Text>
  );
});
```

**Commit:** `feat: add TimeCountdown component`

---

## Task 3: ExpandableCard

**File:** Create `components/ExpandableCard.tsx`

**Props:**
```typescript
interface ExpandableCardProps {
  title: string;
  icon?: string;                    // SFSymbol name
  badge?: string;                   // e.g., "3 files"
  defaultExpanded?: boolean;
  children: React.ReactNode;        // Expanded content
  preview?: React.ReactNode;        // Collapsed preview (optional)
}
```

**Implementation:** Uses Reanimated for animated height. Header is always visible with chevron that rotates on expand. Tapping header toggles expansion.

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { useColors, useThemedStyles, type ColorPalette, Spacing, FontSize, BorderRadius } from '../constants/theme';

export const ExpandableCard = React.memo(function ExpandableCard({
  title, icon, badge, defaultExpanded = false, children, preview,
}: ExpandableCardProps) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotation = useSharedValue(defaultExpanded ? 90 : 0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    setExpanded(!expanded);
    rotation.value = withTiming(expanded ? 0 : 90, { duration: 200 });
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={toggle} style={styles.header} activeOpacity={0.7}>
        {icon && <SymbolView name={icon} size={18} tintColor={colors.textMuted} />}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {badge && <Text style={styles.badge}>{badge}</Text>}
        <Animated.View style={chevronStyle}>
          <SymbolView name="chevron.right" size={14} tintColor={colors.textMuted} />
        </Animated.View>
      </TouchableOpacity>
      {!expanded && preview}
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
});

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  card: { backgroundColor: c.card, borderRadius: BorderRadius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: c.cardBorder, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  title: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: c.text },
  badge: { fontSize: FontSize.xs, color: c.textMuted, backgroundColor: c.cardBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
});
```

**Commit:** `feat: add ExpandableCard component`

---

## Task 4: SyntaxHighlightedText

**File:** Create `components/SyntaxHighlightedText.tsx`

**Props:**
```typescript
interface SyntaxHighlightedTextProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}
```

**Implementation:** Regex-based tokenizer for common patterns (strings, comments, keywords, numbers). No external library — keeps bundle small. Renders as a ScrollView with monospace Text.

Keywords by language:
- JS/TS: `const, let, var, function, return, if, else, for, while, import, export, from, class, async, await`
- Python: `def, class, return, if, else, for, while, import, from, with, as, try, except, async, await`
- Generic fallback: highlight strings, numbers, comments

Colors from theme: `codeBg`, `codeText` for base. Keyword = `primary`. String = `success`. Comment = `textMuted`. Number = `warning`.

**Commit:** `feat: add SyntaxHighlightedText component with regex tokenizer`

---

## Task 5: DiffViewer

**File:** Create `components/DiffViewer.tsx`

**Props:**
```typescript
interface DiffViewerProps {
  diff: string;                     // Unified diff format string
}
```

**Implementation:** Parses unified diff into hunks. Renders each line with:
- `+` lines: green background (`success + '15'`)
- `-` lines: red background (`error + '15'`)
- `@@` headers: muted text with bold
- File headers (`---`, `+++`): bold

Uses ScrollView (not FlatList) since diffs are typically small.

**Commit:** `feat: add DiffViewer component for unified diffs`

---

## Task 6: AnsiRenderer

**File:** Create `components/AnsiRenderer.tsx`

**Props:**
```typescript
interface AnsiRendererProps {
  text: string;                     // Text with ANSI escape codes
}
```

**Implementation:** State machine that parses `\x1b[...m` sequences. Supports:
- 16 standard colors (30-37 fg, 40-47 bg)
- Bold (1), dim (2), underline (4), reset (0)
- 256 colors (38;5;N) — map to closest standard color

Returns array of `<Text>` spans with appropriate styles.

**Commit:** `feat: add AnsiRenderer component for terminal output`

---

## Task 7: ChipSelector

**File:** Create `components/ChipSelector.tsx`

**Props:**
```typescript
interface ChipSelectorProps {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  label?: string;
}
```

**Implementation:** Similar to existing `FilterChips` but with multi-select checkmark toggles. Horizontal ScrollView. Selected chips show checkmark icon and primary color tint.

**Commit:** `feat: add ChipSelector component for multi-select`

---

## Task 8: SearchBar

**File:** Create `components/SearchBar.tsx`

**Props:**
```typescript
interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  value?: string;
}
```

**Implementation:** TextInput with magnifying glass icon on left, clear button on right (visible when text present). 300ms debounce via useRef timer.

**Commit:** `feat: add SearchBar component with debounced search`

---

## Task 9: ModelPicker

**File:** Create `components/ModelPicker.tsx`

**Props:**
```typescript
interface ModelPickerProps {
  selected: string | null;
  onSelect: (model: string) => void;
}
```

**Implementation:** TouchableOpacity that opens a bottom sheet (or ActionSheet) with model options:
- `claude-opus-4-6` (label: "Opus 4.6")
- `claude-sonnet-4-6` (label: "Sonnet 4.6")
- `claude-haiku-4-5` (label: "Haiku 4.5")

Shows selected model name or "Default" as placeholder.

**Commit:** `feat: add ModelPicker component`

---

## Task 10: FileList

**File:** Create `components/FileList.tsx`

**Props:**
```typescript
interface FileListProps {
  files: { path: string; status: string }[];
  onSelect?: (path: string) => void;
}
```

**Implementation:** FlatList of file rows. Status indicator: M=orange, A=green, D=red, ?=gray circles. File path truncated from left (shows filename + parent). Tappable if onSelect provided.

**Commit:** `feat: add FileList component with status indicators`

---

## Task 11: TrendChart

**File:** Create `components/TrendChart.tsx`

**Props:**
```typescript
interface TrendChartProps {
  data: { date: string; value: number }[];
  height?: number;
  type?: 'bar' | 'line';
}
```

**Implementation:** Uses `react-native-svg` (Svg, Rect, Line, Path, Text). Auto-scales Y axis. X axis shows date labels. Bar chart default. Line chart draws Path with fill underneath.

**Commit:** `feat: add TrendChart component using react-native-svg`

---

## Task 12: DAGView

**File:** Create `components/DAGView.tsx`

**Props:**
```typescript
interface DAGNode {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  dependsOn: string[];
}

interface DAGViewProps {
  nodes: DAGNode[];
  onNodePress?: (id: string) => void;
}
```

**Implementation:** Topological layer assignment (BFS from roots). Positions nodes in columns (left to right). Draws edges with `react-native-svg` Line elements. Node colors from status (gray/blue/green/red). Scrollable horizontally.

**Commit:** `feat: add DAGView component for workflow visualization`

---

## Task 13: StatusDot

**File:** Create `components/StatusDot.tsx`

**Props:**
```typescript
interface StatusDotProps {
  status: 'online' | 'warning' | 'offline' | 'unknown';
  size?: 'sm' | 'md';
  pulse?: boolean;
}
```

**Implementation:** Small View with border-radius 50%. Colors: online=success, warning=warning, offline=error, unknown=textMuted. Pulse uses Reanimated opacity animation (0.3 → 1 loop).

**Commit:** `feat: add StatusDot component with optional pulse`

---

## Task 14: AvatarRow

**File:** Create `components/AvatarRow.tsx`

**Props:**
```typescript
interface AvatarRowProps {
  identities: string[];
  onAdd?: () => void;
  onRemove?: (identity: string) => void;
  maxVisible?: number;
}
```

**Implementation:** Horizontal row of overlapping circles (negative marginLeft for overlap). Each shows 2-letter initials from identity string. "+Add" button at end if onAdd provided. Long-press to remove.

**Commit:** `feat: add AvatarRow component for collaborator display`

---

## Execution Strategy

All 14 components are independent — no component depends on another (except DiffViewer optionally using SyntaxHighlightedText for content within hunks). Can be parallelized across 5 agents:

| Agent | Components |
|-------|-----------|
| A | ProgressMeter, TimeCountdown, TrendChart |
| B | ExpandableCard, SyntaxHighlightedText, DiffViewer |
| C | AnsiRenderer, ChipSelector, SearchBar |
| D | DAGView, ModelPicker, FileList |
| E | StatusDot, AvatarRow |

Each agent creates only new files in `components/` — zero merge conflicts.

After all agents complete, run `npx tsc --noEmit` to verify everything compiles.
