"""
Download the latest dataset.
"""

if __name__ == "__main__":
    try:
        from oldvis_dataset import visualizations
    except:
        import pip

        pip.main(args=["install", "oldvis_dataset"])

        from oldvis_dataset import visualizations

    visualizations.download(path="visualizations.json")
