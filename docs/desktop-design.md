# Desktop design measurements — Stage 3

Source: [E-Pharmacy Figma](https://www.figma.com/design/LR5cz3qeCp376CAmDIFu4z/Admin-dashboard--Copy-) and Frontend!A5. Mobile and Tablet are owner-approved. This stage extends their shared components; API contracts, validation, data and save rules remain unchanged.

## Boundaries and owner decisions

- Frontend!A5 explicitly specifies breakpoints 768 and 1440 CSS pixels. Tablet ends at 1439; Desktop starts at 1440.
- The owner approved a centered Desktop shell with `max-width: 1440px`. At 1920 pixels its outside margins are 240 pixels each. Content retains its original coordinates inside that shell.
- Sidebar: 80 wide, below the 80-pixel header. Main content starts at x120 and ends at x1400: 1280 wide with a 40-pixel right gutter.
- Customers retains its five original Desktop columns. The owner approved putting the additional Edit action inside User Info. Mobile/Tablet keep their accepted separate action column.

## Original frames and exact measurements

| Frame         | Node      | Original size | Principal geometry                                                                                                                       |
| ------------- | --------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Login         | `82:503`  | 1440×800      | Brand x100/y28, 44; heading x100/y298,614×240,Inter60054/60; pill x516/y194,179×175; form x864/y307,323 wide; password y365; submit y449 |
| Dashboard     | `0:76`    | 1440×800      | Cards x120/380/640,y100,240×108,gap20; recent x120/y248,630×512; finance x770/y248,630×512                                               |
| Orders        | `0:288`   | 1440×800      | Search x120/y155,224×44; Filter x358/y155,116×44; table x120/y219,1280×502                                                               |
| Products      | `0:1262`  | 1440×800      | Same search/table; add x1223/y157,177×42 with 16 between icon and label                                                                  |
| Suppliers     | `0:440`   | 1440×800      | Same search/table; add x1204/y155,196×44                                                                                                 |
| Customers     | `0:960`   | 1440×800      | Same search/table; approved customer creation and inline Edit additions                                                                  |
| Add product   | `92:639`  | 1440×800      | Dialog x452/y194,536×412; padding40 with bottom60; inputs x492/724,y302/360/418; actions x492/633,y502,133×44                            |
| Edit product  | `92:825`  | 1440×800      | Dialog x452/y204,536×392; inputs y312/370/428; actions y512; category dropdown x724/y364,224×140                                         |
| Add supplier  | `92:1039` | 1440×800      | Dialog x452/y208,536×392; inputs y316/374/432; actions y516                                                                              |
| Edit supplier | `92:1215` | 1440×800      | Same supplier geometry; source edit title and Save action                                                                                |

Header: logo40×40 at x20/y18; title24/28 at x120/y15; breadcrumb12/18 at x120/y47; logout44×44 at x1356/y18. Sidebar links44×44 at x18/y119,177,235,293,351. Existing original sprite symbols provide default/active/hover imagery.

Table title64 high,18/24; header58 high,14/18; data rows76 high,16/18; cell horizontal padding20. Pagination starts at y741 with the existing 19.002-pixel controls and 8-pixel gap. Desktop tables fit their panel and do not need a horizontal slider.

| Table            | Column widths in source order           |
| ---------------- | --------------------------------------- |
| Recent customers | 223 / 269 / 138                         |
| Orders           | 285 / 218 / 191 / 232 / 184 / 170       |
| Products         | 296 / 230 / 199 / 226 / 163 / 166       |
| Suppliers        | 211 / 188 / 166 / 215 / 162 / 189 / 149 |
| Customers        | 280 / 299 / 213 / 263 / 225             |

Recent Customers vertical separators continue to y760, including the panel's final 10-pixel space. Finance's Today separator is at y370; subsequent separators are 65 pixels apart. These Desktop differences do not alter accepted Tablet styling.

## Evidence and shared behavior

Figma MCP's Starter quota remained exhausted. Existing exact frame properties and original PNGs were supplemented by read-only Figma UI exports of all ten Desktop SVGs and the missing PNGs. SVG geometry was read directly, including table separators and form rectangles; dimensions were not estimated from raster images. New PNG exports are 2×, normalized to the original 1440×800 display size for comparison. Sources and comparison artifacts remain outside Git. No Figma document was changed and no paid service was used.

Customer forms/details/history, deletion confirmation and statistics dialogs have no separate Desktop frames in the supplied design. They retain the previously approved shared visual system and functionality; they are not presented as additional exact Figma frames. All dialogs retain native modal focus, Escape, validation, pending/error states and short-viewport scrolling. The four product/supplier forms use exact Desktop properties, not an automatic copy of Tablet dimensions.

Existing original-design images and the sprite are reused. The 2× pill and header logo remain sharp at their original display sizes; the decorative export already includes source transparency. There are no new dependencies or duplicate forms/navigation business logic. CSS Modules contain the Desktop rules; JavaScript changes only the approved customer action structure and responsive menu behavior.
