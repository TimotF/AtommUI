"""Prepare the checked-in CC0 texture derivatives from verified local originals.
Usage: python3 scripts/prepare-material-textures.py /path/to/source-downloads
Requires Pillow. Downloads are not performed by this script.
"""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image, ImageStat

root = Path(__file__).resolve().parents[1]
out = root / 'src/assets/materials'
source = Path(sys.argv[1])
manifest = json.loads((out / 'sources.json').read_text())
for name, spec in manifest.items():
    images = {}
    for kind, meta in spec['maps'].items():
        path = source / meta['filename']
        assert hashlib.md5(path.read_bytes()).hexdigest() == meta['md5'], path
        images[kind] = Image.open(path)
    # A single luminance field preserves natural grain without independent
    # channel boosts turning scratches yellow or purple.
    image = images['Diffuse'].convert('L').resize((1024, 1024), Image.Resampling.LANCZOS)
    mean = ImageStat.Stat(image).mean[0]
    bands = [image.point(lambda value, tone=tone:
             round(min(255, tone * (value / mean) ** spec['contrast'])))
             for tone in spec['previewMeanRgb']]
    color = Image.merge('RGB', bands)
    color.save(out / (name + '-color.webp'), quality=82, method=6)
    color.resize((256, 256), Image.Resampling.LANCZOS).save(
        out / (name + '-thumbnail.jpg'), quality=90, optimize=True)
    images['nor_gl'].convert('RGB').resize((512, 512), Image.Resampling.LANCZOS).save(
        out / (name + '-normal.jpg'), quality=82, optimize=True)
    rough = images['Rough'].convert('L').resize((512, 512), Image.Resampling.LANCZOS)
    rough.point(lambda value: 190 + round(value * .25)).save(
        out / (name + '-roughness.jpg'), quality=82, optimize=True)
