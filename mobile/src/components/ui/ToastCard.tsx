import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';

import { fonts } from '@/constants/fonts';
import { palette, semanticColors } from '@/design-system/colors';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  /** Polished top banner for live notifications while the app is open. */
  variant?: 'toast' | 'banner';
  onPress?: () => void;
};

export const TOAST_VISUALS: Record<
  ToastType,
  { icon: keyof typeof Ionicons.glyphMap; accent: string; soft: string; label: string }
> = {
  success: {
    icon: 'checkmark-circle',
    accent: palette.shamrock[600],
    soft: palette.shamrock[50],
    label: 'Success',
  },
  error: {
    icon: 'alert-circle',
    accent: palette['cinnamon-wood'][600],
    soft: palette['cinnamon-wood'][50],
    label: 'Error',
  },
  info: {
    icon: 'information-circle',
    accent: semanticColors.primary,
    soft: palette['blue-spruce'][50],
    label: 'Info',
  },
};

type ToastCardProps = {
  toast: ToastItem;
  onDismiss: (id: string) => void;
};

export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  if (toast.variant === 'banner') {
    return <IncomingBanner toast={toast} onDismiss={onDismiss} />;
  }

  const visual = TOAST_VISUALS[toast.type];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(220)}
      exiting={FadeOutUp.duration(180)}
      layout={LinearTransition.springify()}
      style={styles.wrap}>
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: visual.soft }]}>
          <Ionicons name={visual.icon} size={20} color={visual.accent} />
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Animated.Text style={styles.title} numberOfLines={1}>
              {toast.title ?? visual.label}
            </Animated.Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              hitSlop={10}
              onPress={() => onDismiss(toast.id)}
              style={styles.closeButton}>
              <Ionicons name="close" size={18} color={palette['ash-grey'][400]} />
            </Pressable>
          </View>
          <Animated.Text style={styles.message}>{toast.message}</Animated.Text>
        </View>
      </View>
    </Animated.View>
  );
}

function IncomingBanner({ toast, onDismiss }: ToastCardProps) {
  const visual = TOAST_VISUALS[toast.type];

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20).stiffness(240)}
      exiting={SlideOutUp.duration(200)}
      layout={LinearTransition.springify()}
      style={styles.wrap}>
      <View style={styles.card}>
        <Pressable
          onPress={() => {
            onDismiss(toast.id);
            toast.onPress?.();
          }}
          style={bannerStyles.main}
          accessibilityRole="button"
          accessibilityLabel={`${toast.title ?? 'Notification'}. ${toast.message}`}>
          <View style={[styles.iconWrap, { backgroundColor: visual.soft }]}>
            <Ionicons name="notifications" size={20} color={visual.accent} />
          </View>
          <View style={styles.content}>
            <Animated.Text style={bannerStyles.appLabel}>MiraFood</Animated.Text>
            <Animated.Text style={styles.title} numberOfLines={1}>
              {toast.title ?? 'Notification'}
            </Animated.Text>
            <Animated.Text style={styles.message} numberOfLines={2}>
              {toast.message}
            </Animated.Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={12}
          onPress={() => onDismiss(toast.id)}
          style={styles.closeButton}>
          <Ionicons name="close" size={18} color={palette['ash-grey'][400]} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette['ash-grey'][200],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrap: {
    height: 40,
    width: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
    paddingTop: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: 15,
    lineHeight: 20,
    color: semanticColors.primary,
  },
  closeButton: {
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginRight: -4,
  },
  message: {
    marginTop: 3,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: palette['ash-grey'][600],
  },
});

const bannerStyles = StyleSheet.create({
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  appLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: palette['ash-grey'][400],
    marginBottom: 2,
  },
});
