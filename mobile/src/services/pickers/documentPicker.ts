import { requireOptionalNativeModule } from 'expo-modules-core';

export type PickedDocument = {
  uri: string;
  name: string;
  mimeType: string;
};

export function isDocumentPickerAvailable() {
  return Boolean(requireOptionalNativeModule('ExpoDocumentPicker'));
}

export async function pickDocument(): Promise<PickedDocument | null> {
  if (!isDocumentPickerAvailable()) return null;

  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/*',
    ],
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
  };
}
