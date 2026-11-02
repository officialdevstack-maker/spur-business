# Spurs Business

Spurs Business is a first-party Spurs app. Sign-in uses the shared `spurs_session`
cookie through `@spurs-cloud/accounts`; it does not use a separate OAuth client,
Auth.js, or an OAuth callback route.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` to this app's dedicated PostgreSQL/Neon database and run
   `npm run db:migrate` to apply pending SQL migrations from `db/migrations/`.
4. Apply `../wallet/drizzle/0001_workspace_wallet_accounts.sql` to the Spurs Wallet
   database before using VTU workspace wallets.
5. Set `SPURS_WALLET_URL` and `INTERNAL_API_SECRET` so Business can call the
   internal Spurs Wallet API. Keep the shared secret server-side.
6. Set `VTU_INTERNAL_API_SECRET` in Business and the matching
   `BUSINESS_INTERNAL_API_SECRET` in VTU. Workspace VTU base URLs are stored
   per workspace in the Business database, not in an environment variable.
   Register a trusted HTTPS VTU host through the internal
   `POST /api/internal/vtu-hosts` endpoint, then assign its URL to a workspace
   with `PUT /api/internal/workspaces/:workspaceId/vtu-integration`. Both accept
   a JSON `baseUrl`. These platform-only endpoints require a bearer token
   configured by `INTERNAL_API_KEY`.
   Only URLs whose exact host is allowlisted can receive the VTU internal
   secret.
7. Set `SPURS_SESSION_SECRET` to the shared session-signing secret configured by
   Spurs Accounts. Keep it server-side and never commit it.
8. Set `APP_URL` to the exact public origin used to open this app, including its
   port in development. The SDK uses it to send signed-out users back to the
   correct host after sign-in.
9. Run `npm run dev`.

The app runs at `http://localhost:3000` by default. When testing shared sessions
locally, use the same hostname (`localhost` or `127.0.0.1`) for Accounts and
every first-party app; session cookies are host-scoped. In production, configure
Accounts to issue the shared cookie for the Spurs app domain (for example,
`.spurs.com.ng`).

`SPURS_ISSUER` is optional and only overrides the SDK's built-in production
Accounts URL for local development or staging.

## Sign-in behavior

- The home page and `/signin` are public.
- `/workspaces`, `/w`, and `/api/workspaces` routes are guarded by the SDK's
  Next.js 16 `proxy` integration.
- Signed-out users are redirected to Spurs Accounts and returned to the
  requested app URL after signing in.
- The signed-in home page sends users with no workspaces to `/workspaces/new`,
  users with one workspace to `/w/<id>`, and users with multiple workspaces to
  `/workspaces`. Sign-in returns to `/` so the same routing applies after login.
- The public home page explains the VTU and school offerings and links to sign-in.
- Workspace API and page actions read and authorize the shared session on the
  server. Workspace data is stored in this app's own database; the owner limit
  is serialized and enforced in a database transaction.
- VTU workspaces are third-party operated by default. Only trusted Spurs
  internal services can change the operator type. Business customers are linked
  by shared Spurs user ID, one relationship per workspace; this does not grant
  the business control over a customer's personal wallet. Business wallet
  funding transfers from a workspace member's personal Spurs Wallet into a
  separate workspace account. Workspace members can manage workspace VTU
  resources; platform-wide settings remain Spurs-managed.

Do not pass the session secret to client components or mint session tokens in
this app. For the Accounts integration details, see the
[`@spurs-cloud/accounts` SDK README](https://github.com/officialdevstack-maker/spurs-account-js-sdk).

## Workspaces

The authenticated workspace picker is at `/workspaces`. Users can create VTU
or school workspaces, with a maximum of five owned workspaces. School workspace
slugs are generated from the name and kept unique in the Business database.
