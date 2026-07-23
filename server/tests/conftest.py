"""Shared fixtures for server API tests."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from utils.loaders import load_uuid2caption, load_uuid2embedding


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    """TestClient with a tiny static layout (images + embeddings for a/b/c)."""
    static = tmp_path / "static"
    images = static / "images"
    thumbnails = static / "thumbnails"
    images.mkdir(parents=True)
    thumbnails.mkdir(parents=True)

    for stem in ("a", "b", "c"):
        name = f"{stem}.jpg"
        (images / name).write_bytes(b"fake-image")
        (thumbnails / name).write_bytes(b"fake-thumb")

    embeddings = [
        {"filename": "a.jpg", "embedding": [0.1, 0.2, 0.3]},
        {"filename": "b.jpg", "embedding": [0.2, 0.3, 0.4]},
        {"filename": "c.jpg", "embedding": [0.3, 0.4, 0.5]},
    ]
    emb_path = static / "embeddings.jsonl"
    with emb_path.open("w", encoding="utf-8") as f:
        for obj in embeddings:
            f.write(json.dumps(obj) + "\n")

    import server as server_module

    load_uuid2embedding.cache_clear()
    load_uuid2caption.cache_clear()

    monkeypatch.setattr(server_module, "BASE_DIR", tmp_path)
    monkeypatch.setattr(server_module, "IMAGE_DIR", images)
    monkeypatch.setattr(
        server_module,
        "UUID2FILENAME",
        {"a": "a.jpg", "b": "b.jpg", "c": "c.jpg"},
    )

    with TestClient(server_module.app) as test_client:
        yield test_client

    load_uuid2embedding.cache_clear()
    load_uuid2caption.cache_clear()
