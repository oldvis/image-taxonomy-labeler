# Shared assets

The visualization catalog used by both apps lives here as `visualizations.json`.

Obtain / refresh it with:

```bash
cd packages/shared/assets
python download.py
```

(or `uv run` / your preferred Python env with `oldvis_dataset` installed)

The file stores a list of objects matching the `Visualization` shape from
[libprocess](https://github.com/oldvis/libprocess/blob/main/libprocess/typing.py).

```
📂assets
 ┣ 📜download.py
 ┣ 📜README.md
 ┗ 📜visualizations.json
```
