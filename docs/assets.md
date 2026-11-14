# Asset optimization

All 18 supplied originals remain unchanged outside Git. Runtime assets come only from those files or their original Figma layers. No third-party replacement images, icon package, path rounding or geometry simplification is used.

SVG optimization removes XML comments/metadata and redundant whitespace only. Paths, viewBox, paint, opacity, masks, clip paths, filters and gradients are retained. Internal IDs and references are uniquely prefixed in the sprite.

PNG optimization recompresses IDAT without changing decoded pixels or other PNG chunks. Lossy quantization, WebP and AVIF were not applied or benchmarked; no quality-reducing result was accepted.

| Resource                                                                                                 | Original bytes | Optimized bytes | Saving | Quality                              |
| -------------------------------------------------------------------------------------------------------- | -------------: | --------------: | -----: | ------------------------------------ |
| x (2).svg                                                                                                |            311 |             307 |  1.29% | DPR1/2: zero different pixels        |
| edit-2.svg                                                                                               |            798 |             788 |  1.25% | DPR1/2: zero different pixels        |
| trash-2.svg                                                                                              |           1009 |            1003 |  0.59% | DPR1/2: zero different pixels        |
| add-outline 1.svg                                                                                        |            214 |             211 |  1.40% | DPR1/2: zero different pixels        |
| chevron-down.svg                                                                                         |            213 |             210 |  1.41% | DPR1/2: zero different pixels        |
| calendar.svg                                                                                             |            750 |             744 |  0.80% | DPR1/2: zero different pixels        |
| Vector.svg                                                                                               |            272 |             269 |  1.10% | DPR1/2: zero different pixels        |
| ci_users.svg                                                                                             |            930 |             927 |  0.32% | DPR1/2: zero different pixels        |
| streamline_money-cash-coins-stack-accounting-billing-payment-stack-cash-coins-currency-money-finance.svg |           1424 |            1410 |  0.98% | DPR1/2: zero different pixels        |
| mdi_users.svg                                                                                            |           1321 |            1318 |  0.23% | DPR1/2: zero different pixels        |
| mdi_local-pharmacy.svg                                                                                   |            382 |             379 |  0.79% | DPR1/2: zero different pixels        |
| mingcute_flask-fill.svg                                                                                  |            840 |             830 |  1.19% | DPR1/2: zero different pixels        |
| ic_round-shopping-cart.svg                                                                               |           1200 |            1197 |  0.25% | DPR1/2: zero different pixels        |
| ic_round-dashboard.svg                                                                                   |            826 |             823 |  0.36% | DPR1/2: zero different pixels        |
| Property 1=Default.svg                                                                                   |           2083 |            2065 |  0.86% | DPR1/2: zero different pixels        |
| Figma menu-burger                                                                                        |            373 |             368 |  1.34% | DPR1/2: zero different pixels        |
| Figma eye-off                                                                                            |           1185 |            1174 |  0.93% | DPR1/2: zero different pixels        |
| Figma eye                                                                                                |            650 |             644 |  0.92% | DPR1/2: zero different pixels        |
| Figma logout-hover                                                                                       |           2223 |            2201 |  0.99% | DPR1/2: zero different pixels        |
| Figma pagination-active                                                                                  |            297 |             292 |  1.68% | DPR1/2: zero different pixels        |
| Figma pagination-default                                                                                 |            297 |             292 |  1.68% | DPR1/2: zero different pixels        |
| Figma 0:301 cart-active                                                                                  |           1206 |            1203 |  0.25% | DPR1/2: zero different pixels        |
| Figma 0:1279 flask-active                                                                                |            844 |             834 |  1.18% | DPR1/2: zero different pixels        |
| Figma 0:463 pharmacy-active                                                                              |            382 |             379 |  0.79% | DPR1/2: zero different pixels        |
| Figma 0:987 users-active                                                                                 |           1313 |            1310 |  0.23% | DPR1/2: zero different pixels        |
| Figma 1469:435 dashboard-default                                                                         |            826 |             823 |  0.36% | DPR1/2: zero different pixels        |
| Mask group.svg                                                                                           |          57903 |           57885 |  0.03% | 44x44: zero different decoded pixels |
| elements.png                                                                                             |           7781 |            7603 |  2.29% | Zero different decoded pixels        |
| white round pill.png                                                                                     |          30555 |           28684 |  6.12% | Zero different decoded pixels        |
| Figma 92:3525 mobile-visible decoration 2x                                                               |           5260 |            4810 |  8.56% | Zero different decoded pixels        |
| Figma 92:3516 pill 2x                                                                                    |          31966 |           29787 |  6.82% | Zero different decoded pixels        |
| Figma 22:7771 header logo 2x                                                                             |           3172 |            3058 |  3.59% | Zero different decoded pixels        |

