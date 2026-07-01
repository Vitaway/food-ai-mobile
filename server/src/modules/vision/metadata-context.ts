function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function buildAnalysisContext(metadata: Record<string, unknown>): Record<string, unknown> {
  const camera =
    metadata.camera && typeof metadata.camera === "object"
      ? (metadata.camera as Record<string, unknown>)
      : {};
  const device =
    metadata.device && typeof metadata.device === "object"
      ? (metadata.device as Record<string, unknown>)
      : {};
  const fileInfo =
    metadata.file && typeof metadata.file === "object"
      ? (metadata.file as Record<string, unknown>)
      : {};
  const hints =
    metadata.captureHints && typeof metadata.captureHints === "object"
      ? (metadata.captureHints as Record<string, unknown>)
      : {};
  const refs =
    metadata.referenceSizesCm && typeof metadata.referenceSizesCm === "object"
      ? (metadata.referenceSizesCm as Record<string, unknown>)
      : {};

  const width = num(metadata.width) ?? 0;
  const height = num(metadata.height) ?? 0;
  const focal35 = num(camera.focalLength35mmEquiv);
  const focalMm = num(camera.focalLengthMm);

  let lensClass = "unknown";
  if (focal35 != null) {
    if (focal35 <= 18) lensClass = "ultra_wide";
    else if (focal35 <= 30) lensClass = "main_wide";
    else if (focal35 <= 50) lensClass = "standard";
    else lensClass = "telephoto";
  }

  return {
    image: {
      widthPx: width,
      heightPx: height,
      aspectRatio: num(metadata.aspectRatio),
      megapixels: num(metadata.megapixels),
      orientation: metadata.orientationLabel,
      captureSource: metadata.captureSource,
      platform: metadata.platform,
    },
    device: {
      name: device.name,
      model: device.model,
      brand: device.brand,
      osVersion: device.osVersion,
      screenWidthPx: device.screenWidthPx,
      screenHeightPx: device.screenHeightPx,
      screenScale: device.screenScale,
    },
    cameraExif: {
      focalLengthMm: focalMm,
      focalLength35mmEquivalent: focal35,
      lensClass,
      apertureFNumber: num(camera.apertureFNumber),
      exposureTimeSec: num(camera.exposureTimeSec),
      iso: num(camera.iso),
      orientationExif: num(camera.orientation),
      lensModel: camera.lensModel,
      lensMake: camera.lensMake,
      pixelWidthExif: num(camera.pixelWidth),
      pixelHeightExif: num(camera.pixelHeight),
      whiteBalance: camera.whiteBalance,
      flash: camera.flash,
      dateTimeOriginal: camera.dateTimeOriginal,
    },
    file: {
      name: fileInfo.name,
      sizeBytes: fileInfo.sizeBytes,
      mimeType: fileInfo.mimeType,
    },
    captureHints: hints,
    referenceSizesCm: refs,
    estimationGuidance: {
      optimalDistanceCmRange: [30, 40],
      closeUpDistanceCmRange: [18, 28],
      physicsNote:
        "For a fixed plate size, apparent width fraction × camera distance ≈ constant. Closer = larger fraction + shorter distance.",
      doNotRoundDiameter: true,
      measureOuterRimNotFoodArea: true,
      topDownShotsAreMostAccurate: true,
      avoidExtremeCloseUp:
        "Within 20 cm causes large errors — hold phone at arm's length",
    },
  };
}
