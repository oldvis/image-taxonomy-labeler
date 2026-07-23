"""
Setup the server resources with
- sample images from <https://github.com/oldvis/image-taxonomy/tree/main/images>,
- precomputed embeddings at `./embeddings.zip`
- precomputed thumbnails at `./thumbnails.zip`
"""

import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import TypedDict
from zipfile import ZipFile

import requests
from requests.adapters import HTTPAdapter
from tqdm import tqdm
from urllib3.util.retry import Retry

MAX_ATTEMPTS = 5
REQUEST_TIMEOUT = 60
MAX_WORKERS = max(1, int(os.environ.get("SAMPLE_DOWNLOAD_WORKERS", "8")))


class FileMetadata(TypedDict):
    download_url: str


def _session(pool_size: int = MAX_WORKERS) -> requests.Session:
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
    adapter = HTTPAdapter(
        max_retries=retries,
        pool_connections=pool_size,
        pool_maxsize=pool_size,
    )
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def get_img_urls() -> list[str]:
    """
    Get the download URLs of the sample images.

    See https://docs.github.com/en/rest/repos/contents#get-repository-content.
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
    """
    Download a single URL to dest, retrying transient network failures.

    Raises
    ------
    RuntimeError
        If the download fails after ``MAX_ATTEMPTS`` attempts.
    """

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
    raise RuntimeError(
        f"Failed to download {url} after {MAX_ATTEMPTS} attempts"
    ) from last_error


def _is_within_directory(directory: Path, target: Path) -> bool:
    try:
        target.resolve().relative_to(directory.resolve())
        return True
    except ValueError:
        return False


def safe_extract(zip_path: Path, dest_dir: Path) -> None:
    """
    Extract a zip archive into dest_dir after validating member paths.

    Raises
    ------
    RuntimeError
        If a member path would escape ``dest_dir`` (zip-slip).
    """

    with ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            target = dest_dir / member.filename
            if not _is_within_directory(dest_dir, target):
                raise RuntimeError(f"Illegal zip path: {member.filename}")
        zf.extractall(dest_dir)


def extract_if_needed(zip_path: Path, dest_dir: Path, marker: Path) -> None:
    """
    Extract zip_path into dest_dir unless marker already exists.

    Raises
    ------
    RuntimeError
        If extraction is needed and a member path would escape ``dest_dir``.
    """

    if marker.exists():
        return
    safe_extract(zip_path, dest_dir)


def _thumbnails_ready(base_dir: Path) -> bool:
    thumbnails = base_dir / "thumbnails"
    return thumbnails.is_dir() and any(thumbnails.iterdir())


def fetch_imgs(urls: list[str], img_dir: str) -> None:
    """
    Given the URLs of the images, download them to the specified directory.

    Parameters
    ----------
    urls : list[str]
        The URLs of the images to be downloaded.
    img_dir : str
        The directory to save the images.

    Raises
    ------
    RuntimeError
        If any image download fails after retries.
    """

    if not os.path.exists(img_dir):
        os.makedirs(img_dir)

    session = _session(MAX_WORKERS)
    urls_filtered = filter_queries(urls, img_dir)
    if not urls_filtered:
        return

    workers = min(MAX_WORKERS, len(urls_filtered))
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(
                _download_one,
                session,
                url,
                Path(img_dir) / url2filename(url),
            ): url
            for url in urls_filtered
        }
        for future in tqdm(
            as_completed(futures),
            total=len(futures),
            desc="Fetch Image Progress",
        ):
            future.result()


if __name__ == "__main__":
    base_dir = Path(__file__).parent

    # Download sample images.
    img_urls = get_img_urls()
    img_dir = base_dir / "images"
    fetch_imgs(img_urls, str(img_dir))

    # Unzip the embeddings (skip if already present).
    extract_if_needed(
        base_dir / "embeddings.zip",
        base_dir,
        marker=base_dir / "embeddings.jsonl",
    )

    # Unzip the thumbnails (skip if directory already has files).
    thumbnails_zip = base_dir / "thumbnails.zip"
    if not _thumbnails_ready(base_dir):
        safe_extract(thumbnails_zip, base_dir)
