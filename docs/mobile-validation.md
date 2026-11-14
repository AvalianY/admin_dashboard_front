# Mobile validation — Stage 1

Date: 14 November 2026. Scope: mobile only, fluid at 320–375 CSS pixels and centered at a maximum of 375 pixels above that range, including 768 pixels and wider until Tablet is separately implemented. No Git staging, commit, push or deployment is part of this stage.

## Automated validation

| Check                                             | Result               |
| ------------------------------------------------- | -------------------- |
| TypeScript                                        | PASS                 |
| ESLint                                            | PASS                 |
| Vitest                                            | 39 tests PASS        |
| Playwright / installed Chrome                     | 54 scenarios PASS    |
| Production build                                  | PASS                 |
| Dependency audit                                  | 0 vulnerabilities    |
| Application console during visual and live checks | 0 errors, 0 warnings |

The browser scenarios exercise all six pages at 320/340/360/375/376/390/425/500/600/767/768/1440 pixels; every create/edit record form is also checked at those widths with a 440-pixel viewport height. Page overflow is absent, tables scroll within their own viewport, and dialog contents/actions remain reachable.

Unit tests cover API response/error contracts, 204, aborts, exact decimal preservation, validation boundaries, legacy category rules, nullable amounts, request whitelists, changed-fields-only PATCH, session expiry, pagination and every Icon-to-symbol reference.

Browser scenarios cover protected routes, login, session restoration and revocation, aliases, navigation, search/sort/page reset, client/server pagination, all approved domain writes against mocks, details/history, unknown values, server validation, conflict reload, loading/empty/error states, modal focus/Escape/cancel and duplicate-submit prevention.

## Figma comparison

All eleven original frames were downloaded and compared with actual Chrome screenshots at 375 pixels. Overlay PNGs and geometry measurements are kept outside Git. Full-image pixel differences include deliberately synthetic records and are not used as a misleading pass threshold.

| Screen                       | Figma node | Geometry and static design checks                                                                              |
| ---------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| Login                        | `92:3297`  | 375×812; brand, headline, 95×93 pill, 44-pixel inputs/button, decoration and spacing checked                   |
| Dashboard                    | `20:6602`  | 80-pixel header; 98-pixel counters; recent panel at y336; finance panel at y864; source panel heights retained |
| Mobile menu                  | `1459:719` | 78-pixel sidebar, 38-pixel navigation controls, original active icons, close/logout placement checked          |
| Orders                       | `22:7229`  | 215/8/112 filter row, panel y184, 460-pixel table, original column order and pagination checked                |
| Products                     | `22:7762`  | Approved filter addition; 42-pixel add control, panel y244, original columns and actions checked               |
| Product create               | `92:3967`  | 335×484; padding, 44-pixel fields, 14-pixel gaps, action row and close checked                                 |
| Product edit / category list | `92:4120`  | Same geometry; green field borders, open 140-pixel dropdown, reversed chevron and Save checked                 |
| Suppliers                    | `23:8886`  | Filter, 177×44 add control, y244 panel, original columns and Edit action checked                               |
| Supplier create              | `92:4438`  | 335×542; six fields, native calendar, action row and close checked                                             |
| Supplier edit                | `92:4585`  | Original edit borders; Add label retained while submitting PUT                                                 |
| Customers                    | `25:9915`  | Original table composition; approved Add Customers, corrected Address column and additional edit action        |

Corrected comparison findings include the symbol-ID prefix, page titles, the header's distinct original logo, unnecessary product avatars, column ordering/spacing, table clipping, edit borders, dropdown state and persistent scrollbar appearance. The scrollbar uses a native range control synchronized with actual horizontal table position; its 180/335 thumb proportion matches Figma and works with pointer/keyboard input. A fitting table has the control disabled rather than inventing hidden columns.

Expected differences from static example screenshots:

- Real or synthetic API values, photos, row counts, page counts, currencies and dates differ from the Figma examples.
- Products use the approved filter row. Customers have their approved creation/edit/history functions and correct Address label.
- The category list follows approved backend choices; prohibited legacy category transitions are absent.
- Historical/completeness explanations are removed from all pages and dialogs per owner approval. Source nulls remain unchanged; only Last30Days Products/Suppliers nulls display0. Customers retains its actual value. Empty financial/history views use a single —.
- Native calendar text follows the browser locale. Password visibility, focus/error/loading/empty states and confirmations follow approved additions.
- Identical font family/weight/size/line height does not imply identical Figma/browser glyph antialiasing. No exact zero-difference claim is made for whole screens.

## Independent public HTTPS verification

The built application was tested through its local preview proxy; direct HTTPS GETs independently checked the public server. Credentials were read from the existing Windows Credential Manager entry, used only in memory and never written into this repository or reports.

| Check                                                 | Result                                       |
| ----------------------------------------------------- | -------------------------------------------- |
| Root HTTPS response                                   | 404, expected                                |
| Published OpenAPI                                     | 16 operations, including customer POST       |
| Login from production build                           | 200                                          |
| `user-info`, Dashboard and all four lists             | 200                                          |
| Customer details/history endpoint                     | 200                                          |
| Products / Suppliers / Customers / Orders             | 60 / 5 / 88 / 25                             |
| Dashboard totals                                      | 60 / 5 / 88                                  |
| Recent customers                                      | 5                                            |
| Last 30 days                                          | API: null / null / 0; current approved display: 0 / 0 / 0      |
| Today's financial records                             | unavailable, preserved as unknown            |
| UTC 30-day interval returned on the verification date | 2026-10-16 inclusive to 2026-11-15 exclusive |
| All four built list pages                             | 5 visible rows each, no page overflow        |
| Built session restoration                             | PASS                                         |
| Logout and subsequent old-token `user-info`           | local session removed; server returns 401    |
| Production domain writes                              | 0                                            |

