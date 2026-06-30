"""
Minimal plate/bowl detection API for MiraFood (via OpenRouter).

Run:
  cd backend
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  cp .env.example .env   # add your OPENROUTER_API_KEY
  python server.py
"""

from __future__ import annotations

import base64
import json
import os
import re
from typing import Any

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from openai import OpenAI

from diameter_math import resolve_diameter_cm, resolve_effective_distance_cm
from metadata_context import build_analysis_context
from prompts import SYSTEM_PROMPT, USER_PROMPT

load_dotenv()

app = Flask(__name__)
CORS(app)


def _sanitize_env(value: str) -> str:
    """Strip whitespace and quotes — systemd EnvironmentFile can leave quotes in values."""
    return value.strip().strip('"').strip("'")


def _api_key_status(key: str) -> str:
    if not key:
        return "missing"
    if "your-key" in key.lower() or key.endswith("..."):
        return "placeholder"
    if not key.startswith("sk-or-"):
        return "invalid_format"
    return "configured"


OPENROUTER_API_KEY = _sanitize_env(os.getenv("OPENROUTER_API_KEY", ""))
OPENROUTER_BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_APP_NAME = os.getenv("OPENROUTER_APP_NAME", "MiraFood")
OPENROUTER_SITE_URL = os.getenv("OPENROUTER_SITE_URL", "https://vitaway.nsengi.space")
OPENROUTER_IMAGE_DETAIL = os.getenv("OPENROUTER_IMAGE_DETAIL", "high")
OPENROUTER_TEMPERATURE = float(os.getenv("OPENROUTER_TEMPERATURE", "0.05"))
PORT = int(os.getenv("PORT", "5050"))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "false").lower() in ("1", "true", "yes")


def openrouter_client() -> OpenAI:
    return OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
    )


def openrouter_auth_error_message(exc: Exception) -> str | None:
    text = str(exc)
    if "401" not in text and "User not found" not in text:
        return None
    return (
        "OpenRouter rejected the server API key. On the VPS, set a regular inference key "
        "(not a provisioning/management key) in /opt/vitaway-api/.env as OPENROUTER_API_KEY, "
        "then run: sudo systemctl restart vitaway-api"
    )


def parse_json_response(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def normalize_result(raw: dict[str, Any], analysis_context: dict[str, Any]) -> dict[str, Any]:
    detected = bool(raw.get("detected"))
    container = raw.get("containerType")
    if container not in ("plate", "bowl"):
        container = None

    fraction = raw.get("plateDiameterFractionOfImageWidth")
    camera_exif = analysis_context.get("cameraExif", {})
    focal_35 = camera_exif.get("focalLength35mmEquivalent")
    model_distance = raw.get("estimatedCameraDistanceCm")

    diameter_cm = resolve_diameter_cm(raw, analysis_context) if detected else None
    if not detected or diameter_cm is None or diameter_cm <= 0:
        detected = False
        container = None
        diameter_cm = None

    confidence = raw.get("confidence")
    if isinstance(confidence, (int, float)):
        confidence_val = max(0.0, min(1.0, float(confidence)))
    else:
        confidence_val = None

    message = raw.get("message")
    if not isinstance(message, str):
        if detected and container and diameter_cm:
            label = "Bowl" if container == "bowl" else "Plate"
            message = f"{label} detected — {diameter_cm} cm"
        else:
            message = "No plate or bowl detected"

    result: dict[str, Any] = {
        "detected": detected,
        "containerType": container,
        "diameterCm": diameter_cm,
        "confidence": confidence_val,
        "message": message,
        "diameterSource": "computed" if detected else None,
    }

    if detected and isinstance(fraction, (int, float)):
        result["effectiveDistanceCm"] = resolve_effective_distance_cm(
            float(fraction),
            float(focal_35) if isinstance(focal_35, (int, float)) else None,
            float(model_distance) if isinstance(model_distance, (int, float)) else None,
        )

    for optional_key in (
        "shotAngle",
        "plateDiameterFractionOfImageWidth",
        "estimatedCameraDistanceCm",
        "matchedReference",
        "estimationNotes",
    ):
        if optional_key in raw and raw[optional_key] is not None:
            result[optional_key] = raw[optional_key]

    return result


@app.get("/health")
def health():
    key_status = _api_key_status(OPENROUTER_API_KEY)
    return jsonify({
        "ok": key_status == "configured",
        "provider": "openrouter",
        "model": OPENROUTER_MODEL,
        "imageDetail": OPENROUTER_IMAGE_DETAIL,
        "temperature": OPENROUTER_TEMPERATURE,
        "apiKeyStatus": key_status,
    })


@app.post("/plates/detect")
def detect_plate():
    key_status = _api_key_status(OPENROUTER_API_KEY)
    if key_status == "missing":
        return jsonify({"error": "OPENROUTER_API_KEY is not set on the server"}), 500
    if key_status != "configured":
        return jsonify({
            "error": (
                "OPENROUTER_API_KEY on the server is missing or invalid. "
                "Create a regular API key at https://openrouter.ai/keys and update /opt/vitaway-api/.env"
            ),
        }), 500

    image = request.files.get("image")
    if image is None:
        return jsonify({"error": "Missing image file (field name: image)"}), 400

    metadata_raw = request.form.get("metadata", "{}")
    try:
        metadata = json.loads(metadata_raw)
    except json.JSONDecodeError:
        return jsonify({"error": "metadata must be valid JSON"}), 400

    image_bytes = image.read()
    if not image_bytes:
        return jsonify({"error": "Empty image file"}), 400

    mime = image.mimetype or "image/jpeg"
    if not mime.startswith("image/"):
        mime = "image/jpeg"

    b64 = base64.b64encode(image_bytes).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"

    analysis_context = build_analysis_context(metadata)
    client = openrouter_client()

    try:
        response = client.chat.completions.create(
            model=OPENROUTER_MODEL,
            temperature=OPENROUTER_TEMPERATURE,
            response_format={"type": "json_object"},
            extra_headers={
                "HTTP-Referer": OPENROUTER_SITE_URL,
                "X-Title": OPENROUTER_APP_NAME,
            },
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": USER_PROMPT.format(
                                context=json.dumps(analysis_context, indent=2, default=str)
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": data_url,
                                "detail": OPENROUTER_IMAGE_DETAIL,
                            },
                        },
                    ],
                },
            ],
        )
    except Exception as exc:  # noqa: BLE001 — return API error to client
        auth_error = openrouter_auth_error_message(exc)
        if auth_error:
            return jsonify({"error": auth_error}), 502
        return jsonify({"error": f"OpenRouter request failed: {exc}"}), 502

    content = response.choices[0].message.content or "{}"
    try:
        raw = parse_json_response(content)
        result = normalize_result(raw, analysis_context)
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        return jsonify({"error": f"Could not parse model response: {exc}", "raw": content}), 502

    return jsonify(result)


if __name__ == "__main__":
    print(
        f"MiraFood plate API on http://0.0.0.0:{PORT} "
        f"(openrouter model={OPENROUTER_MODEL}, detail={OPENROUTER_IMAGE_DETAIL})"
    )
    app.run(host="0.0.0.0", port=PORT, debug=FLASK_DEBUG)
