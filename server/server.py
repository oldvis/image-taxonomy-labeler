"""FastAPI app for image taxonomy labeling.

Serves images, thumbnails, and captions, and exposes clustering and grid
assignment endpoints. CPU-heavy sklearn work runs via asyncio.to_thread so
the event loop can still serve image GETs during /clustering, /findCenter(s),
and /assignGrid.
"""

import asyncio
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

from utils.assign_grid import assign_grid
from utils.captioning import captioning
from utils.clustering import clustering, find_center_uuid
from utils.loaders import build_uuid2filename, load_embeddings

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
IMAGE_DIR = BASE_DIR / "static" / "images"
try:
    UUID2FILENAME = build_uuid2filename(IMAGE_DIR)
except FileNotFoundError as exc:
    raise SystemExit(str(exc)) from exc

_MISSING_RESOURCE = "Server resource missing; run setup_samples.py / check static/"


@app.get("/uuids/{uuid}/image")
async def get_image(uuid: str):
    if uuid not in UUID2FILENAME:
        raise HTTPException(status_code=404, detail="Image not found")
    path = IMAGE_DIR / UUID2FILENAME[uuid]
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path)


@app.get("/uuids/{uuid}/thumbnail")
async def get_thumbnail(uuid: str):
    thumbnail_dir = BASE_DIR / "static" / "thumbnails"
    if uuid not in UUID2FILENAME:
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    path = thumbnail_dir / UUID2FILENAME[uuid]
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(path)


@app.get("/uuids/{uuid}/caption")
async def get_caption(uuid: str):
    if uuid not in UUID2FILENAME:
        raise HTTPException(status_code=404, detail="Caption not found")
    caption_path = BASE_DIR / "static" / "captions.jsonl"
    try:
        return captioning(uuid, str(caption_path))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=_MISSING_RESOURCE) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown uuid: {exc}") from exc


@app.post("/captioning")
async def calc_captions(uuids: list[str | None]):
    caption_path = BASE_DIR / "static" / "captions.jsonl"
    try:
        return [
            captioning(uuid, str(caption_path)) if uuid is not None else None
            for uuid in uuids
        ]
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=_MISSING_RESOURCE) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown uuid: {exc}") from exc


class ClusteringRequest(BaseModel):
    uuids: list[str]
    nClusters: int


@app.post("/clustering")
async def calc_cluster_labels(req: ClusteringRequest):
    uuids = req.uuids
    n_clusters = req.nClusters
    if not uuids:
        raise HTTPException(status_code=400, detail="uuids must be non-empty")
    if n_clusters < 1 or n_clusters > len(uuids):
        raise HTTPException(
            status_code=400,
            detail="nClusters must be between 1 and len(uuids)",
        )
    embedding_path = BASE_DIR / "static" / "embeddings.jsonl"
    try:
        embeddings = load_embeddings(uuids, str(embedding_path))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=_MISSING_RESOURCE) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown uuid: {exc}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    labels = await asyncio.to_thread(clustering, embeddings, n_clusters)
    return labels.tolist()


@app.post("/findCenter")
async def calc_center_uuid(uuids: list[str]):
    if not uuids:
        raise HTTPException(status_code=400, detail="uuids must be non-empty")
    embedding_path = BASE_DIR / "static" / "embeddings.jsonl"
    try:
        embeddings = load_embeddings(uuids, str(embedding_path))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=_MISSING_RESOURCE) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown uuid: {exc}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return await asyncio.to_thread(find_center_uuid, embeddings, uuids)


@app.post("/findCenters")
async def calc_center_uuids(groups: list[list[str]]):
    embedding_path = BASE_DIR / "static" / "embeddings.jsonl"

    def _centers() -> list[str]:
        return [
            find_center_uuid(load_embeddings(uuids, str(embedding_path)), uuids)
            for uuids in groups
        ]

    try:
        for uuids in groups:
            if not uuids:
                raise HTTPException(status_code=400, detail="uuids must be non-empty")
        return await asyncio.to_thread(_centers)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=_MISSING_RESOURCE) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown uuid: {exc}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


class AssignGridRequest(BaseModel):
    uuids: list[str]
    nRows: int
    nCols: int


@app.post("/assignGrid")
async def calc_cell_indices(req: AssignGridRequest):
    uuids = req.uuids
    n_rows = req.nRows
    n_cols = req.nCols
    if n_rows < 1 or n_cols < 1:
        raise HTTPException(status_code=400, detail="nRows and nCols must be >= 1")
    if n_rows * n_cols < len(uuids):
        raise HTTPException(
            status_code=400,
            detail="nRows * nCols must be >= len(uuids)",
        )
    if len(uuids) < 2:
        raise HTTPException(
            status_code=400,
            detail="assignGrid requires at least 2 uuids",
        )
    embedding_path = BASE_DIR / "static" / "embeddings.jsonl"
    try:
        embeddings = load_embeddings(uuids, str(embedding_path))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=_MISSING_RESOURCE) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown uuid: {exc}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    assignment = await asyncio.to_thread(assign_grid, embeddings, n_rows, n_cols)
    return assignment.tolist()


if __name__ == "__main__":
    uvicorn.run(
        f"{Path(__file__).stem}:app",
        host=os.environ.get("SERVER_HOST", "127.0.0.1"),
        port=5001,
        reload=True,
    )
