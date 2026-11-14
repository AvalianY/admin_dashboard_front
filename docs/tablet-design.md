# Tablet design measurements — Stage 2

Source: [E-Pharmacy Figma](https://www.figma.com/design/LR5cz3qeCp376CAmDIFu4z/Admin-dashboard--Copy-). Existing components, API contracts and approved decisions D01–D15 remain the basis. Mobile Stage 1 was accepted by the owner and published as `3541e1d1ba03db3969e4cac90927c5ecd15b67ad`.

## Layout boundaries

Below 768 CSS pixels, the accepted mobile composition remains fluid from 320 to 375 pixels and centered at a maximum of 375 pixels thereafter. At 768 pixels, the tablet composition uses a maximum width of 768 pixels, centered with `margin-inline: auto`. Its main content is 704 pixels wide, with 32-pixel gutters. Wider viewports retain that bounded tablet layout. No desktop layout is enabled in Stage 2.

## Verified high-fidelity design context

| Frame     | Node       | Size     | Principal measurements                                                                                                    |
| --------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| Login     | `92:1412`  | 768×1024 | Brand x32/y24; heading x32/y272, 614 wide, Inter 600 54/60; pill x448/y168, 179×175; form x32/y562, 323 wide; button y704 |
| Dashboard | `1:187`    | 768×1332 | Header 80; cards y100, heights108, widths221/221/222, gap20; recent x32/y248, 704×512; finance x32/y780, 704×512          |
| Menu      | `1459:389` | 768×1024 | Overlay panel84 wide; close x38/y20,32×32; links x20/y100,44×44, gap14; logout x20/bottom20,44×44                         |
| Orders    | `1:414`    | 768×1024 | Search x32/y130,224×44; Filter x270,116×44; table x32/y194,960×502; range x32/y982,704×10                                 |
| Products  | `5:1648`   | 768×1024 | Same filter/table positions; add x559/y132,42 high; range x40/y994,688×10                                                 |
| Suppliers | `8:2908`   | 768×1024 | Same filter/table positions; add x540/y130,196×44; range x40/y994,688×10                                                  |
| Customers | `8:3919`   | 768×1024 | Same filter/table positions; approved Add Customers; original 960-wide columns plus approved profile-edit action          |

Header: burger x32/y24, 32×32; logo x80/y20, 40×40; heading x152/y15, Inter 600, 24/28; breadcrumb x152/y47, 12/18. Table title: 64 high, 18/24; column header: 58 high, 14/18; rows: 76 high, 16/18; horizontal cell inset: 20; avatar: 36 with an 8-pixel gap. The Dashboard recent table retains its 512-pixel panel with the same 58-pixel column header and 76-pixel rows. Colors and borders reuse the accepted Figma tokens.

| Table            | Column widths in source order                              |
| ---------------- | ---------------------------------------------------------- |
| Recent customers | 255 / 279 / 170                                            |
| Orders           | 225 / 158 / 131 / 172 / 122 / 152                          |
| Products         | 260 / 150 / 119 / 150 / 140 / 141                          |
| Suppliers        | 195 / 128 / 108 / 157 / 121 / 129 / 122                    |
| Customers        | 215 / 234 / 148 / 198 / 165; additional approved action122 |

The tables extend to the right frame edge and scroll inside their own viewport. The wider table is never allowed to expand the page. The scrollbar is a native range control synchronized with actual table scrolling. The original source thumb is 252 pixels; the main range track is 688 pixels (704 for Orders). Pagination remains five records per page.

## Reference availability

All seven main contexts were retrieved at high fidelity with screenshots before editing. The existing six main-page PNGs, menu PNG and three dialog PNGs are retained outside Git for comparison. Figma MCP reached its Starter quota while requesting product/supplier dialog contexts and the four horizontally scrolled duplicates (`5:805`, `8:2135`, `8:3160`, `9:4133`). These are not additional viewport sizes: all are 768×1024. No plan upgrade or paid resource is used.

The owner explicitly approved adapting the four product/supplier forms from the original saved PNG references and confirmed parameters instead of new MCP context: 536×392, padding 40, two columns of 224, an 8-pixel horizontal gap and 14-pixel vertical gap. Header: 24/28 with 40 below; inputs: 44 high; action row: 133/8/133, 44 high, 40 above. The product fields retain their approved mobile order; tablet places Stock/Suppliers on the second row, with Price on the left of the third. Reading and keyboard order follow each layout; resizing an open form preserves its values. Tablet edit titles are `Edit product` / `Edit supplier`; edit submits `Save`. Mobile retains its accepted `Edit data` titles and Supplier `Add` submit label. API payloads and validation are shared unchanged. Customer forms reuse the approved supplier visual system (D03), without adding data fields or writes.

Saved references available for direct whole-frame comparison are product edit `92:2480`, supplier create `92:2812`, and supplier edit `92:2987`. Product create `92:2323` has no saved full-frame PNG; its geometry follows the owner's explicitly confirmed shared parameters and the existing source form controls. That boundary is reported rather than claiming an unavailable screenshot comparison.

The tablet category dropdown is 224×140 at x388/y476: an 8-pixel gap after the 44-pixel field. Its mobile placement is unchanged.
