# Spurs Business

Spurs Business is a first-party Spurs app. Sign-in uses the shared `spurs_session`
cookie through `@spurs-cloud/accounts`; it does not use a separate OAuth client,
Auth.js, or an OAuth callback route.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `SPURS_SESSION_SECRET` to the shared session-signing secret configured by
   Spurs Accounts. Keep it server-side and never commit it.
4. Set `APP_URL` to the exact public origin used to open this app, including its
   port in development. The SDK uses it to send signed-out users back to the
   correct host after sign-in.
5. Run `npm run dev`.

The app runs at `http://localhost:3000` by default. When testing shared sessions
locally, use the same hostname (`localhost` or `127.0.0.1`) for Accounts and
every first-party app; session cookies are host-scoped. In production, configure
Accounts to issue the shared cookie for the Spurs app domain (for example,
`.spurs.com.ng`).

`SPURS_ISSUER` is optional and only overrides the SDK's built-in production
Accounts URL for local development or staging.

## Sign-in behavior

- The home page and `/signin` are public.
- `/dashboard`, `/onboarding`, `/workspaces`, `/w`, and `/api/workspaces` routes
  are guarded by the SDK's Next.js 16 `proxy` integration.
- Signed-out users are redirected to Spurs Accounts and returned to the
  requested app URL after signing in.
- The signed-in home page reads the shared session server-side and shows the
  user's name and the shared Spurs account menu. Sign-out clears the shared
  Spurs session.

Do not pass the session secret to client components or mint session tokens in
this app. For the Accounts integration details, see the
[`@spurs-cloud/accounts` SDK README](https://github.com/officialdevstack-maker/spurs-account-js-sdk).
