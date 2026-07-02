import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { parseDateKey, todayKey, toLocalDateKey } from '@/utils/dates';

type WeekDaySelectorProps = {
  selectedDate?: string;
  onSelectDate?: (dateKey: string) => void;
  className?: string;
  /** White pills on grey sheet | frosted pills on hero card */
  variant?: 'header' | 'overlay' | 'featured';
};

function getWeekDates(anchor = new Date()) {
  const day = anchor.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(anchor);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(anchor.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

const DAY_LABELS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_LABELS_FEATURED = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekDaySelector({
  selectedDate = todayKey(),
  onSelectDate,
  className,
  variant = 'header',
}: WeekDaySelectorProps) {
  const weekDates = getWeekDates(parseDateKey(selectedDate));
  const isFeatured = variant === 'featured';
  const isOverlay = variant === 'overlay';

  return (
    <View className={`flex-row justify-between gap-1 px-0.5 ${className ?? 'mt-6'}`}>
      {weekDates.map((date, index) => {
        const dateKey = toLocalDateKey(date);
        const isSelected = dateKey === selectedDate;
        const isToday = dateKey === todayKey();
        const dayNum = date.getDate();

        if (isFeatured) {
          return (
            <Pressable
              key={dateKey}
              onPress={() => onSelectDate?.(dateKey)}
              className={`min-h-[56px] flex-1 items-center justify-center rounded-2xl py-2 ${
                isSelected ? 'bg-white' : 'bg-white/10'
              }`}>
              <Text
                className={`text-[10px] font-sans-medium uppercase ${
                  isSelected ? 'text-neutral-500' : 'text-white/70'
                }`}>
                {DAY_LABELS_FEATURED[index]}
              </Text>
              <Text
                className={`mt-0.5 font-sans-bold text-base ${
                  isSelected ? 'text-cinnamon-wood-400' : 'text-white'
                }`}>
                {dayNum}
              </Text>
            </Pressable>
          );
        }

        const pillClass = isOverlay
          ? isSelected
            ? 'bg-white border-2 border-cinnamon-wood-400'
            : 'bg-white border border-ash-grey-200'
          : isSelected
            ? 'bg-white'
            : 'border border-white/30 bg-white/10';

        const labelClass = isOverlay
          ? isSelected
            ? 'text-cinnamon-wood-600'
            : 'text-blue-spruce-800'
          : isSelected
            ? 'text-blue-spruce-800'
            : 'text-white/90';

        return (
          <Pressable
            key={dateKey}
            onPress={() => onSelectDate?.(dateKey)}
            className={`h-10 w-10 items-center justify-center rounded-full ${pillClass}`}
            style={
              isOverlay
                ? {
                    shadowColor: '#051f1c',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : undefined
            }>
            <Text className={`font-sans-semibold text-sm ${labelClass}`}>{DAY_LABELS_SHORT[index]}</Text>
            {isToday && !isSelected ? (
              <View
                className={`absolute -bottom-1 h-1 w-1 rounded-full ${isOverlay ? 'bg-cinnamon-wood-400' : 'bg-white'}`}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
