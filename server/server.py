from os import listdir
from os.path import isfile, join
from typing import List, Union

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from utils.assign_grid import assign_grid
from utils.captioning import captioning
from utils.clustering import clustering, find_center_uuid
from utils.loaders import load_embeddings

app = Flask(__name__)
CORS(app)

image_dir = "./static/images"
thumbnail_dir = "./static/thumbnails"
filenames = [d for d in listdir(image_dir) if isfile(join(image_dir, d))]
uuid2filename = {d.split(".")[0]: d for d in filenames}


@app.route("/ping", methods=["GET"])
def pong():
    return "pong"


@app.route("/uuids/<uuid>/image", methods=["GET"])
def get_image(uuid: str):
    return send_from_directory(image_dir, uuid2filename[uuid])


@app.route("/uuids/<uuid>/thumbnail", methods=["GET"])
def get_thumbnail(uuid: str):
    return send_from_directory(thumbnail_dir, uuid2filename[uuid])


@app.route("/uuids/<uuid>/caption", methods=["GET"])
def get_caption(uuid: str):
    caption_path = "./static/captions.jsonl"
    caption = captioning(uuid, caption_path)
    return jsonify(caption)


@app.route("/captioning", methods=["POST"])
def calc_captions():
    data = request.json
    uuids: List[Union[str, None]] = data["uuids"]
    caption_path = "./static/captions.jsonl"
    captions = [
        captioning(uuid, caption_path) if uuids is not None else None for uuid in uuids
    ]
    return jsonify(captions)


@app.route("/clustering", methods=["POST"])
def calc_cluster_labels():
    data = request.json
    uuids: List[str] = data["uuids"]
    n_clusters: int = data["nClusters"]
    embedding_path = "./static/embeddings.jsonl"
    embeddings = load_embeddings(uuids, embedding_path)
    labels = clustering(embeddings, n_clusters)
    return jsonify(labels.tolist())


@app.route("/findCenter", methods=["POST"])
def calc_center_uuid():
    data = request.json
    uuids: List[str] = data["uuids"]
    embedding_path = "./static/embeddings.jsonl"
    embeddings = load_embeddings(uuids, embedding_path)
    uuid = find_center_uuid(embeddings, uuids)
    return jsonify(uuid)


@app.route("/findCenters", methods=["POST"])
def calc_center_uuids():
    data = request.json
    groups: List[List[str]] = data["groups"]
    embedding_path = "./static/embeddings.jsonl"
    center_uuids = [
        find_center_uuid(load_embeddings(uuids, embedding_path), uuids)
        for uuids in groups
    ]
    return jsonify(center_uuids)


@app.route("/assignGrid", methods=["POST"])
def calc_cell_indices():
    data = request.json
    uuids: List[str] = data["uuids"]
    n_rows: int = data["nRows"]
    n_cols: int = data["nCols"]
    embedding_path = "./static/embeddings.jsonl"
    embeddings = load_embeddings(uuids, embedding_path)
    assignment = assign_grid(embeddings, n_rows, n_cols)
    return jsonify(assignment.tolist())


if __name__ == "__main__":
    # NOTE: If host is not explicitly set (i.e., takes the default value of `127.0.0.1`),
    # The service will not be available at `localhost` on Mac.
    # NOTE: port 5000 is occupied on Mac
    # Reference: https://stackoverflow.com/questions/69818376/localhost5000-unavailable-in-macos-v12-monterey
    app.run(host="0.0.0.0", port=5001, debug=True)
