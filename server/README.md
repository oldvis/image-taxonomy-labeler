<a href="https://github.com/psf/black">
    <img alt="Code style: black" src="https://img.shields.io/badge/code%20style-black-000000.svg">
</a>

# Server

The `server` of OldVis image taxonomy labeler.

This server is shared by the web clients in [client-label](../client-label) and [client-compare](../client-compare).

## Getting Started

Before launching the server, make sure you have [Python 3.10+](https://www.python.org/downloads/) and [Poetry](https://github.com/python-poetry/poetry).

### Quick Start

The easiest way to get started is to use the startup script:

```bash
bash start.sh
```

This script will:
1. Install dependencies using Poetry with `poetry install`.
2. Set up server resources with `poetry run python static/setup_samples.py` (downloads sample images, unzips thumbnails and embeddings).
3. Launch the backend server with `poetry run python server.py`.

Note: The steps above have the same effect as executing Step 1.1 Option 2, Step 1.2, Step 1.3, and Step 2 described in [How to Use](#how-to-use).

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

Before launching the server, make sure you have [Python 3.10](https://www.python.org/downloads/) and [Poetry](https://python-poetry.org/) installed.

To launch the server, you need to:

```bash
poetry install
poetry run python server.py
```

If you see the following output, the server is successfully launched 🚀.

```bash
 * Serving Flask app 'server'
 ...
```

To verify the server is working and the resources are correctly set up, you can try to access the following URL in your browser: `http://localhost:5001/uuids/7ded1f58-a160-5127-a994-46797eca8e9a/image`.
If you see an image of a chart, the server is working as intended 🎉.

## API

The server provides the following API services.

| Method | URL                       | Description                                                                                | Used By                             |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| GET    | `/ping`                   | Returns `pong`. Used for checking the availability of the server.                          | /                                   |
| GET    | `/uuids/<uuid>/image`     | Returns the image (original size) with the given UUID.                                     | `client-label` and `client-compare` |
| GET    | `/uuids/<uuid>/thumbnail` | Returns the image thumbnail with the given UUID.                                           | `client-label` and `client-compare` |
| GET    | `/uuids/<uuid>/caption`   | Returns the caption of the image with the given UUID.                                      | /                                   |
| POST   | `/captioning`             | Returns the captions of the images with the given UUIDs.                                   | `client-label`                      |
| POST   | `/clustering`             | Returns the cluster labels of the images with the given UUIDs.                             | `client-label`                      |
| POST   | `/findCenter`             | Returns the UUID of the image that is closest to the center of the given images.           | `client-label`                      |
| POST   | `/findCenters`            | Returns the UUIDs of the images that are closest to the centers of the given image groups. | `client-label`                      |
| POST   | `/assignGrid`             | Returns the cell indices of the images in the grid with the given number of rows and cols. | `client-label` and `client-compare` |
