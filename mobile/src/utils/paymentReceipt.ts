import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

import { getApiV1Url } from '@/constants/api';
import { getApiAuthToken } from '@/lib/apiClient';

type ExpoSharingModule = typeof import('expo-sharing');

function tryGetSharing(): ExpoSharingModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-sharing') as ExpoSharingModule;
  } catch {
    return null;
  }
}

/** Download a payment receipt PDF and open the system share sheet. */
export async function downloadPaymentReceiptPdf(
  paymentId: string,
  opts?: { invoiceNumber?: string | null },
): Promise<void> {
  const token = getApiAuthToken();
  if (!token) throw new Error('Sign in again to download your receipt');

  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) throw new Error('Could not save receipt on this device');

  const safeName = (opts?.invoiceNumber || paymentId).replace(/[^\w.-]+/g, '_').slice(0, 40);
  const path = `${dir}mirafood-receipt-${safeName}.pdf`;
  const url = getApiV1Url(`/consumer/payments/${encodeURIComponent(paymentId)}/receipt`);

  const result = await FileSystem.downloadAsync(url, path, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error('Could not download receipt');
  }

  const Sharing = tryGetSharing();
  if (Sharing) {
    const canShare = await Sharing.isAvailableAsync().catch(() => false);
    if (canShare) {
      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download invoice',
        UTI: 'com.adobe.pdf',
      });
      return;
    }
  }

  await Share.share({
    url: Platform.OS === 'ios' ? result.uri : result.uri,
    title: 'Download invoice',
    message: 'MiraFood payment receipt',
  });
}
