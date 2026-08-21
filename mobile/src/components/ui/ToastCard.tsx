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
import { palette } from '@/design-system/colors';

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
  if (toast.variant === 'banner') {
    return <IncomingBanner toast={toast} onDismiss={onDismiss} />;
  }

  const visual = TOAST_VISUALS[toast.type];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(220)}
      exiting={FadeOutUp.duration(180)}
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

function IncomingBanner({ toast, onDismiss }: ToastCardProps) {
  const visual = TOAST_VISUALS[toast.type];

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20).stiffness(240)}
      exiting={SlideOutUp.duration(200)}
      layout={LinearTransition.springify()}
      style={bannerStyles.wrap}>
      <View style={bannerStyles.card}>
        <Pressable
          onPress={() => {
            onDismiss(toast.id);
            toast.onPress?.();
          }}
          style={bannerStyles.main}
          accessibilityRole="button"
          accessibilityLabel={`${toast.title ?? 'Notification'}. ${toast.message}`}>
          <View style={[bannerStyles.iconWrap, { backgroundColor: `${visual.accent}18` }]}>
            <Ionicons name="notifications" size={20} color={visual.accent} />
          </View>
          <View style={bannerStyles.copy}>
            <Animated.Text style={bannerStyles.appLabel}>MiraFood</Animated.Text>
            <Animated.Text style={bannerStyles.title} numberOfLines={1}>
              {toast.title ?? 'Notification'}
            </Animated.Text>
            <Animated.Text style={bannerStyles.message} numberOfLines={2}>
              {toast.message}
            </Animated.Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={12}
          onPress={() => onDismiss(toast.id)}
          style={bannerStyles.close}>
          <Ionicons name="close" size={18} color={palette['ash-grey'][400]} />
        </Pressable>
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

const bannerStyles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 22,
    backgroundColor: '#ffffff',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: palette['ash-grey'][100],
    shadowColor: palette['blue-spruce'][900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  iconWrap: {
    height: 40,
    width: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingTop: 1,
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
  title: {
    fontFamily: fonts.sansExtraBold,
    fontSize: 15,
    lineHeight: 20,
    color: palette['blue-spruce'][900],
  },
  message: {
    marginTop: 3,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: palette['ash-grey'][600],
  },
  close: {
    marginTop: 2,
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
