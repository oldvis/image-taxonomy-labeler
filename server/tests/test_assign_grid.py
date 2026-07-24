import numpy as np
import pytest

from utils.assign_grid import assign_grid, fit_to_rect


def test_fit_to_rect_handles_zero_range_axis():
    points = np.array([[0.0, 1.0], [0.0, 2.0]], dtype=float)
    out = fit_to_rect(points.copy(), width=1.0, height=2.0)
    assert out.shape == (2, 2)
    assert np.isfinite(out).all()
    assert out[:, 0].min() >= 0
    assert out[:, 1].max() <= 2.0 + 1e-9


@pytest.mark.parametrize("n", [2, 3, 5, 10])
def test_assign_grid_returns_finite_unique_cells(n):
    rng = np.random.default_rng(0)
    embeddings = rng.normal(size=(n, 20))
    n_cols = int(np.ceil(np.sqrt(n * 2)))
    n_rows = int(np.ceil(n / n_cols))
    while n_rows * n_cols < n:
        n_cols += 1
    coords = assign_grid(embeddings, n_rows, n_cols)
    assert coords.shape == (n, 2)
    assert np.isfinite(coords).all()
    # Cells must be unique
    cells = [tuple(map(int, row)) for row in coords]
    assert len(set(cells)) == n
