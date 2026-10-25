# Photographic material assets

The images distributed with the material previews are derivatives of these Poly Haven
assets, licensed CC0 1.0 and free to use and redistribute, including commercially:

- **Plywood** — Rob Tuytel.
  https://polyhaven.com/a/plywood
- **Walnut Veneer 02** — Jenelle van Heerden.
  https://polyhaven.com/a/walnut_veneer_02

License: https://polyhaven.com/license
CC0 text: https://creativecommons.org/publicdomain/zero/1.0/legalcode

The original assets are available free of charge from Poly Haven. The AtommUI
library's software license does not replace the CC0 status of those images.

Processing: 4K colour photographs are downsampled to 1024px with high-quality
WebP encoding and tone-adjusted for golden light plywood and walnut veneer. Original
2K normal and roughness maps are resized to 512px and JPEG-encoded.
Roughness is remapped to a matte finish. These are artistic preview finishes,
not calibrated representations of a purchased sheet or fabrication presets.
256px JPEG thumbnails come from the same prepared colour photographs.
The grain uses a fixed 90mm tile for light plywood and a 180mm tile for walnut; it does not stretch with part dimensions.

Source URLs and original hashes: src/assets/materials/sources.json in the source
repository. Reproduction: scripts/prepare-material-textures.py with a directory
containing the six source files listed there. No external requests are made by
the generator at runtime: the processed images are included as separate resources in its package.

The 0.18.0 derivatives were resized from the existing prepared photographs,
with WebP/JPEG quality 82. The source preparation script uses the same target
sizes and quality for future rebuilds from verified originals.
