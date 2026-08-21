import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/ui/AppTextInput';
import { Text } from '@/components/ui/Text';

type SendBackReasonModalProps = {
  visible: boolean;
  loading?: boolean;
  initialNote?: string;
  onClose: () => void;
  onSubmit: (note: string) => void;
};

export function SendBackReasonModal({
  visible,
  loading = false,
  initialNote = '',
  onClose,
  onSubmit,
}: SendBackReasonModalProps) {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (visible) setNote(initialNote);
  }, [visible, initialNote]);

  const trimmed = note.trim();
  const canSend = trimmed.length >= 3 && !loading;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={loading ? undefined : onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/45">
        <Pressable className="flex-1" onPress={loading ? undefined : onClose} />
        <View
          className="rounded-t-[28px] bg-white px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}>
          <View className="mb-4 items-center">
            <View className="h-1.5 w-10 rounded-full bg-ash-grey-200" />
          </View>

          <Text className="font-sans-bold text-xl text-blue-spruce-900">Send back to patient</Text>
          <Text className="mt-1 text-sm leading-5 text-ash-grey-500">
            Tell them what to fix. They’ll see this note and can log the meal again.
          </Text>

          <AppTextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Please retake the photo with better lighting…"
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            className="mt-4 min-h-[120px] rounded-[22px] border border-ash-grey-200 bg-ash-grey-50 px-4 py-3 text-[15px] text-neutral-900"
            editable={!loading}
            autoFocus
          />

          <View className="mt-4 flex-row gap-3">
            <Pressable
              disabled={loading}
              onPress={onClose}
              className="h-12 flex-1 items-center justify-center rounded-2xl border border-ash-grey-200 bg-white active:opacity-80">
              <Text className="font-sans-semibold text-[15px] text-blue-spruce-800">Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!canSend}
              onPress={() => onSubmit(trimmed)}
              className="h-12 flex-1 items-center justify-center rounded-2xl bg-red-600 active:opacity-90"
              style={{ opacity: canSend ? 1 : 0.45 }}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-sans-bold text-[15px] text-white">Send back</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
