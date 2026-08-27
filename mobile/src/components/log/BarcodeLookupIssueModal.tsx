import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { tf, useI18n } from '@/context/LocaleContext';

export type BarcodeLookupIssue =
  | { type: 'not_found'; code: string }
  | { type: 'lookup_failed'; code: string };

type BarcodeLookupIssueModalProps = {
  issue: BarcodeLookupIssue | null;
  onSearchByName: () => void;
  onRetry: () => void;
};

export function BarcodeLookupIssueModal({
  issue,
  onSearchByName,
  onRetry,
}: BarcodeLookupIssueModalProps) {
  const { t } = useI18n();
  if (!issue) return null;

  const isMissing = issue.type === 'not_found';
  const title = isMissing ? t.log.barcodeNotFoundTitle : t.log.barcodeLookupFailedTitle;
  const body = isMissing
    ? tf(t.log.barcodeNotFoundBody, { code: issue.code })
    : t.log.barcodeLookupFailedBody;
  const secondary = isMissing ? t.log.barcodeNotFoundRetry : t.log.barcodeLookupFailedRetry;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onRetry}>
      <View className="flex-1 items-center justify-center bg-black/55 px-6">
        <Pressable className="absolute inset-0" onPress={onRetry} />
        <View className="w-full max-w-[360px] overflow-hidden rounded-[28px] bg-white px-5 pb-5 pt-6">
          <View className="items-center">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-cinnamon-wood-50">
              <Ionicons
                name={isMissing ? 'barcode-outline' : 'cloud-offline-outline'}
                size={30}
                color="#b5654a"
              />
            </View>
            <Text className="mt-4 text-center font-sans-bold text-xl text-blue-spruce-900">{title}</Text>
            <Text className="mt-2 text-center text-[15px] leading-6 text-neutral-500">{body}</Text>
          </View>

          <View className="mt-6 gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={onSearchByName}
              className="min-h-12 items-center justify-center rounded-2xl bg-blue-spruce-700 px-3 active:opacity-85">
              <Text className="font-sans-semibold text-[15px] text-white">{t.log.barcodeNotFoundSearch}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              className="min-h-12 items-center justify-center rounded-2xl border border-ash-grey-200 bg-ash-grey-50 active:opacity-85">
              <Text className="font-sans-semibold text-[15px] text-blue-spruce-900">{secondary}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
