# World map artwork

`world-map.svg` is derived from Natural Earth 1:110m land polygons, including major islands. Made with Natural Earth.

- Dataset: https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-land/
- Source GeoJSON: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/693f11422f4e08d2da4566b854dda53eb7c39fb3/geojson/ne_110m_land.geojson
- Source repository commit: `693f11422f4e08d2da4566b854dda53eb7c39fb3`
- Source SHA-256: `9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9`
- SVG SHA-256: `2bbe6cc2f1f5e9cc2ca22e53e148e6134a481cbd237113ea6609117916ddbc8c`
- License: public domain. Natural Earth's terms permit modification and commercial use: https://www.naturalearthdata.com/about/terms-of-use/
- Authors credited by Natural Earth: Tom Patterson, Nathaniel Vaughn Kelso, and contributors.

The SVG preserves the source's 127 land polygons and 128 rings, projected as equirectangular coordinates. Longitude/latitude are mapped with `x = 2 * (longitude + 180)` and `y = 2 * (90 - latitude)` into a `0 0 720 360` viewBox. Coordinates are rounded to two SVG decimal places; duplicate closing vertices are replaced by `Z`. No additional geometric simplification is applied to the generalized 1:110m dataset.

Geographic bounds: longitude -180 to 180, latitude -90 to 83.6451. Projected occupied bounds: x=0.00 to 720.00, y=12.71 to 360.00. 5015 path vertices; 66911 bytes.

The single white fill on a transparent background is intended for a decorative CSS mask/background; its opacity and color are controlled by the consuming component. There are no labels, political borders, location markers, scripts, fonts, images, or external references. It contains no user location data. Keep decorative uses hidden from assistive technology. Uploaded screenshots and the referenced Shutterstock image are not part of this asset.
