"""Package only the files referenced by the anonymous project homepage."""

from html.parser import HTMLParser
from pathlib import Path
import shutil
from urllib.parse import unquote, urlsplit


class PageAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = {Path("index.html")}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ("src", "poster", "data-light-src", "data-dark-src"):
            if key in attrs:
                self.add_path(attrs[key])
        if tag == "link" and attrs.get("rel") in ("stylesheet", "icon"):
            self.add_path(attrs["href"])

    def add_path(self, value):
        url = urlsplit(value)
        if url.scheme or url.netloc or not url.path:
            return
        path = Path(unquote(url.path))
        if path.is_absolute() or ".." in path.parts:
            raise ValueError(f"Asset path must stay inside the website: {path}")
        self.paths.add(path)


root = Path(__file__).resolve().parents[2]
destination = root / "_site"
page = PageAssets()
page.feed((root / "index.html").read_text())
for path in page.paths:
    if not (root / path).is_file():
        raise FileNotFoundError(f"Missing website asset: {path}")

if destination.exists():
    shutil.rmtree(destination)
destination.mkdir()
for path in sorted(page.paths):
    target = destination / path
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(root / path, target)
print(f"Prepared {len(page.paths)} referenced website files in _site/")
