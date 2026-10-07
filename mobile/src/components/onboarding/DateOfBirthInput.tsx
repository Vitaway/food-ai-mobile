import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { FieldWell } from '@/components/ui/FieldInput';
import { ageFromDateOfBirth, isValidDateOfBirth } from '@/utils/dateOfBirth';

function clampBirthDate(date: Date) {
  const max = maxBirthDate();
  const min = minBirthDate();
  if (date.getTime() > max.getTime()) return max;
  if (date.getTime() < min.getTime()) return min;
  return date;
}

function maxBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d;
}

function minBirthDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 120);
  return d;
}

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  if (!isValidDateOfBirth(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDisplayDate(value: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) return null;
  return parsed.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function defaultPickerDate(value: string) {
  return parseIsoDate(value) ?? maxBirthDate();
}

export function DateOfBirthInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => defaultPickerDate(value));
  const label = formatDisplayDate(value);
  const complete = isValidDateOfBirth(value);

  const openPicker = () => {
    setDraft(defaultPickerDate(value));
    setOpen(true);
  };

  const applyDate = (next: Date) => {
    onChange(toIsoDate(clampBirthDate(next)));
  };

  const confirmDraft = () => {
    applyDate(draft);
    setOpen(false);
  };

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'dismissed' || !date) return;
      applyDate(date);
      return;
    }
    if (date) setDraft(clampBirthDate(date));
  };

  return (
    <View>
      <Text className="font-sans-semibold text-sm text-blue-spruce-800">Date of birth</Text>
      <FieldWell>
        <Pressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel="Select date of birth"
          className="min-h-[44px] flex-row items-center justify-between active:opacity-90">
          <Text className={`text-[16px] font-sans-semibold ${label ? 'text-blue-spruce-900' : 'text-[#6b7a52]'}`}>
            {label ?? 'Select date'}
          </Text>
          <Ionicons name="calendar-outline" size={22} color="#1a3a2a" />
        </Pressable>
      </FieldWell>
      {complete ? (
        <Text className="mt-2 text-sm text-blue-spruce-700/70">Age {ageFromDateOfBirth(value)}</Text>
      ) : null}

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="calendar"
          maximumDate={maxBirthDate()}
          minimumDate={minBirthDate()}
          onChange={onPickerChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable className="flex-1 justify-end bg-black/35" onPress={() => setOpen(false)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="rounded-t-[28px] bg-white px-4 pb-8 pt-3">
              <View className="mb-2 flex-row items-center justify-between px-1">
                <Text className="font-sans-semibold text-neutral-500">Date of birth</Text>
                <Pressable onPress={confirmDraft} hitSlop={12}>
                  <Text className="font-sans-semibold text-blue-spruce-700">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draft}
                mode="date"
                display="spinner"
                themeVariant="light"
                maximumDate={maxBirthDate()}
                minimumDate={minBirthDate()}
                onChange={onPickerChange}
                style={{ alignSelf: 'center' }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
