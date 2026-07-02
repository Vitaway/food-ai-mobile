import { Ionicons } from '@expo/vector-icons';
import { Image, Platform, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { BRAND_HEADER_COLOR } from '@/components/ui/GradientHeader';
import { palette } from '@/design-system/colors';

type ProfileHeroCardProps = {
  displayName: string;
  subtitle: string;
  avatarUrl?: string;
  initial: string;
};

export function ProfileHeroCard({ displayName, subtitle, avatarUrl, initial }: ProfileHeroCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: BRAND_HEADER_COLOR,
          borderRadius: 20,
          padding: 20,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        },
        Platform.select({
          ios: {
            shadowColor: palette['blue-spruce'][900],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
          },
          android: { elevation: 6 },
        }),
      ]}>
      <View className="relative">
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="h-16 w-16 rounded-full" resizeMode="cover" />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Text className="font-sans-bold text-2xl text-white">{initial}</Text>
          </View>
        )}
        <View className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-blue-spruce-300">
          <Ionicons name="checkmark" size={14} color="#ffffff" />
        </View>
      </View>
      <View className="flex-1">
        <Text className="font-sans-bold text-xl text-white">{displayName}</Text>
        {subtitle ? <Text className="mt-1 text-sm text-white/80">{subtitle}</Text> : null}
      </View>
    </View>
  );
}
