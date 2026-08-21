import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';

import { ResolvedImage } from '@/components/ui/ResolvedImage';
import { Text } from '@/components/ui/Text';
import { BRAND_HEADER_COLOR } from '@/components/ui/GradientHeader';
import { palette } from '@/design-system/colors';

type ProfileHeroCardProps = {
  displayName: string;
  subtitle: string;
  /** Optional second line under subtitle (e.g. email). */
  detail?: string;
  avatarUrl?: string;
  initial: string;
};

export function ProfileHeroCard({
  displayName,
  subtitle,
  detail,
  avatarUrl,
  initial,
}: ProfileHeroCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: BRAND_HEADER_COLOR,
          borderRadius: 28,
          paddingVertical: 22,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 18,
        },
        Platform.select({
          ios: {
            shadowColor: palette['blue-spruce'][900],
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.22,
            shadowRadius: 18,
          },
          android: { elevation: 6 },
        }),
      ]}>
      <View className="relative">
        <View className="h-[72px] w-[72px] overflow-hidden rounded-full border-[3px] border-white/25">
          <ResolvedImage
            uri={avatarUrl}
            className="h-full w-full"
            resizeMode="cover"
            fallback={
              <View className="h-full w-full items-center justify-center bg-white/20">
                <Text className="font-sans-bold text-2xl text-white">{initial}</Text>
              </View>
            }
          />
        </View>
        <View className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-spruce-300">
          <Ionicons name="checkmark" size={14} color="#ffffff" />
        </View>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans-bold text-[22px] leading-7 text-white" numberOfLines={1}>
          {displayName}
        </Text>
        {subtitle ? (
          <Text className="mt-1.5 text-[14px] leading-5 text-white/80" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {detail ? (
          <Text className="mt-1 text-[13px] leading-5 text-white/55" numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
