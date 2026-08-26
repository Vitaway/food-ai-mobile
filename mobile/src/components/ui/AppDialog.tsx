import { Modal, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';

export type AppDialogAction = {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
};

export type AppDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  actions: AppDialogAction[];
  onRequestClose?: () => void;
};

function ActionButton({
  label,
  variant = 'default',
  onPress,
}: {
  label: string;
  variant?: AppDialogAction['variant'];
  onPress: () => void;
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-12 flex-1 items-center justify-center rounded-2xl px-3 active:opacity-85 ${
        isDanger
          ? 'bg-red-600'
          : isPrimary
            ? 'bg-blue-spruce-700'
            : 'border border-ash-grey-200 bg-ash-grey-50'
      }`}>
      <Text
        className={`text-center font-sans-semibold text-[15px] ${
          isDanger || isPrimary ? 'text-white' : 'text-blue-spruce-900'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Centered branded dialog used instead of React Native `Alert`. */
export function AppDialog({ visible, title, message, actions, onRequestClose }: AppDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View className="flex-1 items-center justify-center bg-black/45 px-7">
        <Pressable className="absolute inset-0" onPress={onRequestClose} />
        <View className="w-full max-w-[340px] rounded-[28px] bg-white px-5 pb-5 pt-6 shadow-xl">
          <Text className="text-center font-sans-bold text-xl text-blue-spruce-900">{title}</Text>
          {message ? (
            <Text className="mt-2 text-center text-[15px] leading-6 text-neutral-500">{message}</Text>
          ) : null}

          <View className={`mt-6 gap-3 ${actions.length === 2 ? 'flex-row' : ''}`}>
            {actions.map((action) => (
              <ActionButton
                key={action.label}
                label={action.label}
                variant={action.variant}
                onPress={action.onPress}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
