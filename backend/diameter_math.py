"""Deterministic diameter from vision outputs + camera metadata."""

from __future__ import annotations

import os
from typing import Any

# Outer-rim typical diameters (cm)
REFERENCE_TYPICAL_CM: dict[str, float] = {
    "sidePlate": 19.0,
    "dinnerPlate": 26.0,
    "largePlate": 29.0,
    "soupBowl": 16.0,
    "cerealBowl": 18.0,
    "servingBowl": 24.0,
}

# Calibration anchor: reference dinner plate framing
BASE_REFERENCE_CM = 26.0
BASE_DISTANCE_CM = 35.0
BASE_FRACTION_OF_WIDTH = 0.62
CONST_FRAMING = BASE_FRACTION_OF_WIDTH * BASE_DISTANCE_CM  # f * D at calibration

# K converts (fraction × distance) → cm: W = K × f × D
K_FRAMING_TO_CM = BASE_REFERENCE_CM / CONST_FRAMING

# How much to trust geometry-implied distance vs model/default (higher = better close-up stability)
GEOMETRY_DISTANCE_WEIGHT = float(os.getenv("PLATE_GEOMETRY_DISTANCE_WEIGHT", "0.72"))


def _num(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def estimate_camera_distance_cm(
    focal_35mm: float | None,
    model_distance: float | None,
) -> float:
    if model_distance is not None and 20 <= model_distance <= 60:
        return model_distance

    if focal_35mm is None:
        return BASE_DISTANCE_CM
    if focal_35mm <= 18:
        return 30.0
    if focal_35mm <= 30:
        return 35.0
    return 42.0


def distance_from_framing(fraction: float) -> float:
    """
    If the plate were the calibration size, this is the implied camera distance.

    Closer photo → larger fraction → shorter implied distance.
    Physics: for fixed plate size, f × D ≈ constant.
    """
    fraction = max(fraction, 0.12)
    return _clamp(CONST_FRAMING / fraction, 18.0, 55.0)


def resolve_effective_distance_cm(
    fraction: float,
    focal_35mm: float | None,
    model_distance: float | None,
) -> float:
    d_model = estimate_camera_distance_cm(focal_35mm, model_distance)
    d_framing = distance_from_framing(fraction)

    # Blend: geometry stabilizes close-ups where the model often keeps distance too high
    weight = _clamp(GEOMETRY_DISTANCE_WEIGHT, 0.0, 1.0)
    return d_model * (1.0 - weight) + d_framing * weight


def angle_correction_factor(shot_angle: str | None) -> float:
    if shot_angle == "top_down":
        return 1.0
    if shot_angle == "moderate":
        return 1.03
    if shot_angle == "steep":
        return 1.07
    return 1.02


def diameter_from_fraction(
    fraction: float,
    distance_cm: float,
    shot_angle: str | None,
) -> float:
    """
    Real plate width scales with apparent size × distance.

    W ∝ f × D  (not f / D — dividing by D was the close-up bug)
    """
    fraction = _clamp(fraction, 0.12, 0.96)
    distance_cm = _clamp(distance_cm, 18.0, 55.0)

    return K_FRAMING_TO_CM * fraction * distance_cm * angle_correction_factor(shot_angle)


def scale_for_reference_class(
    computed_cm: float,
    matched_reference: str | None,
    container_type: str | None,
) -> float:
    """Nudge toward matched dish class without overriding geometry."""
    ref_key = matched_reference
    if ref_key not in REFERENCE_TYPICAL_CM:
        if container_type == "bowl":
            ref_key = "cerealBowl"
        elif container_type == "plate":
            ref_key = "dinnerPlate"
        else:
            return computed_cm

    typical = REFERENCE_TYPICAL_CM[ref_key]
    # Light prior — geometry does the heavy lifting
    return computed_cm * 0.88 + typical * 0.12


def resolve_diameter_cm(
    raw: dict[str, Any],
    analysis_context: dict[str, Any],
) -> float | None:
    fraction = _num(raw.get("plateDiameterFractionOfImageWidth"))
    if fraction is None:
        model_d = _num(raw.get("diameterCm"))
        return model_d if model_d and model_d > 0 else None

    camera_exif = analysis_context.get("cameraExif", {})
    focal_35 = _num(camera_exif.get("focalLength35mmEquivalent"))
    model_distance = _num(raw.get("estimatedCameraDistanceCm"))

    distance_cm = resolve_effective_distance_cm(fraction, focal_35, model_distance)
    shot_angle = raw.get("shotAngle") if isinstance(raw.get("shotAngle"), str) else None

    computed = diameter_from_fraction(fraction, distance_cm, shot_angle)

    matched = raw.get("matchedReference")
    ref_key = matched if isinstance(matched, str) else None
    container = raw.get("containerType") if isinstance(raw.get("containerType"), str) else None

    return scale_for_reference_class(computed, ref_key, container)
