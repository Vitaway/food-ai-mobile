import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  addMonths,
  formatMonthYear,
  getMonthMatrix,
  parseDateKey,
  WEEKDAY_LABELS,
  type CalendarCell,
} from '@/utils/calendar';
import { todayKey } from '@/utils/dates';

type MonthCalendarProps = {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  markedDates?: Set<string>;
  className?: string;
};

function CalendarDay({
  cell,
  selectedDate,
  today,
  markedDates,
  onSelectDate,
}: {
  cell: CalendarCell;
  selectedDate: string;
  today: string;
  markedDates: Set<string>;
  onSelectDate: (dateKey: string) => void;
}) {
  const { dateKey, inCurrentMonth } = cell;
  const dayNumber = cell.date.getDate();
  const isSelected = dateKey === selectedDate;
  const isToday = dateKey === today;
  const hasLog = markedDates.has(dateKey);

  const textClass = !inCurrentMonth
    ? 'text-neutral-300'
    : isSelected
      ? 'text-white'
      : 'text-neutral-800';

  return (
    <Pressable
      onPress={() => onSelectDate(dateKey)}
      className="h-11 flex-1 items-center justify-center"
      accessibilityRole="button"
      accessibilityLabel={`${dayNumber}`}
      accessibilityState={{ selected: isSelected }}>
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${
          isSelected ? 'bg-blue-spruce-600' : isToday ? 'border-2 border-blue-spruce-400 bg-blue-spruce-50' : ''
        }`}>
        <Text className={`font-sans-medium text-sm ${textClass}`}>{dayNumber}</Text>
      </View>
      {hasLog && inCurrentMonth ? (
        <View
          className={`absolute bottom-0.5 h-1.5 w-1.5 rounded-full ${
            isSelected ? 'bg-white' : 'bg-shamrock-500'
          }`}
        />
      ) : (
        <View className="absolute bottom-0.5 h-1.5 w-1.5" />
      )}
    </Pressable>
  );
}

export function MonthCalendar({ selectedDate, onSelectDate, markedDates, className }: MonthCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => parseDateKey(selectedDate));
  const today = todayKey();
  const marked = markedDates ?? new Set<string>();

  const weeks = useMemo(() => getMonthMatrix(viewMonth), [viewMonth]);

  const goPrevMonth = () => setViewMonth((current) => addMonths(current, -1));
  const goNextMonth = () => setViewMonth((current) => addMonths(current, 1));

  return (
    <View className={className}>
      <View className="mb-3 flex-row items-center justify-between px-1">
        <Pressable
          onPress={goPrevMonth}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          className="h-9 w-9 items-center justify-center rounded-full bg-white">
          <Ionicons name="chevron-back" size={20} color="#023459" />
        </Pressable>
        <Text className="font-sans-semibold text-base text-neutral-900">{formatMonthYear(viewMonth)}</Text>
        <Pressable
          onPress={goNextMonth}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          className="h-9 w-9 items-center justify-center rounded-full bg-white">
          <Ionicons name="chevron-forward" size={20} color="#023459" />
        </Pressable>
      </View>

      <View className="flex-row px-0.5">
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} className="flex-1 items-center py-1">
            <Text className="text-xs font-sans-medium text-neutral-400">{label}</Text>
          </View>
        ))}
      </View>

      <View className="mt-1 gap-0.5">
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row">
            {week.map((cell) => (
              <CalendarDay
                key={cell.dateKey}
                cell={cell}
                selectedDate={selectedDate}
                today={today}
                markedDates={marked}
                onSelectDate={(dateKey) => {
                  onSelectDate(dateKey);
                  if (!cell.inCurrentMonth) {
                    setViewMonth(parseDateKey(dateKey));
                  }
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
