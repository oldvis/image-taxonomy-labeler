"""safe_extract should reject zip-slip paths and skip when markers exist."""

from pathlib import Path
from zipfile import ZipFile, ZipInfo

import pytest

from static.setup_samples import extract_if_needed, safe_extract


def _write_zip(zip_path: Path, members: dict[str, bytes]) -> None:
    with ZipFile(zip_path, "w") as zf:
        for name, data in members.items():
            info = ZipInfo(name)
            zf.writestr(info, data)


def test_safe_extract_rejects_path_escape(tmp_path: Path):
    zip_path = tmp_path / "evil.zip"
    _write_zip(zip_path, {"../evil.txt": b"nope"})
    out = tmp_path / "out"
    out.mkdir()
    with pytest.raises(RuntimeError, match="Illegal zip path"):
        safe_extract(zip_path, out)


def test_safe_extract_writes_members(tmp_path: Path):
    zip_path = tmp_path / "ok.zip"
    _write_zip(zip_path, {"nested/file.txt": b"hello"})
    out = tmp_path / "out"
    out.mkdir()
    safe_extract(zip_path, out)
    assert (out / "nested" / "file.txt").read_bytes() == b"hello"


def test_extract_if_needed_skips_when_marker_exists(tmp_path: Path):
    zip_path = tmp_path / "data.zip"
    _write_zip(zip_path, {"file.txt": b"data"})
    dest = tmp_path / "dest"
    dest.mkdir()
    marker = dest / "embeddings.jsonl"
    marker.write_text("already\n", encoding="utf-8")
    extract_if_needed(zip_path, dest, marker)
    assert not (dest / "file.txt").exists()
