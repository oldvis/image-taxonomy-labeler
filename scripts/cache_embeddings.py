"""
Compute embeddings for images in `img_dir` and save them to a JSONL file.
"""

import json
import os
from pathlib import Path
from typing import TypedDict

import torch
from libquery.utils.jsonl import load_jl
from PIL import Image
from tqdm import tqdm
from transformers import AutoProcessor, CLIPVisionModelWithProjection


# Suppress PIL.Image.DecompressionBombError for large images.
Image.MAX_IMAGE_PIXELS = 5e8


class EmbeddingObject(TypedDict):
    filename: str
    embedding: list[float]


def filter_filenames(filenames: list[str], embedding_path: str) -> list[str]:
    """
    Discards the images whose embeddings are readily computed.
    """

    stored: list[EmbeddingObject] = (
        load_jl(embedding_path) if os.path.exists(embedding_path) else []
    )
    stored_filenames = set([d["filename"] for d in stored])
    return [d for d in filenames if d not in stored_filenames]


def try_open(path: str) -> Image.Image | None:
    try:
        return Image.open(path)
    except:
        return None


@torch.no_grad()
def save_embeddings(img_dir: str, save_to: str) -> None:
    """
    Compute embeddings for images in a directory
    and save them to a JSONL file.

    Parameters
    ----------
    img_dir : str
        Path to directory containing images.
    save_to : str
        Path a JSONL file to save the embeddings.
    """

    output_dir = os.path.dirname(save_to)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    filenames = sorted(os.listdir(img_dir))
    filenames = filter_filenames(filenames, save_to)

    model_name = "openai/clip-vit-base-patch32"
    model = CLIPVisionModelWithProjection.from_pretrained(model_name)
    processor = AutoProcessor.from_pretrained(model_name)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)

    for filename in tqdm(filenames):
        image_path = os.path.join(img_dir, filename)
        image = try_open(image_path)

        if image is None:
            embedding = None
        else:
            inputs = processor(images=image, return_tensors="pt")
            inputs = inputs.to(device)
            outputs = model(**inputs)
            image_embeds = outputs.image_embeds
            embedding = image_embeds.tolist()

        entry: EmbeddingObject = {
            "filename": filename,
            "embedding": embedding,
        }
        with open(save_to, "a") as f:
            f.write(f"{json.dumps(entry)}\n")


if __name__ == "__main__":
    server_dir = Path(__file__).parent.parent / "server"
    img_dir = server_dir / "static" / "images"
    embedding_path = server_dir / "static" / "embeddings.jsonl"
    save_embeddings(str(img_dir), str(embedding_path))
