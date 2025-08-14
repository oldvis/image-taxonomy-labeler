from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn

from utils.assign_grid import assign_grid
from utils.captioning import captioning
from utils.clustering import clustering, find_center_uuid
from utils.loaders import load_embeddings


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
IMAGE_DIR = BASE_DIR / "static" / "images"
UUID2FILENAME = {
    f.name.split(".")[0]: f.name for f in IMAGE_DIR.iterdir() if f.is_file()
}


@app.get("/uuids/{uuid}/image")
async def get_image(uuid: str):
    if uuid not in UUID2FILENAME:
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(IMAGE_DIR / UUID2FILENAME[uuid])


@app.get("/uuids/{uuid}/thumbnail")
async def get_thumbnail(uuid: str):
    thumbnail_dir = BASE_DIR / "static" / "thumbnails"
    if uuid not in UUID2FILENAME:
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(thumbnail_dir / UUID2FILENAME[uuid])


@app.get("/uuids/{uuid}/caption")
async def get_caption(uuid: str):
    if uuid not in UUID2FILENAME:
        raise HTTPException(status_code=404, detail="Caption not found")
    caption_path = BASE_DIR / "static" / "captions.jsonl"
    caption = captioning(uuid, str(caption_path))
    return caption


@app.post("/captioning")
async def calc_captions(uuids: list[str | None]):
    caption_path = BASE_DIR / "static" / "captions.jsonl"
    captions = [
        captioning(uuid, str(caption_path)) if uuid is not None else None
        for uuid in uuids
    ]
    return captions


class ClusteringRequest(BaseModel):
    uuids: list[str]
    nClusters: int


@app.post("/clustering")
async def calc_cluster_labels(req: ClusteringRequest):
    uuids = req.uuids
    n_clusters = req.nClusters
    embedding_path = BASE_DIR / "static" / "embeddings.jsonl"
    embeddings = load_embeddings(uuids, str(embedding_path))
    labels = clustering(embeddings, n_clusters)
    return labels.tolist()


@app.post("/findCenter")
async def calc_center_uuid(uuids: list[str]):
    embedding_path = BASE_DIR / "static" / "embeddings.jsonl"
    embeddings = load_embeddings(uuids, str(embedding_path))
    uuid = find_center_uuid(embeddings, uuids)
    return uuid


@app.post("/findCenters")
async def calc_center_uuids(groups: list[list[str]]):
    embedding_path = BASE_DIR / "static" / "embeddings.jsonl"
    center_uuids = [
        find_center_uuid(load_embeddings(uuids, str(embedding_path)), uuids)
        for uuids in groups
    ]
    return center_uuids


class AssignGridRequest(BaseModel):
    uuids: list[str]
    nRows: int
    nCols: int


@app.post("/assignGrid")
async def calc_cell_indices(req: AssignGridRequest):
    uuids = req.uuids
    n_rows = req.nRows
    n_cols = req.nCols
    embedding_path = BASE_DIR / "static" / "embeddings.jsonl"
    embeddings = load_embeddings(uuids, str(embedding_path))
    assignment = assign_grid(embeddings, n_rows, n_cols)
    return assignment.tolist()


if __name__ == "__main__":
    uvicorn.run(f"{Path(__file__).stem}:app", host="0.0.0.0", port=5001, reload=True)
