"""
Compute the thumbnail version for images in `img_dir` and save them to `thumbnail_dir`.
"""

import math
import os
from typing import List, Tuple

from PIL import Image
from tqdm import tqdm

# Suppress PIL.Image.DecompressionBombError for large images.
Image.MAX_IMAGE_PIXELS = 5e8


def filter_filenames(filenames: List[str], thumbnail_dir: str) -> List[str]:
    """
    Discards the images whose thumbnails are readily computed.
    """

    stored_filenames = set(os.listdir(thumbnail_dir))
    return [d for d in filenames if d not in stored_filenames]


def get_resize_dims(
    w: int,
    h: int,
    w_limit: int,
    h_limit: int,
) -> Tuple[int, int]:
    """
    Compute the dimensions of the resized image such that it fits within the limits.

    Parameters
    ----------
    w : int
        Width of the image.
    h : int
        Height of the image.
    w_limit : int
        Maximum width of the resized image.
    h_limit : int
        Maximum height of the resized image.

    Returns
    -------
    Tuple[int, int]
        Dimensions of the resized image.
    """

    if (w / h) >= (w_limit / h_limit):
        return w_limit, math.floor(h * (w_limit / w))
    return math.floor(w * (h_limit / h)), h_limit


def create_thumbnails(
    img_dir: str,
    thumbnail_dir: str,
    w_limit: int,
    h_limit: int,
) -> None:
    """
    For each image in `img_dir`, compute the thumbnail version and save it to `thumbnail_dir`.

    Parameters
    ----------
    img_dir : str
        Directory containing the images.
    thumbnail_dir : str
        Directory to save the thumbnails.
    w_limit : int
        Maximum width of the thumbnail.
    h_limit : int
        Maximum height of the thumbnail.
    """

    if not os.path.exists(thumbnail_dir):
        os.makedirs(thumbnail_dir)

    filenames = os.listdir(img_dir)
    filenames = filter_filenames(filenames, thumbnail_dir)
    for filename in tqdm(filenames):
        image_path = os.path.join(img_dir, filename)
        image = Image.open(image_path)
        w, h = image.size
        new_w, new_h = get_resize_dims(
            w=w,
            h=h,
            w_limit=w_limit,
            h_limit=h_limit,
        )
        image = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
        image.save(os.path.join(thumbnail_dir, filename))


if __name__ == "__main__":
    img_dir = "../server/static/images/"
    thumbnail_dir = "../server/static/thumbnails/"
    create_thumbnails(
        img_dir=img_dir,
        thumbnail_dir=thumbnail_dir,
        w_limit=100,
        h_limit=100,
    )
