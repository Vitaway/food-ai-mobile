import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { Text } from '@/components/ui/Text';
import type { PlateContainerType } from '@/services/contracts/plateDetectionService';
import { formatDiameterCm } from '@/utils/formatDiameter';

type PlateSizeCardProps = {
  detecting?: boolean;
  detected?: boolean;
  containerType?: PlateContainerType | null;
  plateDiameterCm?: number | null;
  confidence?: number | null;
  errorMessage?: string | null;
  compact?: boolean;
};

function containerLabel(type: PlateContainerType | null | undefined): string {
  if (type === 'bowl') return 'Bowl';
  if (type === 'plate') return 'Plate';
  return 'Dish';
}

export function PlateSizeCard({
  detecting = false,
  detected = false,
  containerType = null,
  plateDiameterCm = null,
  confidence = null,
  errorMessage = null,
  compact = false,
}: PlateSizeCardProps) {
  return (
    <LogCard className={compact ? 'mt-4' : ''}>
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-spruce-50">
          {detecting ? (
            <ActivityIndicator size="small" color="#023459" />
          ) : (
            <Ionicons
              name={detected ? 'checkmark-circle-outline' : errorMessage ? 'warning-outline' : 'ellipse-outline'}
              size={22}
              color={detected ? '#1D9E75' : errorMessage ? '#C45C26' : '#9ca3af'}
            />
          )}
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-base text-neutral-900">Plate detection</Text>

          {detecting ? (
            <Text className="mt-1 text-sm leading-5 text-neutral-500">
              Analyzing your photo with AI…
            </Text>
          ) : errorMessage ? (
            <Text className="mt-1 text-sm leading-5 text-cinnamon-wood-600">{errorMessage}</Text>
          ) : detected && plateDiameterCm != null ? (
            <>
              <Text className="mt-1 font-sans-bold text-2xl text-blue-spruce-700">
                {containerLabel(containerType)} {formatDiameterCm(plateDiameterCm)}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-neutral-500">
                {confidence != null
                  ? `${containerLabel(containerType)} detected (${Math.round(confidence * 100)}% confidence).`
                  : `${containerLabel(containerType)} detected in your photo.`}
              </Text>
            </>
          ) : (
            <Text className="mt-1 text-sm leading-5 text-neutral-500">
              No plate or bowl detected — you can still analyze the food or describe it below and send to your coach.
            </Text>
          )}
        </View>
      </View>
    </LogCard>
  );
}
