import { Platform, Vibration } from 'react-native';

let lastPlayedAt = 0;

/** Soft alert for incoming live events (native sound needs a rebuild; haptic is always available). */
export function playIncomingNotificationSound() {
  const now = Date.now();
  if (now - lastPlayedAt < 400) return;
  lastPlayedAt = now;

  try {
    if (Platform.OS === 'web' && typeof Audio !== 'undefined') {
      const audio = new Audio('/sounds/notification.wav');
      audio.volume = 0.55;
      void audio.play().catch(() => undefined);
      return;
    }

    if (Platform.OS === 'android') {
      Vibration.vibrate([0, 35, 40, 35]);
    } else {
      Vibration.vibrate(40);
    }
  } catch {
    /* ignore */
  }
}
