import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { parseDateKey, todayKey, toLocalDateKey } from '@/utils/dates';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

type HealthWeekStripProps = {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  markedDates?: Set<string>;
};

function startOfWeek(anchor: Date) {
  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(anchor.getDate() + mondayOffset);
  return monday;
}

function weekDatesFrom(selectedDate: string) {
  const monday = startOfWeek(parseDateKey(selectedDate));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function shiftWeek(selectedDate: string, deltaWeeks: number) {
  const date = parseDateKey(selectedDate);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return toLocalDateKey(date);
}

function formatWeekRange(dates: Date[]) {
  const start = dates[0];
  const end = dates[6];
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }

  const startLabel = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startLabel} – ${endLabel}`;
}

export function HealthWeekStrip({
  selectedDate,
  onSelectDate,
  markedDates = new Set(),
}: HealthWeekStripProps) {
  const weekDates = weekDatesFrom(selectedDate);
  const today = todayKey();

  return (
    <View className="overflow-hidden rounded-[24px] border border-blue-spruce-100 bg-white">
      <View className="bg-blue-spruce-600 px-4 pb-4 pt-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => onSelectDate(shiftWeek(selectedDate, -1))}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
            accessibilityLabel="Previous week">
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </Pressable>

          <View className="items-center px-2">
            <Text className="text-[11px] font-sans-semibold uppercase tracking-wide text-white/70">
              This week
            </Text>
            <Text className="mt-0.5 font-sans-bold text-base text-white">
              {formatWeekRange(weekDates)}
            </Text>
          </View>

          <Pressable
            onPress={() => onSelectDate(shiftWeek(selectedDate, 1))}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
            accessibilityLabel="Next week">
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </Pressable>
        </View>

        <View className="flex-row gap-1.5">
          {weekDates.map((date, index) => {
            const dateKey = toLocalDateKey(date);
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === today;
            const hasLog = markedDates.has(dateKey);

            return (
              <Pressable
                key={dateKey}
                onPress={() => onSelectDate(dateKey)}
                className={`min-h-[72px] flex-1 items-center justify-center rounded-2xl px-1 py-2.5 ${
                  isSelected ? 'bg-white' : 'bg-white/10'
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${DAY_LABELS[index]} ${date.getDate()}`}>
                <Text
                  className={`text-[10px] font-sans-semibold uppercase ${
                    isSelected ? 'text-neutral-500' : 'text-white/65'
                  }`}>
                  {DAY_LABELS[index]}
                </Text>
                <Text
                  className={`mt-1 font-sans-bold text-lg ${
                    isSelected ? 'text-blue-spruce-800' : 'text-white'
                  }`}>
                  {date.getDate()}
                </Text>
                <View className="mt-1.5 h-1.5 w-1.5 items-center justify-center">
                  {hasLog ? (
                    <View
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-shamrock-500' : 'bg-shamrock-300'
                      }`}
                    />
                  ) : isToday && !isSelected ? (
                    <View className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => onSelectDate(today)}
          className="mt-3 self-center rounded-full bg-white/15 px-3 py-1.5 active:bg-white/25">
          <Text className="text-xs font-sans-semibold text-white">Jump to today</Text>
        </Pressable>
      </View>
    </View>
  );
}
