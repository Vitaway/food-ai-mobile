import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

type CoachDashboardStatCardProps = {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  onPress?: () => void;
  wide?: boolean;
};

export function CoachDashboardStatCard({
  label,
  value,
  trend,
  trendUp,
  icon,
  iconBg,
  iconColor,
  onPress,
  wide,
}: CoachDashboardStatCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`rounded-3xl bg-white p-4 active:opacity-90 ${wide ? 'min-w-[160px]' : 'min-w-[140px]'}`}
      style={{
        shadowColor: '#1a1c17',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 2,
      }}>
      <View className="flex-row items-start justify-between">
        <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: iconBg }}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        {trend ? (
          <View className={`rounded-full px-2 py-0.5 ${trendUp ? 'bg-shamrock-50' : 'bg-red-50'}`}>
            <Text className={`text-[10px] font-sans-semibold ${trendUp ? 'text-shamrock-700' : 'text-red-600'}`}>
              {trend}
            </Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-3 text-xs text-neutral-500">{label}</Text>
      <Text className="mt-0.5 font-sans-bold text-xl text-neutral-900">{value}</Text>
    </Pressable>
  );
}
