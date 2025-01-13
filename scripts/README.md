<a href="https://github.com/psf/black">
    <img alt="Code style: black" src="https://img.shields.io/badge/code%20style-black-000000.svg">
</a>

# README

This directory holds scripts for precomputing/caching resources to be used by the server.

## Directory Structure

This directory is structured as:

```
📂scripts
 ┣ 📜cache_caption.py       - the script for computing and storing captions of the images.
 ┣ 📜cache_embedding.py     - the script for computing and storing embeddings of the images.
 ┣ 📜cache_thumbnails.py    - the script for computing and storing thumbnail version of the images.
 ┣ 📜setup_cache.py         - the script for setting up all the cache to be used.
 ┗ 📜pyproject.toml         - the dependencies of the scripts
```
