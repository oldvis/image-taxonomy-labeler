"""
This module provides functions to fetch precomputed caption for an image.
"""

from .loaders import load_uuid2caption


def cut_caption(caption: str, length_limit: int) -> str:
    """
    Cut the caption by word to the specified length limit.
    """

    words = caption.split(" ")
    partial = ""
    for word in words:
        if len(partial) + len(word) >= length_limit:
            break
        partial += word + " "
    return partial.strip()


def process_caption(caption: str) -> str:
    processors = [
        lambda d: d.removeprefix("the type of the visualization is").strip(),
        lambda d: d.removeprefix("type of the visualization is").strip(),
        lambda d: d.removeprefix("the type of the visualization is").strip(),
        lambda d: d.removeprefix("it is").strip(),
        lambda d: d.removeprefix("this is").strip(),
        lambda d: d.removeprefix("it's").strip(),
        lambda d: d.removeprefix("the map is").strip(),
        lambda d: d.removeprefix("the graph is").strip(),
        lambda d: d.removeprefix("the diagram is").strip(),
        lambda d: d.removeprefix("the visualization is").strip(),
        lambda d: d.removeprefix("a ").strip(),
        lambda d: d.removeprefix("type of").strip(),
        lambda d: d.removeprefix("type").strip(),
        lambda d: "unknown" if d == "" else d,
    ]
    for processor in processors:
        caption = processor(caption)
    return cut_caption(caption, 30)


def captioning(uuid: str, caption_path: str) -> str:
    uuid2caption = load_uuid2caption(caption_path)
    return process_caption(uuid2caption[uuid])
