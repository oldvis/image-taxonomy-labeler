"""
Setup the server resources with
- sample images from <https://github.com/oldvis/image-taxonomy/tree/main/images>,
- precomputed embeddings at `./embeddings.zip`
- precomputed thumbnails at `./thumbnails.zip`
"""

import os
import time
from pathlib import Path
from typing import TypedDict
from zipfile import ZipFile

import requests
from requests.adapters import HTTPAdapter
from tqdm import tqdm
from urllib3.util.retry import Retry

MAX_ATTEMPTS = 5
REQUEST_TIMEOUT = 60


class FileMetadata(TypedDict):
    download_url: str


def _session() -> requests.Session:
    session = requests.Session()
    retries = Retry(
        total=3,
        connect=3,
        read=3,
        backoff_factor=1.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def get_img_urls() -> list[str]:
    """
    Get the download URLs of the sample images.

    Reference: https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
    """

    url = "https://api.github.com/repos/oldvis/image-taxonomy/contents/images"
    response = _session().get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    data: list[FileMetadata] = response.json()
    return [file["download_url"] for file in data]


def url2filename(url: str) -> str:
    return url.split("/")[-1]


def filter_queries(urls: list[str], img_dir: str) -> list[str]:
    """
    Filter URLs queried before according to the stored images.

    Parameters
    ----------
    urls : list[str]
        The URLs of the images to be downloaded.
    img_dir : str
        The directory to save the images.

    Returns
    -------
    list[str]
        The URLs of the images that are not stored in the directory.
    """

    filenames = {
        d for d in os.listdir(img_dir) if os.path.isfile(os.path.join(img_dir, d))
    }
    return [d for d in urls if url2filename(d) not in filenames]


def _download_one(session: requests.Session, url: str, dest: Path) -> None:
    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            response = session.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            tmp = dest.with_suffix(dest.suffix + ".partial")
            tmp.write_bytes(response.content)
            tmp.replace(dest)
            return
        except (
            requests.exceptions.SSLError,
            requests.exceptions.ConnectionError,
            requests.exceptions.ChunkedEncodingError,
            requests.exceptions.Timeout,
            requests.exceptions.HTTPError,
        ) as exc:
            last_error = exc
            if attempt < MAX_ATTEMPTS:
                time.sleep(min(2**attempt, 30))
    raise RuntimeError(f"Failed to download {url} after {MAX_ATTEMPTS} attempts") from last_error


def fetch_imgs(urls: list[str], img_dir: str) -> None:
    """
    Given the URLs of the images, download them to the specified directory.

    Parameters
    ----------
    urls : list[str]
        The URLs of the images to be downloaded.
    img_dir : str
        The directory to save the images.
    """

    if not os.path.exists(img_dir):
        os.makedirs(img_dir)

    session = _session()
    urls_filtered = filter_queries(urls, img_dir)
    for url in tqdm(urls_filtered, desc="Fetch Image Progress"):
        dest = Path(img_dir) / url2filename(url)
        _download_one(session, url, dest)


if __name__ == "__main__":
    base_dir = Path(__file__).parent

    # Download sample images.
    img_urls = get_img_urls()
    img_dir = base_dir / "images"
    fetch_imgs(img_urls, str(img_dir))

    # Unzip the embeddings.
    embeddings_path = base_dir / "embeddings.zip"
    with ZipFile(embeddings_path, "r") as zip_ref:
        zip_ref.extractall(base_dir)

    # Unzip the thumbnails
    thumbnails_path = base_dir / "thumbnails.zip"
    with ZipFile(thumbnails_path, "r") as zip_ref:
        zip_ref.extractall(base_dir)
