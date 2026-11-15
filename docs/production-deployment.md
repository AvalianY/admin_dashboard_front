# Manual production deployment

The owner deploys both applications. Publishing Git commits does not deploy them. Keep automatic deployments disabled during this controlled rollout. The frontend has no confirmed public URL yet; public demo access remains inactive until the deployed server protection has passed live checks.

## Versions and order

1. The existing administrator must have `role: admin` before the protected backend is deployed. The addressed `user:admin-role` migration preserves the password and sessions; no seed or domain-data migration is required.
2. Manually deploy backend commit `5ad05f67cde62d8ef102a3e3bc4ec3542a92b2f7` on the existing Render service. Keep its existing credentials, database and Auto-Deploy setting. The backend remains `https://e-pharmacy-api-kz62.onrender.com`.
3. Import the existing `AvalianY/admin_dashboard_front` repository into a free Vercel project and manually deploy the reviewed `main` revision using the settings below. `git.deploymentEnabled: false` prevents push-triggered deployments; use the dashboard's Create Deployment action with the reviewed Git reference for manual releases. No provider-management automation is required.
4. Supply the actual HTTPS production URL for verification. If the backend rejects its forwarded browser `Origin`, the owner must add only that exact confirmed origin to the existing backend CORS allowlist, retaining the API origin used by Swagger. Do not use a wildcard, guessed domain or all preview deployments. The local Vite proxy's Origin removal does not describe Vercel's behavior.
5. Verify the deployed role contract, admin authentication and server write protection before running `user:init-demo`. Do not create or distribute demo credentials during deployment preparation.

## Vercel project settings

| Setting               | Value                                                   |
| --------------------- | ------------------------------------------------------- |
| Repository            | `AvalianY/admin_dashboard_front`                        |
| Production branch     | `main`                                                  |
| Automatic deployments | Disabled by `git.deploymentEnabled: false`               |
| Root directory        | Repository root (`./`)                                  |
| Framework preset      | Vite                                                    |
| Node.js               | `26.x`, consistent with `package.json`                  |
| Install command       | `npm ci`                                                |
| Build command         | `npm run build`                                         |
| Output directory      | `dist`                                                  |
| API base              | `/api` (the application default)                        |
| Environment variables | None required; optional public `VITE_API_BASE_URL=/api` |

Never copy backend `.env`, MongoDB credentials, `JWT_SECRET`, administrator credentials or demo passwords into Vercel/frontend variables. `VITE_*` values are public build inputs, not a secret store. Avoid project-level routing/header overrides that conflict with the reviewed `vercel.json`.

## Routing and authorization

`vercel.json` forwards `/api` and its descendants to the same paths on the fixed HTTPS Render backend. For example, `/api/products?page=2` goes to `https://e-pharmacy-api-kz62.onrender.com/api/products?page=2`. Methods, request bodies and the caller's Bearer Authorization header must pass through unchanged; no redirect sends the browser or its token to a different origin. No static Authorization header or proxy credential is configured. The backend remains responsible for authentication, roles and `DEMO_READ_ONLY`.

The API rule precedes SPA fallback. Fallback explicitly excludes the `/api` namespace, so an unknown API route must remain a backend JSON 404 rather than become `index.html`. Existing built assets are served by Vercel's filesystem routing; other application paths return `index.html` so React Router can restore deep links and enforce route protection. No Vercel Function or alternative API implementation is added.

The frontend already requests API data with `cache: "no-store"`. The API response headers add browser/shared-cache `no-store` policies and explicitly disable external-rewrite caching with `x-vercel-enable-rewrite-caching: 0`. This applies to the entire API namespace, including Login, user-info and errors, not only successful business reads. Static assets retain normal platform handling.

## Validation boundaries

Before publication: validate JSON against Vercel's published schema, check rewrite precedence/namespace handling, run TypeScript, ESLint, unit tests and the production build, and verify the existing browser regression suite. Use synthetic Bearer values for local transport tests. Do not test production writes or use real credentials in build logs.

After the owner deploys: verify the exact deployed revisions, HTTPS, Login, session restoration, authenticated proxy reads, query strings, pagination, logout, JSON errors, deep-link reloads, built assets and all three approved layouts at the actual public URL. Check that authenticated API responses have `no-store` and are not served as CDN HIT/STALE responses, and that Authorization reaches the backend. Source/schema/local checks do not prove Vercel's live behavior. Any CORS correction uses only the actual approved origin. Only then proceed with the separately gated demo initialization and live security acceptance.

## Platform references

- [Vercel rewrites and external-cache opt-out](https://vercel.com/docs/routing/rewrites)
- [Vercel configuration and SPA fallback](https://vercel.com/docs/project-configuration/vercel-json)
- [Cache-Control policies](https://vercel.com/docs/caching/cache-control-headers)
- [Node.js 26 build support](https://vercel.com/changelog/node-js-26-lts-is-now-generally-available-on-vercel)
- [Git deployment controls](https://vercel.com/docs/project-configuration/git-configuration)
- [Manual deployments by Git reference](https://vercel.com/changelog/manually-create-deployments-by-commit-or-branch-in-the-dashboard)

These settings prepare a manual deployment; they do not claim that a live frontend or a public demo account already exists.
