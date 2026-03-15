import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors, useThemedStyles, type ColorPalette, FontSize, Spacing, BorderRadius } from '../constants/theme';
import { describeCron } from '../lib/cron-utils';

type Frequency = 'hourly' | 'daily' | 'weekly' | 'monthly';

const FREQUENCIES: { label: string; value: Frequency }[] = [
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CRON_DAYS = ['1', '2', '3', '4', '5', '6', '0']; // cron day numbers

interface Props {
  value: string;
  onChange: (cronExpression: string) => void;
}

function buildCron(frequency: Frequency, hour: number, minute: number, selectedDays: string[]): string {
  switch (frequency) {
    case 'hourly':
      return `${minute} * * * *`;
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly': {
      const days = selectedDays.length > 0 ? selectedDays.join(',') : '*';
      return `${minute} ${hour} * * ${days}`;
    }
    case 'monthly':
      return `${minute} ${hour} 1 * *`;
  }
}

export function SchedulePicker({ value, onChange }: Props) {
  const colors = useColors();
  const styles = useThemedStyles(colors, makeStyles);

  const [advanced, setAdvanced] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [selectedDays, setSelectedDays] = useState<string[]>(['1', '2', '3', '4', '5']); // weekdays

  const toggleDay = useCallback((day: string) => {
    setSelectedDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      const cron = buildCron(frequency, hour, minute, next);
      onChange(cron);
      return next;
    });
  }, [frequency, hour, minute, onChange]);

  const handleFrequencyChange = useCallback((f: Frequency) => {
    setFrequency(f);
    const cron = buildCron(f, hour, minute, selectedDays);
    onChange(cron);
  }, [hour, minute, selectedDays, onChange]);

  const handleHourChange = useCallback((text: string) => {
    const h = Math.min(23, Math.max(0, parseInt(text, 10) || 0));
    setHour(h);
    onChange(buildCron(frequency, h, minute, selectedDays));
  }, [frequency, minute, selectedDays, onChange]);

  const handleMinuteChange = useCallback((text: string) => {
    const m = Math.min(59, Math.max(0, parseInt(text, 10) || 0));
    setMinute(m);
    onChange(buildCron(frequency, hour, m, selectedDays));
  }, [frequency, hour, selectedDays, onChange]);

  return (
    <View>
      <View style={styles.modeToggle}>
        <TouchableOpacity onPress={() => setAdvanced(!advanced)}>
          <Text style={styles.modeToggleText}>{advanced ? 'Simple' : 'Advanced'}</Text>
        </TouchableOpacity>
      </View>

      {advanced ? (
        <View>
          <TextInput
            style={styles.cronInput}
            value={value}
            onChangeText={onChange}
            placeholder="0 9 * * 1-5"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.preview}>{describeCron(value)}</Text>
        </View>
      ) : (
        <View>
          {/* Frequency chips */}
          <View style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, frequency === f.value && styles.chipActive]}
                onPress={() => handleFrequencyChange(f.value)}
              >
                <Text style={[styles.chipText, frequency === f.value && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Time picker (not for hourly) */}
          {frequency !== 'hourly' && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>At</Text>
              <TextInput
                style={styles.timeInput}
                value={String(hour)}
                onChangeText={handleHourChange}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput
                style={styles.timeInput}
                value={String(minute).padStart(2, '0')}
                onChangeText={handleMinuteChange}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          )}

          {/* Minute picker for hourly */}
          {frequency === 'hourly' && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>At minute</Text>
              <TextInput
                style={styles.timeInput}
                value={String(minute)}
                onChangeText={handleMinuteChange}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          )}

          {/* Day-of-week picker (weekly only) */}
          {frequency === 'weekly' && (
            <View style={styles.chipRow}>
              {DAYS_OF_WEEK.map((day, i) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, selectedDays.includes(CRON_DAYS[i]) && styles.chipActive]}
                  onPress={() => toggleDay(CRON_DAYS[i])}
                >
                  <Text style={[styles.chipText, selectedDays.includes(CRON_DAYS[i]) && styles.chipTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.preview}>{describeCron(value)}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: ColorPalette) =>
  StyleSheet.create({
    modeToggle: { alignItems: 'flex-end', marginBottom: Spacing.sm },
    modeToggleText: { fontSize: FontSize.sm, color: c.primary, fontWeight: '600' },
    cronInput: {
      backgroundColor: c.background,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      color: c.text,
      fontSize: FontSize.md,
      borderWidth: 1,
      borderColor: c.inputBorder,
      fontFamily: 'monospace',
    },
    preview: {
      fontSize: FontSize.sm,
      color: c.textMuted,
      marginTop: Spacing.xs,
      fontStyle: 'italic',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.background,
    },
    chipActive: { borderColor: c.primary, backgroundColor: c.primaryBg20 },
    chipText: { fontSize: FontSize.sm, color: c.textMuted },
    chipTextActive: { color: c.primary },
    dayChip: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.background,
      minWidth: 44,
      alignItems: 'center',
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    timeLabel: { fontSize: FontSize.md, color: c.text },
    timeInput: {
      backgroundColor: c.background,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
      color: c.text,
      fontSize: FontSize.lg,
      borderWidth: 1,
      borderColor: c.inputBorder,
      width: 50,
      textAlign: 'center',
      fontWeight: '600',
    },
    timeSeparator: { fontSize: FontSize.lg, color: c.text, fontWeight: '700' },
  });
