import { Share } from 'react-native';

/** Copy text when the native clipboard module is available; otherwise open the share sheet. */
export async function copyToClipboard(text: string): Promise<'copied' | 'shared' | 'cancelled'> {
  try {
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return 'copied';
  } catch {
    try {
      const result = await Share.share({ message: text });
      if (result.action === Share.dismissedAction) return 'cancelled';
      return 'shared';
    } catch {
      return 'cancelled';
    }
  }
}
