"""Build a rich, model-friendly context object from mobile capture metadata."""

from __future__ import annotations

from typing import Any


def _num(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return None
    return None


def _str(value: Any) -> str | None:
    return value if isinstance(value, str) and value.strip() else None


def build_analysis_context(metadata: dict[str, Any]) -> dict[str, Any]:
    """Flatten and enrich client metadata for the vision prompt."""
    camera = metadata.get("camera") if isinstance(metadata.get("camera"), dict) else {}
    device = metadata.get("device") if isinstance(metadata.get("device"), dict) else {}
    file_info = metadata.get("file") if isinstance(metadata.get("file"), dict) else {}
    hints = metadata.get("captureHints") if isinstance(metadata.get("captureHints"), dict) else {}
    refs = metadata.get("referenceSizesCm") if isinstance(metadata.get("referenceSizesCm"), dict) else {}

    width = _num(metadata.get("width")) or 0
    height = _num(metadata.get("height")) or 0
    focal_35 = _num(camera.get("focalLength35mmEquiv"))
    focal_mm = _num(camera.get("focalLengthMm"))

    # Typical smartphone main camera ≈ 24-28mm equiv; wide ≈ 13-16mm
    lens_class = "unknown"
    if focal_35 is not None:
        if focal_35 <= 18:
            lens_class = "ultra_wide"
        elif focal_35 <= 30:
            lens_class = "main_wide"
        elif focal_35 <= 50:
            lens_class = "standard"
        else:
            lens_class = "telephoto"

    return {
        "image": {
            "widthPx": width,
            "heightPx": height,
            "aspectRatio": _num(metadata.get("aspectRatio")),
            "megapixels": _num(metadata.get("megapixels")),
            "orientation": metadata.get("orientationLabel"),
            "captureSource": metadata.get("captureSource"),
            "platform": metadata.get("platform"),
        },
        "device": {
            "name": device.get("name"),
            "model": device.get("model"),
            "brand": device.get("brand"),
            "osVersion": device.get("osVersion"),
            "screenWidthPx": device.get("screenWidthPx"),
            "screenHeightPx": device.get("screenHeightPx"),
            "screenScale": device.get("screenScale"),
        },
        "cameraExif": {
            "focalLengthMm": focal_mm,
            "focalLength35mmEquivalent": focal_35,
            "lensClass": lens_class,
            "apertureFNumber": _num(camera.get("apertureFNumber")),
            "exposureTimeSec": _num(camera.get("exposureTimeSec")),
            "iso": _num(camera.get("iso")),
            "orientationExif": _num(camera.get("orientation")),
            "lensModel": camera.get("lensModel"),
            "lensMake": camera.get("lensMake"),
            "pixelWidthExif": _num(camera.get("pixelWidth")),
            "pixelHeightExif": _num(camera.get("pixelHeight")),
            "whiteBalance": camera.get("whiteBalance"),
            "flash": camera.get("flash"),
            "dateTimeOriginal": camera.get("dateTimeOriginal"),
        },
        "file": {
            "name": file_info.get("name"),
            "sizeBytes": file_info.get("sizeBytes"),
            "mimeType": file_info.get("mimeType"),
        },
        "captureHints": hints,
        "referenceSizesCm": refs,
        "estimationGuidance": {
            "optimalDistanceCmRange": [30, 40],
            "closeUpDistanceCmRange": [18, 28],
            "physicsNote": "For a fixed plate size, apparent width fraction × camera distance ≈ constant. Closer = larger fraction + shorter distance.",
            "doNotRoundDiameter": True,
            "measureOuterRimNotFoodArea": True,
            "topDownShotsAreMostAccurate": True,
            "avoidExtremeCloseUp": "Within 20 cm causes large errors — hold phone at arm's length",
        },
    }
