"""API should return 4xx for invalid compute inputs (not 500)."""

from fastapi.testclient import TestClient


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
