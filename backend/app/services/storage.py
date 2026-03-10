"""Storage backend abstraction — local filesystem or MinIO (S3-compatible).

When MINIO_ENDPOINT is configured the MinIO backend is used and images are
uploaded to an S3-compatible bucket. Otherwise the local filesystem backend
preserves existing behaviour (images saved under IMAGES_DIR, served via the
/images static mount).
"""
from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


# ── Abstract interface ────────────────────────────────────────────────────────


class StorageBackend(ABC):
    @abstractmethod
    def upload(self, filename: str, data: bytes, content_type: str = "image/png") -> str:
        """Upload *data* and return the public URL to embed in markdown."""

    @abstractmethod
    def exists(self, filename: str) -> bool:
        """Return True if *filename* already exists in storage."""


# ── Local filesystem backend ──────────────────────────────────────────────────


class LocalStorageBackend(StorageBackend):
    """Saves images to IMAGES_DIR and returns a relative /images/<filename> URL."""

    def __init__(self) -> None:
        self._dir = Path(settings.images_dir)
        self._dir.mkdir(parents=True, exist_ok=True)

    def upload(self, filename: str, data: bytes, content_type: str = "image/png") -> str:
        dest = self._dir / filename
        dest.write_bytes(data)
        logger.debug("Saved image to local filesystem: %s", dest)
        return f"/images/{filename}"

    def exists(self, filename: str) -> bool:
        return (self._dir / filename).exists()


# ── MinIO / S3 backend ────────────────────────────────────────────────────────


class MinIOStorageBackend(StorageBackend):
    """Uploads images to a MinIO bucket with public-read policy."""

    def __init__(self) -> None:
        import boto3  # lazy import — optional dependency

        scheme = "https" if settings.minio_secure else "http"
        self._client = boto3.client(
            "s3",
            endpoint_url=f"{scheme}://{settings.minio_endpoint}",
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            region_name="us-east-1",  # Required by boto3 even for MinIO
        )
        self._bucket = settings.minio_bucket
        self._public_url = (
            settings.minio_public_url or f"{scheme}://{settings.minio_endpoint}"
        )
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        from botocore.exceptions import ClientError  # lazy

        try:
            self._client.head_bucket(Bucket=self._bucket)
            logger.info("MinIO bucket '%s' already exists", self._bucket)
        except ClientError:
            logger.info("Creating MinIO bucket '%s'", self._bucket)
            self._client.create_bucket(Bucket=self._bucket)
            # Set anonymous read policy so images are publicly accessible
            policy = json.dumps(
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": ["*"]},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{self._bucket}/*"],
                        }
                    ],
                }
            )
            self._client.put_bucket_policy(Bucket=self._bucket, Policy=policy)

    def upload(self, filename: str, data: bytes, content_type: str = "image/png") -> str:
        self._client.put_object(
            Bucket=self._bucket,
            Key=filename,
            Body=data,
            ContentType=content_type,
        )
        url = f"{self._public_url}/{self._bucket}/{filename}"
        logger.debug("Uploaded image to MinIO: %s", url)
        return url

    def exists(self, filename: str) -> bool:
        from botocore.exceptions import ClientError

        try:
            self._client.head_object(Bucket=self._bucket, Key=filename)
            return True
        except ClientError:
            return False


# ── Singleton factory ─────────────────────────────────────────────────────────

_backend: StorageBackend | None = None


def init_storage() -> StorageBackend:
    """Called once during app lifespan to initialise and cache the backend."""
    global _backend
    if settings.minio_endpoint:
        try:
            _backend = MinIOStorageBackend()
            logger.info("Using MinIO storage backend at %s", settings.minio_endpoint)
        except Exception as exc:
            logger.warning(
                "MinIO init failed (%s) — falling back to local filesystem", exc
            )
            _backend = LocalStorageBackend()
    else:
        _backend = LocalStorageBackend()
        logger.info("Using local filesystem storage backend at %s", settings.images_dir)
    return _backend


def get_storage() -> StorageBackend:
    """Return the initialised storage backend (or a local fallback if not yet init'd)."""
    if _backend is None:
        return LocalStorageBackend()
    return _backend
