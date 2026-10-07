import { Modal, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

import { ToastCard, type ToastItem } from '@/components/ui/ToastCard';

type ToastHostProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

function ToastStack({
  toasts,
  onDismiss,
  top,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  top: number;
}) {
  return (
    <View pointerEvents="box-none" style={[styles.host, { top, paddingHorizontal: 14 }]}>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

/**
 * Sit above Stack transparent modals (auth sheet).
 * iOS: FullWindowOverlay (touches pass through empty space).
 * Android: transparent Modal (native layer above everything).
 */
export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  const insets = useSafeAreaInsets();
  const top = insets.top + 8;

  if (toasts.length === 0) return null;

  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        <View pointerEvents="box-none" style={styles.flex}>
          <ToastStack toasts={toasts} onDismiss={onDismiss} top={top} />
        </View>
      </FullWindowOverlay>
    );
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={() => {
        if (toasts[0]) onDismiss(toasts[0].id);
      }}>
      <View pointerEvents="box-none" style={styles.flex}>
        <ToastStack toasts={toasts} onDismiss={onDismiss} top={top} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    elevation: 24,
    alignItems: 'stretch',
    gap: 10,
  },
});
