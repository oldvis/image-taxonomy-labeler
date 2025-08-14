# Graphics Replicability

The following are the steps to reproduce Figure 2 of the paper "[VisTaxa: Developing a Taxonomy of Historical Visualizations](https://doi.org/10.1109/TVCG.2025.3567132)".

1. clone this repository <https://github.com/oldvis/image-taxonomy-labeler>.
2. **Setup the server:** Within the cloned repository:
    1. Under directory `./server`, execute `poetry install` to install dependencies (assuming [Python 3.10](https://www.python.org/downloads/) and [Poetry 2.x.x](https://python-poetry.org/) have been installed).
    2. Under directory `./server/static`, execute `poetry run python setup_samples.py`.
        - Note: This script will download 400 images, unzip `./server/static/embeddings.zip`, and unzip `./server/static/thumbnails.zip`. Note that the image downloading will take some time and occupy in total around 400MB storage.
    3. Under directory `./server`, execute `poetry run python server.py` to launch the server (make sure port `5001` has not been occupied before launching the server).
3. **Setup the client:** Within the cloned repository, enter the directory `./client-label`. Under this directory:
    1. Execute `pnpm install` to install dependencies (assuming [node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) have been installed).
    2. Execute `pnpm run dev` to launch the dev server.
    3. A webpage with the URL `http://localhost:3333/` should automatically pop up in the browser, which corresponds to the interface screenshot in Figure 2 in the paper.
4. **Upload the annotations:**
    1. Manually download the annotations stored at <https://github.com/oldvis/image-taxonomy/blob/main/annotations.json>. (There is no restriction on the filename when storing the downloaded annotations.)
    2. Click the "upload" button at the bottom right of the interface hosted at `http://localhost:3333/`, and upload the downloaded annotations. The interface will then look similar to Figure 2 in the paper.
        - Note: After loading the annotations, it may take seconds for all the images to be rendered in the browser.
        - Note: The state of the interface will not look exactly the same as Figure 2 in the paper, because the screenshot in Figure 2 was taken when the annotation process was ongoing, while the the annotations stored at <https://github.com/oldvis/image-taxonomy/blob/main/annotations.json> are the final annotations.
