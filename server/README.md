<a href="https://github.com/psf/black">
    <img alt="Code style: black" src="https://img.shields.io/badge/code%20style-black-000000.svg">
</a>

# Server

The `server` of OldVis image taxonomy labeler.

This server is shared by the web clients in [apps/label](../apps/label) and [apps/compare](../apps/compare).

## Getting Started

Before launching the server, make sure you have [Python 3.10+](https://www.python.org/downloads/) and [uv](https://docs.astral.sh/uv/).

### Quick Start

The easiest way to get started is to use the startup script:

```bash
bash start.sh
```

This script will:
1. Install dependencies using uv with `uv sync`.
2. Set up server resources with `uv run python static/setup_samples.py` (downloads sample images, unzips thumbnails and embeddings).
3. Launch the backend server with `uv run python server.py`.

Note: The steps above have the same effect as executing Step 1.1 Option 2, Step 1.2, Step 1.3, and Step 2 described in [Manual Setup](#manual-setup).

### Manual Setup

If you prefer to setup the `server` manually, please follow the steps below.

#### Step 1: Setup the Server Resources

##### Step 1.1: Setup images

###### Option 1: Download the image resources

Use [oldvis_dataset](https://github.com/oldvis/oldvis_dataset) to download the image resources and store it to `./static/images/`.

```python
from oldvis_dataset import visualizations, fetch_images
visualizations.download(path="./static/visualizations.json")
fetch_images(metadata_path="./static/visualizations.json", img_dir="./static/images/")
```

> [!WARNING]  
> The image download can be very slow and take days.

###### Option 2: Download a sample of the image resources

A sample of 400 images are available at [oldvis/image-taxonomy](https://github.com/oldvis/image-taxonomy/tree/main/images).

Download these images and store at `./static/images/`.

##### Step 1.2: Setup thumbnails

Unzip `./static/thumbnails.zip` and store the unzipped images at `./static/thumbnails/`.

##### Step 1.3: Setup embeddings

Unzip `./static/embeddings.zip` and store the unzipped `embeddings.jsonl` at `./static/embeddings.jsonl`.

#### Step 2: Launch the Server

Before launching the server, make sure you have [Python 3.10+](https://www.python.org/downloads/) and [uv](https://docs.astral.sh/uv/) installed.

To launch the server, you need to:

```bash
uv sync
uv run python server.py
```

By default the server listens on `127.0.0.1:5001`.
To expose on the LAN intentionally:

```bash
SERVER_HOST=0.0.0.0 uv run python server.py
```

If you see the following output, the server is successfully launched 🚀.

```text
INFO:     Uvicorn running on http://127.0.0.1:5001
```

To verify the server is working and the resources are correctly set up, you can try to access the following URL in your browser: `http://127.0.0.1:5001/uuids/7ded1f58-a160-5127-a994-46797eca8e9a/image`.
If you see an image of a chart, the server is working as intended 🎉.

## API

The server provides the following API services.

| Method | URL                       | Description                                                                                | Used By                             |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| GET    | `/uuids/<uuid>/image`     | Returns the image (original size) with the given UUID.                                     | `apps/label` and `apps/compare` |
| GET    | `/uuids/<uuid>/thumbnail` | Returns the image thumbnail with the given UUID.                                           | `apps/label` and `apps/compare` |
| GET    | `/uuids/<uuid>/caption`   | Returns the caption of the image with the given UUID.                                      | /                                   |
| POST   | `/captioning`             | Returns the captions of the images with the given UUIDs.                                   | `apps/label`                        |
| POST   | `/clustering`             | Returns the cluster labels of the images with the given UUIDs.                             | `apps/label`                        |
| POST   | `/findCenter`             | Returns the UUID of the image that is closest to the center of the given images.           | `apps/label`                        |
| POST   | `/findCenters`            | Returns the UUIDs of the images that are closest to the centers of the given image groups. | `apps/label`                        |
| POST   | `/assignGrid`             | Returns the cell indices of the images in the grid with the given number of rows and cols. | `apps/label` and `apps/compare` |

### Performance notes (large selections)

To keep large selections fast, the server applies PCA when loading embeddings and reduces them to 20 dimensions before clustering, center-finding, and grid assignment. You do not need to run PCA yourself.

Symbols used below:

| Symbol | Meaning |
| ------ | ------- |
| *n* | number of selected images |
| *k* | number of clusters (k-means) |
| *d* | embedding dimensionality after PCA (20) |
| *m* | number of grid cells (*rows × cols*), with *m* ≥ *n* |

| Endpoint | Bottleneck | Scaling (rough) |
| -------- | ---------- | --------------- |
| `/clustering` | k-means | *O(n · k · d)* — usually fine into the low thousands |
| `/findCenter`, `/findCenters` | mean + distances | *O(n · d)* — cheap |
| `/assignGrid` | t-SNE, then Hungarian assignment | t-SNE *O(n² · d)*; assignment *O(m³)* — this is the main slowdown for large sets |

Prefer smaller selections for grid layout when interactivity matters.
