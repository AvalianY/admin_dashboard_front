# E-Pharmacy frontend

Mobile and tablet administration application built from the approved E-Pharmacy Figma design and the existing backend contract. Stage 1 Mobile is owner-approved and published as `3541e1d1ba03db3969e4cac90927c5ecd15b67ad`. Mobile is fluid from 320 to 375 pixels; from 376 through 767 pixels its shared shell stays centered at 375 pixels, with 335 pixels of content and 20-pixel gutters. At 768 pixels the tablet layout uses a centered 768-pixel maximum shell and 704-pixel content with 32-pixel gutters. Wider viewports retain this bounded tablet layout. Stage 2 Tablet is local for owner acceptance; Desktop is a separate stage and is not enabled.

## Run locally

Use Node.js 26.13.x and npm, with Google Chrome installed for browser tests.

```sh
npm ci
npm run dev
```

Open [the local application](http://127.0.0.1:5173). No account or password is included in this repository.

The application requests relative `/api` URLs. Vite forwards them to the fixed [public backend](https://e-pharmacy-api-kz62.onrender.com), removes the local Origin header upstream, and retains HTTPS verification and Bearer authentication. Both development and preview servers bind to loopback and reject unrelated origins and hosts. The backend CORS policy is unchanged. No frontend hosting configuration or deployment is included.

Only `VITE_API_BASE_URL=/api` is supported. The non-secret example is in `.env.example`; no environment file is necessary for the default local setup.

## Pages and behavior

| Route        | Functionality                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `/login`     | Login, validation, password visibility, current-session expiry                                              |
| `/dashboard` | Overall counters, last-30-day dialog on each counter, recent customers, today's confirmed financial records |
| `/orders`    | Read-only list, supported server search/sort, local pagination                                              |
| `/products`  | Search/sort, pagination, create, edit, confirmed logical deletion                                           |
| `/suppliers` | Search, pagination, create, edit, preserved unknown EUR and legacy BDT                                      |
| `/customers` | Server pagination, search, create, profile edit, details and confirmed history                              |

`/` redirects according to authentication. `/home` and `/dasboard` are compatibility redirects. Administrative routes require a verified session.

## Architecture

- React, TypeScript, Vite, React Router and CSS Modules.
- React Hook Form and Yup for forms; Fetch API for transport.
- `src/app`: routing, layout and session provider.
- `src/pages`: six shared mobile/tablet pages and their CSS Modules.
- `src/components`: shared controls, tables, record forms and dialogs.
- `src/services`: API errors, validation, session persistence and explicit payload whitelists.
- `src/hooks`: abortable reads with explicit retry.
- `src/types` and `src/utils`: API types and precision-preserving formatting.
- `public`: local fonts, original-design images and the SVG sprite.
- `tests`: unit/contract checks and browser acceptance using synthetic intercepted API responses.

There is no global data cache, additional state library, UI kit or icon dependency. Page reads are refreshed after successful mutations and when revisiting Dashboard. Effects abort obsolete reads; writes are never automatically retried.

## Data rules

- Page size is five. Customers send `page` and `limit=5`; other lists paginate the complete supported API response after server filtering/sorting.
- Technical MongoDB identifiers identify rows and requests. Legacy duplicates remain separate.
- Existing `Heart`/`Leg` products may retain their current category or move to an approved category. New products use the nine approved categories.
- Money remains an exact decimal string. The interface never uses floating-point conversion for money or converts BDT to EUR. The Suppliers Amount cell shows only the formatted number: known EUR amount first, otherwise legacy BDT amount, otherwise —. This display fallback does not populate the EUR edit field or change nullable PUT behavior.
- Unknown source values and completeness metadata remain unchanged in the API client. Historical/completeness explanations are omitted throughout the interface; absent financial records and history use `—`.
- Dashboard totals and last-30-day values are separate. In the statistics dialogs only, null Products/Suppliers values display `0` by owner approval; Customers uses its actual API value (or `—` if unknown). The source nulls remain intact and no additional statistics requests are made. The dialog retains the actual API UTC period when available.
- Customer PATCH sends only changed profile fields. Creation cannot submit IDs, registration dates, spending, photos or provenance.
- Orders and customer history are read-only. The application creates no artificial customer/order relationships.
- Sessions are stored in `sessionStorage`, restored through `user-info`, and removed on expiry, 401 or logout. Passwords are not persisted. There is no refresh endpoint or mechanism.

## Backend integration

[Swagger UI](https://e-pharmacy-api-kz62.onrender.com/api-docs/) · [OpenAPI](https://e-pharmacy-api-kz62.onrender.com/api-docs/openapi.json) · [Backend repository](https://github.com/AvalianY/admin_dashboard_back)

| Resource  | Supported operations                                                                              |
| --------- | ------------------------------------------------------------------------------------------------- |
| Session   | `POST /api/user/login`, `GET /api/user/user-info`, `GET /api/user/logout`                         |
| Dashboard | `GET /api/dashboard`                                                                              |
| Products  | `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`    |
| Suppliers | `GET /api/suppliers`, `POST /api/suppliers`, `PUT /api/suppliers/:id`                             |
| Customers | `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`, `PATCH /api/customers/:id` |
| Orders    | `GET /api/orders`                                                                                 |

The published specification was checked to contain all 16 operations. Production reads and authentication were verified independently. Automated domain writes are tested only against an intercepted synthetic API, never the production database. Normal manual form submission uses the configured real API.

## Validation

```sh
npm run check
npm run test:e2e
npm audit
npm run preview
```

`check` runs TypeScript, ESLint, Vitest and the production build. Playwright uses installed Chrome and intercepted synthetic API responses. The regression project covers mobile, intermediate and bounded tablet layouts; `tablet-flows` repeats functional acceptance at 768×1024, including authentication, CRUD contracts, validation and error states. Dialog checks include a 440-pixel viewport height. Tests do not need production credentials. Preview serves the built application at [127.0.0.1:4173](http://127.0.0.1:4173).

See [asset optimization](docs/assets.md), [mobile validation](docs/mobile-validation.md), [tablet measurements](docs/tablet-design.md) and [tablet validation](docs/tablet-validation.md) for measured results and limits. Inter is distributed with its [SIL Open Font License](public/fonts/OFL.txt).

## Design reference

[E-Pharmacy Figma](https://www.figma.com/design/LR5cz3qeCp376CAmDIFu4z/Admin-dashboard--Copy-)

The approved product filter, customer creation/editing, historical-data states and 30-day dialog extend the static mobile frames without adding unrelated functionality. Original reference assets and comparison screenshots are retained outside this repository.
