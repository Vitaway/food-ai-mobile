/** Max long edge for vision uploads — enough for plate detection, keeps payloads under nginx limits. */
const MAX_UPLOAD_EDGE = 1600;
const UPLOAD_JPEG_QUALITY = 0.82;

export type PreparedUploadImage = {
  uri: string;
  mimeType: string;
  name: string;
};

function fallbackImage(imageUri: string): PreparedUploadImage {
  const lower = imageUri.toLowerCase();
  const mimeType = lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  return { uri: imageUri, mimeType, name: `meal.${ext}` };
}

export async function prepareImageForUpload(imageUri: string): Promise<PreparedUploadImage> {
  try {
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    const saved = await manipulateAsync(
      imageUri,
      [{ resize: { width: MAX_UPLOAD_EDGE } }],
      { compress: UPLOAD_JPEG_QUALITY, format: SaveFormat.JPEG },
    );

    return {
      uri: saved.uri,
      mimeType: 'image/jpeg',
      name: 'meal.jpg',
    };
  } catch {
    return fallbackImage(imageUri);
  }
}
