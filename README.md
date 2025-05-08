<a href="http://commitizen.github.io/cz-cli/">
    <img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg">
</a>

# OldVis Image Taxonomy Labeler

A web-based system for taxonomy labeling and comparison of old visualization images.

You can find a live demo [here](https://oldvis.github.io/image-taxonomy-labeler/) for taxonomy labeling.
The functions related to the server are disabled in the live demo.
To use the full-fledged version, please follow the instructions in [How to Use](#how-to-use-the-taxonomy-labeling-interface).

This repository is structured as:
- [`./client-label`](./client-label/): The interface for taxonomy labeling.
- [`./client-compare`](./client-compare/): The interface for taxonomy comparison.
- [`./scripts`](./scripts/): The scripts for one-time data preprocessing.
- [`./server`](./server/): The server shared by `./client-label` and `./client-compare` for serving image resource and computation services.

> [!WARNING]  
> The following instructions for setting up the interfaces assume the annotated dataset is [oldvis/dataset](https://github.com/oldvis/dataset/blob/main/dataset/output/visualizations.json).
> If you want to use the interfaces to annotate other images datasets, you will need to
> 1. ensure the image metadata matches the structure of [visualizations.json](https://github.com/oldvis/dataset/blob/main/dataset/output/visualizations.json) and replace the metadata at `./client-compare/src/assets/visualizations.json` and `./client-label/src/assets/visualizations.json`
> 2. store the images at `./server/static/images/`
> 3. setup the cache files (with `./scripts/setup_cache.py`)

## How to Use the Taxonomy Labeling Interface

1. Setup the server resources and launch the server (see details at [./server/README.md](./server/README.md#how-to-use)).
2. Launch the `taxonomy labeling interface` (see details at [./client-label/README.md](./client-label/README.md#how-to-use)).

## How to Use the Taxonomy Comparison Interface

1. Setup the server resources and launch the server (see details at [./server/README.md](./server/README.md#how-to-use)).
2. Launch the `taxonomy comparison interface` (see details at [./client-compare/README.md](./client-compare/README.md#how-to-use)).

## Reference

If you use this repository in a scientific publication, we would appreciate citations to the following paper:

```
@Article{Zhang2025VisTaxa,
  author    = {Zhang, Yu and Chen, Xinyue and Zheng, Weili and Guo, Yuhan and Li, Guozheng and Chen, Siming and Yuan, Xiaoru},
  title     = {{VisTaxa}: Developing a Taxonomy of Historical Visualizations},
  doi       = {10.1109/TVCG.2025.3567132},
  volume    = {},
  number    = {},
  pages     = {1--11},
  journal   = {IEEE Transactions on Visualization and Computer Graphics},
  publisher = {IEEE},
  year      = {2025},
}
```
