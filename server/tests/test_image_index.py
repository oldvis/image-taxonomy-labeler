from pathlib import Path

import pytest

from utils.loaders import build_uuid2filename


def test_build_uuid2filename_maps_stem(tmp_path: Path):
    (tmp_path / "abc-123.jpg").write_bytes(b"x")
    (tmp_path / "def-456.png").write_bytes(b"y")
    mapping = build_uuid2filename(tmp_path)
    assert mapping == {"abc-123": "abc-123.jpg", "def-456": "def-456.png"}


def test_build_uuid2filename_missing_dir_raises(tmp_path: Path):
    missing = tmp_path / "nope"
    with pytest.raises(FileNotFoundError, match="images directory"):
        build_uuid2filename(missing)


def test_build_uuid2filename_skips_subdirectories(tmp_path: Path):
    (tmp_path / "keep.jpg").write_bytes(b"x")
    (tmp_path / "subdir").mkdir()
    (tmp_path / "subdir" / "nested.jpg").write_bytes(b"y")
    mapping = build_uuid2filename(tmp_path)
    assert mapping == {"keep": "keep.jpg"}
