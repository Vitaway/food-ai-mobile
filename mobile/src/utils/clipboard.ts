import { requireOptionalNativeModule } from 'expo-modules-core';
import { Share } from 'react-native';

type ClipboardNative = {
  setStringAsync: (text: string) => Promise<void>;
};

const clipboardNative = requireOptionalNativeModule<ClipboardNative>('ExpoClipboard');

/** Copy text when the native clipboard module is available; otherwise open the share sheet. */
export async function copyToClipboard(text: string): Promise<'copied' | 'shared' | 'cancelled'> {
  if (clipboardNative?.setStringAsync) {
    try {
      await clipboardNative.setStringAsync(text);
      return 'copied';
    } catch {
      /* fall through to share */
    }
  }

  try {
    const result = await Share.share({ message: text });
    if (result.action === Share.dismissedAction) return 'cancelled';
    return 'shared';
  } catch {
    return 'cancelled';
  }
}