The per-SVG comparison measures optimized XML before symbol assembly; these individual files are not additionally shipped. The actual `public/icons.svg` is 21,541 bytes and contains 26 symbols. Unique IDs and all internal references passed structural checks; every Icon callsite is checked by a contract test. Fifty-two Chrome comparisons (26 symbols at DPR1 and DPR2) found zero different pixels against original SVG rendering.

The first two PNG rows are lossless candidates retained with the references outside Git. The application loads only the necessary mobile 2x exports, so it does not download duplicate 1x/2x files. A browser canvas comparison of all five PNG source/optimized pairs found zero different decoded RGBA pixels. The separate Login SVG logo also matched its original decoded pixels.

## Sprite contents

`close`, `edit`, `trash`, `add`, `chevron-down`, `calendar`, `filter`, `customers-stat`, `money`, `users`, `pharmacy`, `flask`, `cart`, `dashboard`, `logout`, `menu-burger`, `eye-off`, `eye`, `logout-hover`, `pagination-active`, `pagination-default`, `cart-active`, `flask-active`, `pharmacy-active`, `users-active`, `dashboard-default`.

Standalone logos are excluded from the sprite.

## Density and layout

| Runtime image       | Pixel dimensions       | CSS display size   | Source                                                  |
| ------------------- | ---------------------- | ------------------ | ------------------------------------------------------- |
| Pill                | 190x186                | 95x93              | Original high-resolution Figma pill, downsampled export |
| Decorative elements | 516x292                | 258x146            | Original vector layer, mobile visible crop at 2x        |
| Header logo         | 64x64                  | 32x32              | Original 300x300 Figma source                           |
| Login logo          | SVG, viewBox 44x44     | 44x44              | Supplied original SVG with retained mask/image          |
| Interface symbols   | Original SVG viewBoxes | Exact design slots | Supplied SVG / Figma vectors                            |

No low-resolution PNG is enlarged to invent Retina detail. Dimensions/aspect ratios reserve layout space. Login images are above the fold and are not lazy loaded; dynamic record photos reserve 24x24 space, use object-fit and lazy loading, and have a data-derived fallback when unavailable. Transparency and proportions are preserved. The decoration 2x export is a Figma viewport crop, not a claimed lossless replacement of the full uncropped illustration.

Inter Variable (`public/fonts/inter.woff2`, 352240 bytes) and its SIL Open Font License are used unchanged. No font subset was invented. All application asset URLs are local; no temporary Figma URLs are present.

See `assets.json` for exact source hashes, geometry checks and byte measurements. Reference files, comparison screenshots and operational tools are intentionally outside the repository.

## Tablet exports

The existing sprite, fonts, logos and mobile exports remain unchanged. Tablet reuses those assets and adds only the three images required for its different design slots. The80×80 header logo and358×350 pill are downsampled from existing300×300 and466×456 Figma originals; the smaller mobile PNGs are never upscaled. The full decorative PNG comes from the supplied465×346 source, whose transparency already contains the original8% opacity; no second opacity is applied.

| Resource                  | Original source bytes | Prepared export bytes | Final bytes | Lossless compression saving | Quality                                                               |
| ------------------------- | --------------------: | --------------------: | ----------: | --------------------------: | --------------------------------------------------------------------- |
| header-logo-tablet@2x.png |                42,714 |                 5,718 |       5,055 |                      11.59% | 80×80 for40×40; decoded RGBA identical before/after compression       |
| pill-tablet@2x.png        |               143,928 |               143,237 |      91,522 |                      36.10% | 358×350 for179×175; decoded RGBA identical before/after compression   |
| elements-tablet.png       |                 7,781 |                 7,781 |       7,603 |                       2.29% | Original dimensions and transparency; zero different decoded channels |

The source-to-final reductions for the first two files also include the deliberate export downsampling; they are not described as lossless relative to the higher-resolution original. Visual comparisons at the same CSS display size use the original Figma Login reference. The full decoration remains its original raster resolution, without invented Retina detail. A new vector export for it is unavailable under the free MCP quota; no enlargement is performed to claim more detail.

`picture` selects the appropriate source at768px; Chrome atDPR2 was checked to request only the mobile or tablet variant for each slot. Images reserve explicit dimensions and use `object-fit: contain`. Table avatars reserve24×24 on Mobile and36×36 on Tablet, use `object-fit: cover` and lazy loading. No extra image library, lossy format or duplicate icon system was added.
