"""API should return 4xx for invalid compute inputs (not 500)."""

from pathlib import Path

from fastapi.testclient import TestClient

from utils.loaders import load_uuid2caption, load_uuid2embedding


def test_clustering_nclusters_too_large(client: TestClient):
    r = client.post(
        "/clustering",
        json={"uuids": ["a", "b"], "nClusters": 5},
    )
    assert r.status_code == 400


def test_assign_grid_too_few_cells(client: TestClient):
    r = client.post(
        "/assignGrid",
        json={"uuids": ["a", "b", "c"], "nRows": 1, "nCols": 1},
    )
    assert r.status_code == 400


def test_missing_image_uuid_404(client: TestClient):
    r = client.get("/uuids/does-not-exist/image")
    assert r.status_code == 404


def test_captioning_missing_file_returns_503(client: TestClient, tmp_path: Path):
    caption_path = tmp_path / "static" / "captions.jsonl"
    assert not caption_path.exists()
    load_uuid2caption.cache_clear()
    r = client.post("/captioning", json=["a"])
    assert r.status_code == 503
    assert r.status_code != 500


def test_clustering_missing_embeddings_returns_503(client: TestClient, tmp_path: Path):
    emb_path = tmp_path / "static" / "embeddings.jsonl"
    emb_path.unlink()
    load_uuid2embedding.cache_clear()
    r = client.post(
        "/clustering",
        json={"uuids": ["a"], "nClusters": 1},
    )
    assert r.status_code == 503
    assert r.status_code != 500


def test_clustering_empty_uuids_400(client: TestClient):
    r = client.post("/clustering", json={"uuids": [], "nClusters": 1})
    assert r.status_code == 400


def test_find_center_empty_uuids_400(client: TestClient):
    r = client.post("/findCenter", json=[])
    assert r.status_code == 400
