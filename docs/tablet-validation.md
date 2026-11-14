# Tablet validation — Stage 2

Date: 14 November 2026. Technical result: **TABLET PASS**, ready for owner acceptance. Tablet changes remain local, unstaged and uncommitted. Desktop is not implemented.

## Publication and scope

The accepted Mobile baseline was published to `AvalianY/admin_dashboard_front`, branch `main`, in the single authorized commit `3541e1d1ba03db3969e4cac90927c5ecd15b67ad` (`feat: implement mobile E-Pharmacy dashboard`). Local HEAD, `origin/main`, and GitHub's advertised main SHA match. All 60 source files were independently confirmed through the GitHub tree API. The working tree was clean immediately after publication.

All six existing React pages now support the tablet layout: Login, Dashboard, Orders, Products, Suppliers and Customers. Shared Header, menu, cards, tables, forms, dialogs, search, pagination and loading/error/empty states are reused. API serialization, validation, session handling and data models are unchanged. No dependencies were added.

## Responsive measurements

| Viewport width | Composition | Content | Outer left space |
| -------------: | ----------: | ------: | ---------------: |
|            320 |         320 |     280 |                0 |
|            375 |         375 |     335 |                0 |
|            390 |         375 |     335 |              7.5 |
|            425 |         375 |     335 |               25 |
|            767 |         375 |     335 |              196 |
|            768 |         768 |     704 |                0 |
|            820 |         768 |     704 |               26 |
|           1024 |         768 |     704 |              128 |
|           1280 |         768 |     704 |              256 |
|           1439 |         768 |     704 |            335.5 |
|           1440 |         768 |     704 |              336 |

Additional mobile regression widths: 340, 360, 376, 500 and 600. All checked pages have zero horizontal page overflow. Wide tables scroll inside their own viewport, including with keyboard Home/End. At 1440 the layout remains the bounded tablet composition; no desktop breakpoint was enabled. Dialog checks also use a 440-pixel viewport height.

## Design references and comparisons

The seven high-fidelity contexts and all measured geometry are listed in [tablet design](tablet-design.md). Reference frames: Login `92:1412`; Dashboard `1:187`; menu `1459:389`; Orders `1:414`; Products `5:1648`; Suppliers `8:2908`; Customers `8:3919`. All use width 768; Dashboard is 1332 high, the other frames 1024.

Product/supplier forms use original saved PNG references and owner-confirmed parameters, **not a new MCP response**. The Starter quota was exhausted. Direct original PNG comparisons cover product edit `92:2480`, supplier create `92:2812`, supplier edit `92:2987`. Product create `92:2323` has no saved full-frame PNG and was checked against the owner's explicit common geometry and the approved original form controls. The four scrolled list duplicates (`5:805`, `8:2135`, `8:3160`, `9:4133`) add scroll positions rather than new viewport widths; complete columns are supplied by the main high-fidelity contexts and exercised through actual scrolling.

Twenty-two tablet screenshots include all six pages, menu, all statistics dialogs, each list at its horizontal endpoint, six record forms, customer details and the open product category list. Ten original-reference overlays were produced and visually inspected. Whole-screen differences include synthetic records/photos, actual dynamic counters, approved customer actions and category rules, localized native dates, and browser font/PNG antialiasing. These are not represented as a zero-difference Pixel Perfect result. References and screenshots stay outside Git.

Corrected findings include Header spacing introduced by the responsive image source, Login decoration opacity already embedded in the original PNG, the recent-customer header height, supplier statistics icon, tablet badge typography, form field reading order and tablet edit titles/buttons. Table sizes and positions match the measured references: panels at x32/y194, 960×502; recent customers at x32/y248, 704×512; finance at x32/y780, 704×512; all product/supplier forms at x116/y316, 536×392.

## Mobile preservation

Thirty fresh before/after screenshots compare all six pages at 320, 375, 390, 425 and 767 pixels. All thirty have equal dimensions and **zero different pixels**. Existing mobile form geometry, texts, validation, numeric-only supplier amounts and historical-caption removal remain covered by browser regression tests. The source SVG sprite, font and existing mobile image files are unchanged.

## Technical and functional checks

| Check                                                    | Result                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------- |
| TypeScript                                               | PASS                                                          |
| ESLint                                                   | PASS                                                          |
| Unit tests                                               | 39 PASS                                                       |
| Complete browser run before the final targeted additions | 71 PASS                                                       |
| Final tablet geometry, semantics, forms and resize run   | 8 PASS, including one new resize scenario                     |
| Distinct browser scenarios verified across those runs    | 72                                                            |
| Production build                                         | PASS                                                          |
| Built preview at 768×1024                                | All six pages PASS; no overflow or console errors             |
| Preview JS/CSS                                           | HTTP 200 and byte-identical to build output                   |
| npm audit                                                | 0 vulnerabilities                                             |
| Three added image optimizations                          | Zero different decoded RGBA channels before/after compression |
| Original provided assets                                 | Unchanged hashes                                              |

The final targeted run follows the last tablet styling correction; previous passing functional and mobile scenarios were preserved. No tests were skipped, disabled, or weakened to bypass an application failure. A Chrome-native transition to browser chrome reports `activeElement=body`; the modal tests permit that browser state while rejecting focus on inert background application controls, and verify Escape/focus return. Product tab order follows the visual grid and switching between 767/768 preserves entered values.

Functional coverage includes login, invalid/expired sessions, restoration, logout, navigation and aliases; Dashboard totals/periods/unknown values; supported server search/sort before local pagination; customer server pagination; mock-only product create/edit/delete, supplier create/edit and customer create/profile PATCH; validation and server field errors; loading, empty, retry, conflict and duplicate-submit protection; dialogs, selects and native dates. The additional functional project starts at 768×1024; one existing short-viewport scenario explicitly switches to 320×440.

Semantic checks cover headings, labeled native fields, semantic tables with scoped headers, unique IDs, real links/buttons, lack of nested interactive elements and placeholder links, keyboard navigation, modal focus and Escape. No React nesting/key warnings or application console errors were observed. The pre-existing approved palette contrast limits remain unchanged; this is not a claim of WCAG AA color-contrast compliance.

## API and environment boundaries

All automated domain writes use intercepted synthetic responses. No production CRUD, credentials access, backend code/configuration change, MongoDB operation, Render operation or frontend deployment occurred. The accepted backend's local OpenAPI still defines all 16 operations including customer POST. An optional fresh public OpenAPI read timed out in Node and in the Windows HTTP client; therefore this stage does not claim a successful new live API acceptance or infer that the endpoint is absent. The previously verified contract remains unchanged.

Tablet work has not been added to staging, committed or pushed. Its acceptance and publication require the owner's next instruction. Desktop requires separate approval, high-fidelity desktop references and corresponding validation; no desktop composition was started.
