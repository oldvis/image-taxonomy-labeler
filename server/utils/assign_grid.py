"""
This module provides functions to assign 2D embeddings to a grid.
"""

import numpy as np
from scipy.optimize import linear_sum_assignment
from scipy.spatial.distance import cdist
from sklearn.manifold import TSNE


def get_embeddings_2d(embeddings: np.ndarray) -> np.ndarray:
    """
    Compute 2D embeddings using t-SNE (n >= 3) or a deterministic layout (n < 3).
    """

    n = embeddings.shape[0]
    if n == 0:
        return np.zeros((0, 2), dtype=float)
    if n == 1:
        return np.array([[0.0, 0.0]], dtype=float)
    if n == 2:
        # Two points on a line — enough for assignment without t-SNE.
        return np.array([[0.0, 0.0], [1.0, 0.0]], dtype=float)
    return TSNE(
        n_components=2,
        random_state=0,
        perplexity=min(30, n / 3),
    ).fit_transform(embeddings)


def fit_to_rect(
    points: np.ndarray, width: int | float = 1.0, height: int | float = 1.0
) -> np.ndarray:
    """
    Fitting points to a rect [0, width] * [0, height].

    Axes with zero range are left at 0 after translation (avoids NaN).
    """

    points = points.astype(float, copy=True)
    points -= points.min(axis=0)
    scale = points.max(axis=0)
    scale[scale == 0] = 1.0
    points /= scale
    points *= np.array([width, height], dtype=float)
    return points


def build_grid(width: float, height: float, n_rows: int, n_cols: int) -> np.ndarray:
    """
    Build a grid of points in a rect [0, width] * [0, height] with n_rows * n_cols.
    """

    x = np.linspace(0, width, n_cols)
    y = np.linspace(0, height, n_rows)
    xv, yv = np.meshgrid(x, y)
    grid = np.vstack([xv.flatten(), yv.flatten()]).T
    return grid


def solve_assignment(cost_matrix: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Solve a bipartite graph assignment problem given the edge costs."""

    row_ind, col_ind = linear_sum_assignment(cost_matrix)
    return row_ind, col_ind


def invert(a: np.ndarray) -> np.ndarray:
    """Invert a permutation."""

    inverted = np.zeros(len(a), dtype=int)
    inverted[a] = np.arange(len(a))
    return inverted


def assign_grid(embeddings: np.ndarray, n_rows: int, n_cols: int) -> np.ndarray:
    """
    Assign 2D embeddings to a grid of size n_rows * n_cols.
    The coordinates are [0, 1, ..., n_rows - 1] * [0, 1, ..., n_cols - 1].

    Returns
    -------
    The grids assigned to the embeddings.
    The shape is (n_embeddings, 2).
    (assigned_coords[i][0], assigned_coords[i][1]) is the (row index, column index)
    assigned to embeddings[i].
    """

    width = 1
    height = n_rows / n_cols

    embeddings_2d = fit_to_rect(get_embeddings_2d(embeddings), width, height)
    grid = build_grid(width=width, height=height, n_rows=n_rows, n_cols=n_cols)
    cost = cdist(grid, embeddings_2d, "sqeuclidean")

    row_ind, col_ind = solve_assignment(cost)
    col_ind = row_ind[invert(col_ind)]

    assigned_rows = col_ind // n_cols
    assigned_cols = col_ind % n_cols
    assigned_coords = np.vstack([assigned_rows, assigned_cols]).T
    return assigned_coords
