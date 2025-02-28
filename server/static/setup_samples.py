"""
Setup the server resources with
- sample images from <https://github.com/oldvis/image-taxonomy/tree/main/images>,
- precomputed embeddings at `./embeddings.zip`
- precomputed thumbnails at `./thumbnails.zip`
"""

import os
import zipfile
from typing import List, TypedDict

import requests
from tqdm import tqdm


class FileMetadata(TypedDict):
    download_url: str


def get_img_urls() -> List[str]:
    """
    Get the download URLs of the sample images.

    Reference: https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
    """

    url = "https://api.github.com/repos/oldvis/image-taxonomy/contents/images"
    response = requests.get(url)
    data: List[FileMetadata] = response.json()
    return [file["download_url"] for file in data]


def url2filename(url: str) -> str:
    return url.split("/")[-1]


def filter_queries(urls: List[str], img_dir: str) -> List[str]:
    """
    Filter URLs queried before according to the stored images.

    Parameters
    ----------
    urls : List[str]
        The URLs of the images to be downloaded.
    img_dir : str
        The directory to save the images.

    Returns
    -------
    List[str]
        The URLs of the images that are not stored in the directory.
    """

    filenames = {
        d for d in os.listdir(img_dir) if os.path.isfile(os.path.join(img_dir, d))
    }
    return [d for d in urls if url2filename(d) not in filenames]


def fetch_imgs(urls: List[str], img_dir: str) -> None:
    """
    Given the URLs of the images, download them to the specified directory.

    Parameters
    ----------
    urls : List[str]
        The URLs of the images to be downloaded.
    img_dir : str
        The directory to save the images.
    """

    if not os.path.exists(img_dir):
        os.makedirs(img_dir)

    urls_filtered = filter_queries(urls, img_dir)
    for url in tqdm(urls_filtered, desc="Fetch Image Progress"):
        response = requests.get(url)
        with open(f"{img_dir}/{url2filename(url)}", "wb") as file:
            file.write(response.content)


if __name__ == "__main__":
    # Download sample images.
    img_urls = get_img_urls()
    img_dir = "./images"
    fetch_imgs(img_urls, img_dir)

    # Unzip the embeddings.
    with zipfile.ZipFile("./embeddings.zip", "r") as zip_ref:
        zip_ref.extractall("./")

    # Unzip the thumbnails
    with zipfile.ZipFile("./thumbnails.zip", "r") as zip_ref:
        zip_ref.extractall("./")
