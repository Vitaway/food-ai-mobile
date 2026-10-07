import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { LogCard } from '@/components/log/LogScreenShell';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/context/LocaleContext';
import { palette } from '@/design-system/colors';
import { useSpeechDictation } from '@/hooks/useSpeechDictation';

type LogSpeakStepProps = {
  value: string;
  loading?: boolean;
  onChangeText: (text: string) => void;
  onContinue: () => void;
};

export function LogSpeakStep({
  value,
  loading = false,
  onChangeText,
  onContinue,
}: LogSpeakStepProps) {
  const { t, locale } = useI18n();
  const { status, transcript, setTranscript, ready, canListen, start, stop, abort } =
    useSpeechDictation({ locale });

  useEffect(() => {
    if (!transcript) return;
    onChangeText(transcript);
  }, [onChangeText, transcript]);

  useEffect(() => {
    return () => {
      void abort();
    };
  }, [abort]);

  const listening = status === 'listening';
  const canContinue = value.trim().length >= 3;

  const statusCopy =
    status === 'listening'
      ? t.log.speakListening
      : status === 'denied'
        ? t.log.speakDenied
        : status === 'unavailable'
          ? t.log.speakUnavailable
          : status === 'error'
            ? t.log.speakError
            : t.log.speakIdle;

  const toggleListen = async () => {
    if (listening) {
      await stop();
      return;
    }
    await start();
  };

  return (
    <>
      <LogCard>
        <Text className="font-sans-semibold text-lg text-neutral-900">{t.log.speakTitle}</Text>
        <Text className="mt-1 text-sm leading-5 text-neutral-500">{t.log.speakHint}</Text>

        <View className="mt-5 items-center">
          <Pressable
            onPress={() => void toggleListen()}
            disabled={!ready || loading || (!canListen && !listening)}
            accessibilityRole="button"
            accessibilityLabel={listening ? t.log.speakStop : t.log.speakStart}
            className="h-28 w-28 items-center justify-center rounded-full"
            style={{
              backgroundColor: listening ? palette['cinnamon-wood'][500] : palette['blue-spruce'][800],
              opacity: !ready || (!canListen && !listening) ? 0.45 : 1,
            }}>
            <Ionicons name={listening ? 'stop' : 'mic'} size={36} color="#ffffff" />
          </Pressable>
          <Text className="mt-3 text-center text-[13px] text-ash-grey-600">{statusCopy}</Text>
        </View>

        <AppTextInput
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setTranscript(text);
          }}
          placeholder={t.log.speakPlaceholder}
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
          className="mt-5 min-h-[110px] rounded-2xl border border-ash-grey-100 bg-ash-grey-50 px-4 py-3"
        />
      </LogCard>

      <Button
        label={loading ? t.log.preparing : t.log.speakCheckSave}
        variant="primary"
        fullWidth
        onPress={onContinue}
        disabled={!canContinue || loading}
      />
    </>
  );
}
