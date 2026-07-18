import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ToastCard, type ToastItem } from '@/components/ui/ToastCard';

type ToastHostProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { top: insets.top + 8, paddingHorizontal: 12 }]}>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'stretch',
    gap: 10,
  },
});
