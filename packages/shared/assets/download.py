"""
Download the latest visualizations catalog into this package.
"""

from pathlib import Path

if __name__ == "__main__":
    try:
        from oldvis_dataset import visualizations
    except ImportError:
        import pip

        pip.main(args=["install", "oldvis_dataset"])

        from oldvis_dataset import visualizations

    dest = Path(__file__).with_name("visualizations.json")
    visualizations.download(path=str(dest))
    print(f"Wrote {dest}")
