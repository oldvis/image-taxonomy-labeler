"""
This module provides functions to cluster embeddings.
"""

import numpy as np
from sklearn.cluster import KMeans


def clustering(embeddings: np.ndarray, n_clusters: int) -> np.ndarray:
    model = KMeans(n_clusters=n_clusters, n_init="auto", random_state=0)
    model.fit(embeddings)
    return model.labels_


def find_center_uuid(embeddings: np.ndarray, uuids: list[str]) -> str | None:
    """
    Get the uuid of the data point closest to the center of the embeddings.
    Returns None if the input uuids is empty.
    """

    if len(uuids) == 0:
        return None

    center = np.mean(embeddings, axis=0)
    index = np.argmin(np.linalg.norm(embeddings - center, axis=1))
    return uuids[index]
