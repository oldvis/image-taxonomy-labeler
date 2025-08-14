"""
Compute embeddings for images in a directory and save them to a JSONL file.
"""

import json
import os
from typing import Callable, NamedTuple, TypedDict

import torch
from libquery.utils.jsonl import load_jl
from PIL import Image
from tqdm import tqdm
from transformers import (
    BlipForConditionalGeneration,
    BlipForQuestionAnswering,
    Blip2ForConditionalGeneration,
    AutoProcessor,
    PreTrainedModel,
)


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
        print(f"Failed to open image at {path}")
        return None


def encode_filename(filename: str) -> str:
    return filename.replace("?", "%3F").replace(":", "%3A")


@torch.no_grad()
def save_captions(
    model: PreTrainedModel,
    processor: AutoProcessor,
    img_dir: str,
    prompt: str,
    save_to: str,
) -> None:
    """
    Compute captions for images in a directory
    and save them to a JSONL file.

    Parameters
    ----------
    model : PreTrainedModel
        Model for generating captions.
    processor : AutoProcessor
        Processor for the model.
    img_dir : str
        Path to the directory containing images.
    prompt : str
        Prompt to generate captions.
    save_to : str
        Path to a JSONL file to save the captions.
    """

    output_dir = os.path.dirname(save_to)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    filenames = sorted(os.listdir(img_dir))
    filenames = filter_filenames(filenames, save_to)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)

    for filename in tqdm(filenames):
        image_path = os.path.join(img_dir, filename)
        image = try_open(image_path)

        if image is None:
            caption = None
        else:
            inputs = processor(images=image, text=prompt, return_tensors="pt")
            inputs = inputs.to(device)
            outputs = model.generate(**inputs, max_new_tokens=30)
            caption = processor.decode(outputs[0], skip_special_tokens=True)
            caption = caption.removeprefix(prompt).strip()

        entry = {
            "filename": filename,
            "caption": caption,
        }
        with open(save_to, "a") as f:
            f.write(f"{json.dumps(entry)}\n")


def get_blip() -> tuple[PreTrainedModel, AutoProcessor]:
    model_name = "Salesforce/blip-image-captioning-large"
    model = BlipForConditionalGeneration.from_pretrained(model_name)
    processor = AutoProcessor.from_pretrained(model_name)
    return model, processor


def get_blip_vqa() -> tuple[PreTrainedModel, AutoProcessor]:
    model_name = "Salesforce/blip-vqa-base"
    model = BlipForQuestionAnswering.from_pretrained(model_name)
    processor = AutoProcessor.from_pretrained(model_name)
    return model, processor


def get_blip2() -> tuple[PreTrainedModel, AutoProcessor]:
    model_name = "Salesforce/blip2-opt-2.7b"
    model = Blip2ForConditionalGeneration.from_pretrained(model_name)
    processor = AutoProcessor.from_pretrained(model_name)
    return model, processor


class Setup(NamedTuple):
    directory: str
    getter: Callable[[], tuple[PreTrainedModel, AutoProcessor]]


if __name__ == "__main__":
    setup = Setup("blip2", get_blip2)
    img_dir = "../server/static/images/"
    prompt = "Question: what is the type of the visualization? Answer:"
    # caption_path = f"../notebooks/output/captioning/{setup.directory}/prompt={encode_filename(prompt)}.jsonl"
    caption_path = f"../server/static/captions.jsonl"
    save_captions(*setup.getter(), img_dir, prompt, caption_path)
