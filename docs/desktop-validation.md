# Desktop validation — Stage 3

Historical Stage 3 snapshot: Desktop was subsequently owner-approved together with Mobile/Tablet. The local/unpublished statements below describe that earlier checkpoint. Current demo, documentation and publication verification is recorded in [final validation](demo-validation.md).

Date: 14 November 2026. Technical result: **DESKTOP PASS**, ready for owner acceptance. Mobile and Tablet are owner-approved. Tablet is recorded in the single local commit `a198620c2970560a6dac5e0be9be62d996c85a31` (`feat: implement responsive tablet layout`). Its parent/published Mobile commit remains `3541e1d1ba03db3969e4cac90927c5ecd15b67ad`. Desktop changes are local and unstaged; there is no Desktop commit, push or deployment.

## Scope and references

All six pages share the existing React components and CSS Modules. Desktop adds a permanent Sidebar, header logout, source table widths, a two-panel Dashboard, a two-column Login composition and exact product/supplier dialog geometry. Customers keeps its original five columns, with the owner-approved Edit button in User Info. API transport, DTOs, schemas, precision, nullable supplier saves and customer PATCH rules are unchanged.

All ten Desktop frames listed in [design measurements](desktop-design.md) have original reference images. Figma MCP remained unavailable because of its Starter quota; existing exact properties and new read-only SVG/PNG exports from the original Figma UI supplied the missing evidence. Source SVG rectangle/separator coordinates established precise dimensions. Original files and visual comparisons are stored outside Git.

Side-by-side images and 50% overlays were produced at 1440×800 for six pages and four product/supplier dialogs. Original 2× PNGs were normalized to the same display dimensions. Geometry, type, spacing, colors and original icons were inspected. Differences corrected include Desktop column widths, Add Product's 412-pixel height, supplier dialogs' 4-pixel offset, the finance header/Today layout and the final 10 pixels of recent-table separators.

The screenshots use intercepted synthetic API data. Names, emails, avatars, amounts, statuses, pagination counts and approved feature additions differ from Figma example data. Native date controls follow the browser locale. Full-image diff percentages therefore include content and rasterization differences and are not a pixel-perfect score. No claim of identical production/Figma data or universal pixel equality is made.

## Responsive and visual regression

- Mobile: 320, 340, 360, 375, 376, 390, 425, 500, 600 and 767 pixels; fluid through 375, then bounded at 375.
- Tablet: 768, 820, 1024, 1280 and 1439 pixels; centered shell768/content704.
- Desktop: 1440, 1441, 1536, 1600 and 1920 pixels; centered shell1440/content1280, Sidebar80.
- Additional form checks use a 440-pixel viewport height, including Desktop.
- Crossing 1439/1440 closes the native menu, exposes the Sidebar and preserves an open form's unsubmitted values.
- No page overflow was observed. Desktop tables fit all original columns, with no horizontal range control; narrow tables still scroll inside their own panels.

Ninety-six before/after screenshots compare all six pages across twelve Mobile/Tablet widths plus navigation, statistics and record forms at 375, 768 and 1439. Data, viewport, device scale, reduced motion, fonts and decoded images are identical. Result: 96 equal pairs, zero changed pixels. This is a regression check against the accepted versions, not a new request for their acceptance.

## Functional and semantic checks

The shared functional suite runs at Mobile, Tablet and Desktop sizes: route protection; login validation and visibility; session restore, expiry and 401 invalidation; logout; aliases/navigation; totals/30-day periods; search, supported sorting and pagination; synthetic product create/edit/delete; supplier create/edit with preserved null EUR; customer creation, details/history and minimal PATCH; field/server validation, loading, empty, retry, conflict and pending/duplicate-submit handling.

Desktop-specific checks cover the permanent Sidebar and active links, keyboard navigation, source geometry at wider sizes, five customer columns with accessible inline Edit, source form/dropdown coordinates, modal focus isolation and return, Escape, and responsive transition behavior. Existing Tablet selectors were made explicit where the hidden Desktop logout introduced a second header button; assertions were not removed. Old 1440-pixel Tablet expectations moved to the actual 1439-pixel Tablet boundary, while 1440 and wider have dedicated Desktop checks.

Markup checks include one main/h1, labeled inputs, scoped table headers and sections, unique IDs, real navigation links and buttons, no nested interactive elements and no placeholder action links. Native dialogs keep background controls inert. No application errors or React nesting/key warnings were observed. This is not a complete assistive-technology or WCAG AA contrast audit; the approved source palette remains unchanged.

## Technical verification

Final verification: TypeScript PASS; ESLint PASS; 39 unit tests PASS; all 88 browser tests PASS, with seven additional Desktop rechecks after the final trigger/icon sizing correction; production build PASS. The final built application was checked on preview across all six pages and three creation dialogs, including the original 177×42 product trigger and its non-shrinking 42×42 icon. No application errors or non-GET requests occurred in that preview check. Build output: CSS25.17kB/gzip5.80 and JS380.22kB/gzip120.67. Dependency audit found zero vulnerabilities; dependencies and lockfile are unchanged. All domain mutations are intercepted synthetic requests, with no production fallthrough. Production credentials are not used by automated tests.

Repository scans found no potential secrets, original domain JSON datasets or service files. Build/test output and original reference exports remain excluded from Git. Backend code, Render, MongoDB and production data were not changed. No external deployment, PR or new resource was created.
