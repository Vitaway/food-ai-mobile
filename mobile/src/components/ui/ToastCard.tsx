import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutRight, LinearTransition } from 'react-native-reanimated';

import { fonts } from '@/constants/fonts';
import { palette } from '@/design-system/colors';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
};

export const TOAST_VISUALS: Record<
  ToastType,
  { icon: keyof typeof Ionicons.glyphMap; accent: string; label: string }
> = {
  success: {
    icon: 'checkmark-circle',
    accent: palette.shamrock[600],
    label: 'Success',
  },
  error: {
    icon: 'alert-circle',
    accent: palette['cinnamon-wood'][600],
    label: 'Error',
  },
  info: {
    icon: 'information-circle',
    accent: palette['blue-spruce'][600],
    label: 'Info',
  },
};

type ToastCardProps = {
  toast: ToastItem;
  onDismiss: (id: string) => void;
};

export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const visual = TOAST_VISUALS[toast.type];

  return (
    <Animated.View
      entering={FadeInRight.springify().damping(18).stiffness(220)}
      exiting={FadeOutRight.duration(180)}
      layout={LinearTransition.springify()}
      style={styles.shadowWrap}>
      <View style={styles.shadow} />
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: visual.accent }]} />
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <Ionicons name={visual.icon} size={18} color={visual.accent} />
              <Animated.Text style={styles.title}>{toast.title ?? visual.label}</Animated.Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              hitSlop={10}
              onPress={() => onDismiss(toast.id)}
              style={styles.closeButton}>
              <Ionicons name="close" size={16} color={palette['ash-grey'][500]} />
            </Pressable>
          </View>
          <Animated.Text style={styles.message}>{toast.message}</Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
}

const SHADOW_OFFSET = 4;
const INK = palette['blue-spruce'][900];

const styles = StyleSheet.create({
  shadowWrap: {
    position: 'relative',
    paddingRight: SHADOW_OFFSET,
    paddingBottom: SHADOW_OFFSET,
  },
  shadow: {
    position: 'absolute',
    top: SHADOW_OFFSET,
    left: SHADOW_OFFSET,
    right: 0,
    bottom: 0,
    backgroundColor: INK,
    borderRadius: 2,
  },
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    width: '100%',
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: palette['ash-grey'][900],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  closeButton: {
    marginTop: 1,
  },
  message: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: palette['ash-grey'][600],
  },
});
