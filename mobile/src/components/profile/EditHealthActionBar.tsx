import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { palette } from '@/design-system/colors';

type ConfirmKind = 'save' | 'close';

type ConfirmActionModalProps = {
  visible: boolean;
  kind: ConfirmKind | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const COPY: Record<ConfirmKind, { title: string; message: string; confirm: string; destructive?: boolean }> = {
  save: {
    title: 'Save changes?',
    message: 'Your health profile and daily targets will be updated.',
    confirm: 'Save & close',
  },
  close: {
    title: 'Discard changes?',
    message: 'Anything you changed on this screen will be lost.',
    confirm: 'Discard',
    destructive: true,
  },
};

export function ConfirmActionModal({ visible, kind, loading, onCancel, onConfirm }: ConfirmActionModalProps) {
  if (!kind) return null;
  const copy = COPY[kind];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onCancel} />
        <View className="mx-6 w-full max-w-sm overflow-hidden rounded-2xl border-2 border-blue-spruce-900 bg-white">
          <View className="px-5 py-5">
            <Text className="font-sans-bold text-lg text-neutral-900">{copy.title}</Text>
            <Text className="mt-2 text-sm leading-5 text-neutral-600">{copy.message}</Text>
          </View>
          <View className="flex-row gap-3 border-t border-ash-grey-100 px-4 py-4">
            <View className="flex-1">
              <Button label="Cancel" variant="outline" onPress={onCancel} disabled={loading} fullWidth />
            </View>
            <View className="flex-1">
              <Button
                label={loading ? 'Saving…' : copy.confirm}
                variant={copy.destructive ? 'danger' : 'secondary'}
                onPress={onConfirm}
                loading={loading && kind === 'save'}
                disabled={loading}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type EditHealthActionBarProps = {
  isLastStep: boolean;
  saving?: boolean;
  onSave: () => Promise<boolean>;
  onNext: () => void;
  onClose: () => void;
};

type ActionItemProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function ActionItem({ label, icon, color, bg, onPress, disabled, loading }: ActionItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="min-w-[72px] items-center gap-1.5 active:opacity-80">
      <View
        className="h-12 w-12 items-center justify-center rounded-full border-2 border-blue-spruce-900"
        style={{ backgroundColor: bg }}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Ionicons name={icon} size={22} color={color} />
        )}
      </View>
      <Text className="text-center text-xs font-sans-medium text-neutral-600">{label}</Text>
    </Pressable>
  );
}

export function EditHealthActionBar({
  isLastStep,
  saving = false,
  onSave,
  onNext,
  onClose,
}: EditHealthActionBarProps) {
  const [pending, setPending] = useState<ConfirmKind | null>(null);

  const closeModal = () => {
    if (!saving) setPending(null);
  };

  const handleConfirm = async () => {
    if (pending === 'save') {
      const ok = await onSave();
      if (ok) setPending(null);
      return;
    }
    if (pending === 'close') {
      setPending(null);
      onClose();
    }
  };

  return (
    <>
      <View className="flex-row items-start px-2">
        <View className="flex-1 items-start">
          <ActionItem
            label="Close"
            icon="close"
            color={palette['blue-spruce'][700]}
            bg={palette['ash-grey'][100]}
            onPress={() => setPending('close')}
            disabled={saving}
          />
        </View>

        <View className="items-center">
          <ActionItem
            label="Save"
            icon="checkmark"
            color="#ffffff"
            bg={palette.shamrock[500]}
            onPress={() => setPending('save')}
            disabled={saving}
            loading={saving}
          />
        </View>

        <View className="flex-1 items-end">
          {!isLastStep ? (
            <ActionItem
              label="Next"
              icon="arrow-forward"
              color={palette['blue-spruce'][700]}
              bg="#ffffff"
              onPress={onNext}
              disabled={saving}
            />
          ) : (
            <View className="h-12 w-12" />
          )}
        </View>
      </View>

      <ConfirmActionModal
        visible={pending != null}
        kind={pending}
        loading={saving}
        onCancel={closeModal}
        onConfirm={handleConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 31, 28, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
