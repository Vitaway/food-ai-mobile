import Constants from 'expo-constants';
import type * as ImagePicker from 'expo-image-picker';
import { Dimensions, Platform } from 'react-native';

/** Standard dish sizes (outer rim, cm) — sent to vision model as calibration anchors. */
export const DISH_REFERENCE_SIZES_CM = {
  sidePlate: { min: 17, max: 20, typical: 19 },
  dinnerPlate: { min: 25, max: 27, typical: 26 },
  largePlate: { min: 28, max: 30, typical: 29 },
  soupBowl: { min: 14, max: 18, typical: 16 },
  cerealBowl: { min: 16, max: 20, typical: 18 },
  servingBowl: { min: 22, max: 28, typical: 24 },
} as const;

export type ParsedCameraExif = {
  focalLengthMm: number | null;
  focalLength35mmEquiv: number | null;
  apertureFNumber: number | null;
  exposureTimeSec: number | null;
  iso: number | null;
  orientation: number | null;
  lensModel: string | null;
  lensMake: string | null;
  pixelWidth: number | null;
  pixelHeight: number | null;
  colorSpace: string | null;
  whiteBalance: string | null;
  flash: string | null;
  dateTimeOriginal: string | null;
  raw: Record<string, unknown>;
};

export type ImageCaptureMetadata = {
  width: number;
  height: number;
  aspectRatio: number;
  megapixels: number;
  orientationLabel: 'portrait' | 'landscape' | 'square';
  captureSource: 'camera' | 'gallery';
  platform: string;
  device: {
    name: string | null;
    model: string | null;
    brand: string | null;
    osVersion: string | null;
    screenWidthPx: number;
    screenHeightPx: number;
    screenScale: number;
  };
  file: {
    name: string | null;
    sizeBytes: number | null;
    mimeType: string | null;
  };
  camera: ParsedCameraExif;
  captureHints: {
    optimalDistanceCm: string;
    closeUpWarning: string;
    typicalPhoneFoodPhotoDistanceCm: string;
    preferredShot: string;
    measurementTarget: string;
    framingPhysics: string;
  };
  referenceSizesCm: typeof DISH_REFERENCE_SIZES_CM;
  exif: Record<string, unknown> | null;
};

export type CapturedImage = {
  uri: string;
  metadata: ImageCaptureMetadata;
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function firstNumber(exif: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = toNumber(exif[key]);
    if (value != null) return value;
  }
  return null;
}

function firstString(exif: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = toString(exif[key]);
    if (value != null) return value;
  }
  return null;
}

export function parseCameraExif(exif: Record<string, unknown> | null | undefined): ParsedCameraExif {
  const raw = exif ?? {};

  return {
    focalLengthMm: firstNumber(raw, ['FocalLength', 'focalLength', 'FocalLengthIn35mmFilm']),
    focalLength35mmEquiv: firstNumber(raw, [
      'FocalLenIn35mmFilm',
      'FocalLengthIn35mmFilm',
      'FocalLengthIn35mmFormat',
      'focalLengthIn35mmFormat',
    ]),
    apertureFNumber: firstNumber(raw, ['FNumber', 'ApertureValue', 'fNumber']),
    exposureTimeSec: firstNumber(raw, ['ExposureTime', 'ShutterSpeedValue', 'exposureTime']),
    iso: firstNumber(raw, ['ISOSpeedRatings', 'ISO', 'PhotographicSensitivity', 'iso']),
    orientation: firstNumber(raw, ['Orientation', 'orientation']),
    lensModel: firstString(raw, ['LensModel', 'LensSpecification', 'lensModel']),
    lensMake: firstString(raw, ['LensMake', 'lensMake']),
    pixelWidth: firstNumber(raw, ['PixelXDimension', 'ImageWidth', 'ExifImageWidth']),
    pixelHeight: firstNumber(raw, ['PixelYDimension', 'ImageLength', 'ExifImageHeight']),
    colorSpace: firstString(raw, ['ColorSpace', 'colorSpace']),
    whiteBalance: firstString(raw, ['WhiteBalance', 'whiteBalance']),
    flash: firstString(raw, ['Flash', 'flash']),
    dateTimeOriginal: firstString(raw, ['DateTimeOriginal', 'DateTime', 'dateTimeOriginal']),
    raw,
  };
}

function orientationLabel(width: number, height: number): ImageCaptureMetadata['orientationLabel'] {
  if (width === height) return 'square';
  return width > height ? 'landscape' : 'portrait';
}

export function buildImageCaptureMetadata(
  asset: ImagePicker.ImagePickerAsset,
  captureSource: 'camera' | 'gallery',
): ImageCaptureMetadata {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  const aspectRatio = height > 0 ? Number((width / height).toFixed(4)) : 0;
  const megapixels = Number(((width * height) / 1_000_000).toFixed(2));
  const screen = Dimensions.get('window');
  const exif = (asset.exif as Record<string, unknown> | undefined) ?? null;

  return {
    width,
    height,
    aspectRatio,
    megapixels,
    orientationLabel: orientationLabel(width, height),
    captureSource,
    platform: Platform.OS,
    device: {
      name: Constants.deviceName ?? null,
      model: Constants.platform?.ios?.model ?? null,
      brand: Platform.OS === 'ios' ? 'Apple' : (Constants.brand ?? null),
      osVersion:
        Platform.OS === 'ios'
          ? String(Constants.platform?.ios?.systemVersion ?? '')
          : String(Constants.platform?.android?.versionRelease ?? ''),
      screenWidthPx: Math.round(screen.width),
      screenHeightPx: Math.round(screen.height),
      screenScale: Dimensions.get('screen').scale ?? 1,
    },
    file: {
      name: asset.fileName ?? null,
      sizeBytes: asset.fileSize ?? null,
      mimeType: asset.mimeType ?? 'image/jpeg',
    },
    camera: parseCameraExif(exif),
    captureHints: {
      optimalDistanceCm: '30-40',
      closeUpWarning:
        'Photos taken closer than ~25 cm make the plate look larger and cause size over-estimates.',
      typicalPhoneFoodPhotoDistanceCm:
        'Most users hold the phone 30-40 cm above the table when photographing meals.',
      preferredShot:
        'Top-down (bird\'s eye) at arm\'s length with the full outer rim visible.',
      measurementTarget:
        'Measure the outer visible rim diameter, not the food area inside.',
      framingPhysics:
        'For a fixed plate, larger rim fraction in frame means the camera is closer (shorter distance).',
    },
    referenceSizesCm: DISH_REFERENCE_SIZES_CM,
    exif,
  };
}
