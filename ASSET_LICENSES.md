# Photographic material assets

The images embedded in the material previews are derivatives of these Poly Haven
assets, licensed CC0 1.0 and free to use and redistribute, including commercially:

- **Coated Pine** — Charlotte Baglioni (scanning), Rico Cilliers (processing).
  https://polyhaven.com/a/coated_pine
- **Black Walnut Veneer 01** — Jenelle van Heerden.
  https://polyhaven.com/a/black_walnut_veneer_01

License: https://polyhaven.com/license
CC0 text: https://creativecommons.org/publicdomain/zero/1.0/legalcode

The original assets are available free of charge from Poly Haven. The AtommUI
library's MIT license does not replace the CC0 status of those images.

Processing: 1K colour photographs are tone-adjusted for a light pine and a dark
walnut preview; normal and roughness maps are resized to 512px and JPEG-encoded.
Roughness is remapped to a matte finish. These are artistic preview finishes,
not calibrated representations of a purchased sheet or fabrication presets.
The grain uses a fixed 450mm tile; it does not stretch with part dimensions.

Source URLs and original hashes: src/assets/materials/sources.json in the source
repository. Reproduction: scripts/prepare-material-textures.py with a directory
containing the six source files listed there. No external requests are made by
the generator at runtime: the processed images are embedded in its package.
