"""Gemini-powered image generation service."""
from __future__ import annotations

from app.core.config import settings


class GeminiImageService:
    """Wraps the Google Gemini image generation API."""

    def __init__(self) -> None:
        if not settings.google_api_key:
            raise RuntimeError(
                "GOOGLE_API_KEY is not set. "
                "Set it in your .env file to enable image generation."
            )

    def generate(self, prompt: str) -> bytes:
        """Generate an image from *prompt* and return raw PNG/JPEG bytes."""
        from google import genai  # lazy import – optional dependency
        from google.genai import types

        client = genai.Client(api_key=settings.google_api_key)

        resp = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                safety_settings=[
                    types.SafetySetting(
                        category="HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold="BLOCK_ONLY_HIGH",
                    )
                ],
            ),
        )

        # Normalise across SDK versions
        parts = getattr(resp, "parts", None)
        if not parts and getattr(resp, "candidates", None):
            try:
                parts = resp.candidates[0].content.parts
            except Exception:
                parts = None

        if not parts:
            raise RuntimeError("No image content returned by Gemini (safety/quota/SDK issue).")

        for part in parts:
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                return inline.data  # type: ignore[return-value]

        raise RuntimeError("No inline image bytes found in Gemini response.")
