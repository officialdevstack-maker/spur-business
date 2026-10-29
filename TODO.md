<!-- business/TODO.md -->
# Spurs Business — TODO

Business accounts for Spurs. Users sign in with their Spurs identity, then create a business workspace (currently VTU or school). Schools get a site at `schools.yourdomain.com/<slug>`.

## Implemented
- [x] First-party Spurs sign-in using the shared Accounts session (SDK)
- [x] Workspace API, picker, and create form
- [x] Business-owned schema for `workspaces` and `workspace_members`
- [x] Creator is added as workspace owner
- [x] Limit of 5 owned workspaces, serialized and enforced in the database transaction
- [x] Basic member-only workspace overview and Pay identity status
- [x] Read-only team roster showing member ids and roles
- [x] Unique school workspace slugs
- [x] Route signed-in users from the home page based on their workspaces

## Verify first
- [ ] Configure `SPURS_SESSION_SECRET` and `APP_URL` from `.env.example`
- [ ] Configure `SCHOOLS_BASE_URL` for the separate schools app
- [ ] Confirm Accounts issues the shared cookie for the local hostname and production Spurs app domain
- [ ] Run `npm run db:migrate` against the Neon/PostgreSQL database
- [ ] Set `DATABASE_URL` to the Business app's dedicated PostgreSQL/Neon database
- [ ] End-to-end test: sign in, create VTU and school workspaces, reload, switch, sign out

## Workspace dashboard follow-up
- [x] Add VTU and school workspace-specific navigation and overview pages
- [x] Show the school URL derived from `SCHOOLS_BASE_URL/<slug>`
- [ ] Keep reserved school slugs in sync with routes on the separate schools app
- [x] Add the read-only settings page for workspace name and Pay identity status

## Pay identity (created by admin)
- [ ] Internal API in this app for admin to set/clear `pay_identity_id` (service-to-service auth, not user sessions)
- [ ] Admin screen in `admin/` to list businesses and create their Pay identity (calls Pay, then the internal API above)
- [ ] Decide what a business can't do until its Pay identity exists (e.g. wallet, funding, bulk purchases)
- [ ] Notify the business when its Pay account becomes active
- [ ] Decide whether an admin can revoke or replace a Pay identity

## Next: team and roles
- [ ] Invite members by email or Spurs id
- [ ] Accept/decline invites
- [ ] Role management (owner, admin, member) and permission checks
- [ ] Remove member / leave workspace
- [ ] Transfer ownership

## Workspace settings
- [ ] Edit business name and profile (logo, phone, address) — slug stays fixed (settings page is read-only for now)
- [ ] Business verification (decide requirements with Accounts/admin)
- [ ] Delete or archive workspace

## VTU businesses
- [ ] Business wallet view (read via Wallet internal API)
- [ ] Fund wallet (via Pay)
- [ ] Bulk airtime/data purchase
- [ ] Reseller pricing and customer management
- [ ] Transaction history and export

## Schools
- [x] Decided: the school management site is a separate app
- [ ] Create the separate schools app at `schools.yourdomain.com/[slug]`, resolving the school from the slug
- [ ] Let the schools site verify a signed-in user is a member of that workspace (shared sign-in via Spurs Accounts plus a membership lookup against this app's API or database)
- [ ] Only show the school site link/open it for school workspaces whose Pay identity rules allow it (decide)
- [ ] Decide slug rules: slugs are permanent (renaming would break school URLs) unless redirects are added
- [ ] Keep `RESERVED_SLUGS` in sync with top-level routes on the schools site
- [ ] Student and class records
- [ ] Fee schedules and invoices
- [ ] Parent/student fee payments (via Pay)
- [ ] Payment reports and reconciliation

## Platform and quality
- [ ] Audit log for sensitive workspace actions
- [ ] Rate limiting on workspace creation
- [ ] Tests for slug generation, reserved slugs, membership checks, and server actions
- [ ] Error and empty states, loading UI
- [ ] Deployment config and production env checklist

## Open questions
- Does the 5-workspace limit count only owned workspaces (current behavior) or also ones the user is a member of?
- Should admins be able to raise the limit for a specific user?
- Which admin/ screens are needed to review or support business accounts?
- How should deleting a workspace affect its Pay identity and school site?