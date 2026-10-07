import { Modal, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { semanticColors } from '@/design-system/colors';

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
      className={`min-h-12 flex-1 items-center justify-center rounded-xl px-3 active:opacity-85 ${
        isDanger
          ? 'bg-red-600'
          : isPrimary
            ? 'bg-blue-spruce-600'
            : 'border border-black bg-white'
      }`}>
      <Text
        className={`text-center font-sans-semibold text-[15px] ${
          isDanger || isPrimary ? 'text-white' : 'text-black'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Soft rounded dialog — matches mint/forest UI; Modal sits above auth sheet. */
export function AppDialog({ visible, title, message, actions, onRequestClose }: AppDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onRequestClose}>
      <View className="flex-1 items-center justify-center px-7" style={{ backgroundColor: 'rgba(26,58,42,0.45)' }}>
        <Pressable className="absolute inset-0" onPress={onRequestClose} />
        <View
          className="w-full max-w-[340px] rounded-[24px] bg-white px-5 pb-5 pt-6"
          style={{
            borderWidth: 1,
            borderColor: '#d0e29c',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.18,
            shadowRadius: 28,
            elevation: 16,
          }}>
          <Text className="text-center font-sans-bold text-xl" style={{ color: semanticColors.primary }}>
            {title}
          </Text>
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