The read-only run completed with 22 checks passing, zero blocked/forbidden requests and zero application console errors/warnings. Temporary verification sessions were revoked, including cleanup after interrupted verification attempts. No account credentials were changed. Current counts match the approved baseline; a frontend GET cannot independently attest the Atlas database name or BSON identity.

The local proxy was also checked without Origin and with its approved local Origin (401 Bearer challenge when unauthenticated) and with an unrelated Origin (403). Production backend CORS was not altered.

## Semantics and accessibility

Native headings, forms, labels, buttons, navigation links and tables are used. Icon-only controls have accessible names; decorative images/icons are hidden appropriately. Native dialogs provide modal focus isolation, Escape behavior and focus return. Custom selects support keyboard navigation and expose combobox/listbox state. Native dates retain ISO API values. Loaders honor reduced motion. There are no clickable divs, placeholder anchors, nested interactive elements, duplicate IDs or unlabeled fields in the checked views. No React nesting/key warnings were observed.

The approved palette includes contrast limits: white on the accent is approximately 2.63:1; muted text on white is approximately 2.46:1. Colors remain unchanged, so this is not a claim of WCAG AA color-contrast compliance.

## Verification boundaries

- Domain create/update/delete tests use synthetic mock API responses. They are not represented as live production writes or a local-backend integration test.
- The real production customer POST is published; its existence is checked through OpenAPI. It was not called during frontend verification.
- No separate local backend or database was started or changed.
- Chrome viewport and short-height emulation were tested. Physical Android/iOS, mobile Safari and an actual operating-system soft keyboard were unavailable.
- No Tablet/Desktop implementation, frontend deployment, backend change or cloud configuration change was performed.

Mobile implementation is ready for owner review. Tablet work requires separate approval after that review.

## User acceptance corrections

One shared CSS Modules shell now caps the composition at 375 pixels. Existing page gutters preserve content width at 335 pixels. The navigation and skip link follow the centered shell, including when a normal browser scrollbar reserves space. Range thumbs use the control width rather than viewport width. Dialogs retain their existing maximum of 335 pixels and center correctly. No tablet/desktop media query or scale transform was introduced.

Measured for all six pages:

| Viewport | Composition | Content | Outer left space |
| ---: | ---: | ---: | ---: |
| 320 | 320 | 280 | 0 |
| 340 | 340 | 300 | 0 |
| 360 | 360 | 320 | 0 |
| 375 | 375 | 335 | 0 |
| 376 | 375 | 335 | 0.5 |
| 390 | 375 | 335 | 7.5 |
| 425 | 375 | 335 | 25 |
| 500 | 375 | 335 | 62.5 |
| 600 | 375 | 335 | 112.5 |
| 767 | 375 | 335 | 196 |
| 768 | 375 | 335 | 196.5 |
| 1440 | 375 | 335 | 532.5 |

All eleven 375-pixel screenshots were repeated against the original Figma references and the previous accepted implementation. Before/after screenshots are pixel-identical. All eleven states were additionally captured at 320 and 425 pixels. Cropped 425-pixel captures preserve the 375-pixel composition; minor rasterization channel differences are at most 3/255, with unchanged DOM dimensions.

The preview HTML, JS and CSS matched the current build byte-for-byte. Real authentication through port4173 passed, including user-info, Dashboard, protected pages, session restoration and logout/revocation. No production domain writes or credential changes were performed. Credential delivery uses the system clipboard separately and does not put secrets into project files or this document.

## Supplier amount and historical-footnote correction

The Suppliers Amount cell contains one numeric line only, without currency labels, symbols or a Legacy subline. Known EUR amount takes precedence; when it is null, legacyMoney.amount is displayed without conversion. Both missing values produce —. Zero is preserved as a known value. Existing numeric formatting, the 88-pixel column, 74-pixel rows and Inter12/14 medium type are retained. The edit form and PUT payload still use only the EUR amount; a legacy-only record keeps an empty EUR field and amount:null.

Generic historical footnotes and their own margins are absent from Suppliers, Orders and Customers, including the repeated footnote in customer details. Actual unknown-value/history states and API completeness metadata remain intact. During that supplier-specific correction, Dashboard and Products were not changed. Seven additional browser scenarios cover the display rules, one-line geometry, unchanged source records, footnote removal and nullable PUT semantics using mocks.

## Dashboard explanatory-copy and statistics correction

The shared Completeness UI component, all its calls (including Products), its unused import and its margin/style are removed. API completeness metadata and types remain intact. Dashboard and its three Last30Days dialogs have no historical/unconfirmed-data paragraphs. Customer history also has no such explanation. Financial records/history that are absent use only —; real data, headings, loading/error states and form validation remain.

Last30Days null Products and Suppliers display0 only in their dialogs. The Customers value is taken directly from the API; a real0 stays0, a nonzero value stays unchanged, and null remains —. Missing/loading data is not converted to0. The response, model and overall totals are unchanged, no extra requests are made, and a real UTC period is retained when provided.

Eight additional browser scenarios cover the six requested widths, all three dialogs, all pages (including partial Products metadata), record modals, nonzero statistics, retained financial rows, nullable Customers and absence of captions/empty containers. A new API contract test confirms that source nulls and completeness metadata are preserved. Current automated totals are39 unit tests and54 browser scenarios. These corrections use mocks and local preview assets; prior public-HTTPS results above refer to the earlier read-only verification.
