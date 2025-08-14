"""
This module provides functions to load precomputed image embeddings and captions.
"""

from functools import cache

import numpy as np
from libquery.utils.jsonl import load_jl
from sklearn.decomposition import PCA


def filename2uuid(filename: str) -> str:
    """Extract UUID from filename."""

    return filename.split(".")[0]


@cache
def load_uuid2embedding(
    embedding_path: str, max_dim: int | None = None
) -> dict[str, np.ndarray]:
    """
    Load the mapping from uuid to embedding.
    The loaded mapping is cached.

    Parameters
    ----------
    embedding_path : str
        Path to the JSONL file containing the embeddings.
    max_dim : int or None
        Maximum number of dimensions to keep after PCA.
        If None, no PCA is applied.

    Returns
    -------
    dict[str, np.ndarray]
        Mapping from UUID to embedding.
    """

    embedding_objects = load_jl(embedding_path)

    # Compress to 20 dimensions using PCA to accelerate distance computation.
    embeddings = [d["embedding"] for d in embedding_objects]
    embeddings = np.array(embeddings).reshape(len(embeddings), -1)
    if max_dim is not None and embeddings.shape[1] > max_dim:
        embeddings = PCA(n_components=max_dim, random_state=0).fit_transform(embeddings)
    embeddings = embeddings.tolist()

    return {
        filename2uuid(d["filename"]): embeddings[i]
        for i, d in enumerate(embedding_objects)
    }


def load_embeddings(
    uuids: list[str], embedding_path: str, max_dim: int | None = 20
) -> np.ndarray:
    """
    Load the embeddings of the files with the given UUIDs.
    The embeddings are ordered according to the UUIDs.

    Parameters
    ----------
    uuids : list[str]
        List of UUIDs.
    embedding_path : str
        Path to the JSONL file containing the embeddings.
    max_dim : int or None
        Maximum number of dimensions to keep after PCA.
        If None, no PCA is applied.

    Returns
    -------
    np.ndarray
        Embeddings of the files with the given UUIDs.
    """

    uuid2embedding = load_uuid2embedding(embedding_path, max_dim)
    embeddings = [uuid2embedding[uuid] for uuid in uuids]
    return np.array(embeddings).reshape(len(embeddings), -1)


@cache
def load_uuid2caption(caption_path: str) -> dict[str, str]:
    """
    Load the mapping from uuid to caption.
    The loaded mapping is cached.
    """

    return {filename2uuid(d["filename"]): d["caption"] for d in load_jl(caption_path)}
