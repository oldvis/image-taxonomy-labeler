"""
This module provides functions to assign 2D embeddings to a grid.
"""

import numpy as np
from scipy.optimize import linear_sum_assignment
from scipy.spatial.distance import cdist
from sklearn.manifold import TSNE


def get_embeddings_2d(embeddings: np.ndarray) -> np.ndarray:
    """
    Compute 2D embeddings using t-SNE.
    """

    return TSNE(
        n_components=2,
        random_state=0,
        perplexity=min(30, embeddings.shape[0] / 3),
    ).fit_transform(embeddings)


def fit_to_rect(
    points: np.ndarray, width: int | float = 1.0, height: int | float = 1.0
) -> np.ndarray:
    """
    Fitting points to a rect [0, width] * [0, height].
    """

    points -= points.min(axis=0)
    points /= points.max(axis=0)
    points *= np.array([width, height])
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
