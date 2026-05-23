import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { todayKey } from '@/utils/dates';

type WeekDaySelectorProps = {
  selectedDate?: string;
  onSelectDate?: (dateKey: string) => void;
  className?: string;
  /** White pills on the home sheet overlay — all days use the same elevated style. */
  variant?: 'header' | 'overlay';
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

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WeekDaySelector({
  selectedDate = todayKey(),
  onSelectDate,
  className,
  variant = 'header',
}: WeekDaySelectorProps) {
  const weekDates = getWeekDates(new Date(selectedDate));
  const isOverlay = variant === 'overlay';

  return (
    <View className={`flex-row justify-between px-1 ${className ?? 'mt-6'}`}>
      {weekDates.map((date, index) => {
        const dateKey = date.toISOString().slice(0, 10);
        const isSelected = dateKey === selectedDate;
        const isToday = dateKey === todayKey();

        const pillClass = isOverlay
          ? isSelected
            ? 'bg-white border-2 border-blue-spruce-500'
            : 'bg-white border border-ash-grey-200'
          : isSelected
            ? 'bg-white'
            : 'border border-white/30 bg-white/10';

        const labelClass = isOverlay
          ? 'text-blue-spruce-800'
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
            <Text className={`font-sans-semibold text-sm ${labelClass}`}>{DAY_LABELS[index]}</Text>
            {isToday && !isSelected ? (
              <View
                className={`absolute -bottom-1 h-1 w-1 rounded-full ${isOverlay ? 'bg-blue-spruce-500' : 'bg-white'}`}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
