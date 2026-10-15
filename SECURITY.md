# Spectral Website — Security Notes

## Current trust model

Spectral is a static browser application with two intentionally different
persistence modes:

- **Local demo mode:** account, role, forum, friendship, and profile data live
  in `localStorage`. Anyone controlling the browser can change that data. It is
  a product demonstration, not trusted authentication or authorization.
- **Authenticated mode:** Supabase Auth establishes the identity and Postgres
  Row Level Security limits data access to that identity. The provided SQL
  migration must be reviewed and applied before enabling this mode.

The current build contains a Supabase project URL and publishable browser key.
The database must keep anonymous table access revoked and RLS enforced.
Fresh seeded showcase users have no usable passwords on deployed or
authenticated copies. A local file or localhost copy provides the development
owner `_kaiserr_` for local testing and can migrate an existing stored owner
credential; this does not apply to authenticated deployments.

## Implemented controls

1. User-authored fields are normalized to strict type and length limits and are
   escaped before insertion into generated markup.
2. Persisted collections are schema-normalized, de-duplicated where applicable,
   and capped before use.
3. Avatar uploads accept only PNG, JPEG, or WebP files up to 1 MB, reject
   excessive dimensions, and are center-cropped to a 256-pixel WebP image.
   Remote avatar URLs use an HTTPS host allowlist.
4. The default document has no inline event handlers or remote executable
   script. The Supabase SDK is loaded lazily at an exact version with
   Subresource Integrity after valid metadata is detected.
5. The Content Security Policy restricts scripts, connections, images, forms,
   base URLs, and plugins. `_headers` configures response headers on compatible
   hosts; `vercel.json` carries the corresponding security headers on Vercel.
6. Cloud profile writes exclude email, password hashes, roles, and ban state.
   Queries select named fields and only run for an authenticated user.
7. `supabase/security_hardening.sql` revokes anonymous table access, forces RLS,
   restricts profile/account rows to their owner, restricts friendships to
   participants, requires real profile IDs for new friendship rows, and exposes
   only a limited exact-name profile lookup RPC.
8. `supabase/account_administration.sql` keeps role and ban changes behind
   server-side hierarchy checks, serializes reviewed changes, and stores a
   bounded audit trail with the actor and reason.
9. Authentication errors are generic, password reset does not reveal whether
   an account exists, local passwords require at least 10 characters, and
   sign-out stops session timers.
10. Username-only registration runs in `username-auth` Edge Function. It keeps
    the service-role key server-side, uses Supabase Auth to hash passwords and
    issue sessions, and calls a lookup RPC executable only by `service_role`.
    A case-insensitive unique index prevents duplicate display usernames.
11. Security and build invariants are regression-tested by `pnpm test`; ESLint
   forbids dynamic code execution.
12. `supabase/account_moderation.sql` applies server-side name rules and stores
    uploaded avatars in a private review queue. Admin decisions and owner profile
    edits are audited without storing image bytes in history.
13. The `admin-password` Edge Function verifies the caller's JWT, asks a database
    function to recheck role hierarchy and record the attempt, and uses the
    server-only service key to update Auth. Passwords are never audited.
14. `supabase/automated_moderation.sql` revokes direct idea submission. The
    `moderate-content` Edge Function verifies the session, sends text and queued
    avatars to the moderation API, and records decisions without image bytes.
    Flagged ideas are rejected; safe ideas publish immediately. Image review
    remains private and pending if the service is unavailable.

## Production checklist

Before enabling Supabase in production:

1. Apply `supabase/security_hardening.sql` and
   `supabase/account_administration.sql`, then `supabase/account_moderation.sql`
   and `supabase/automated_moderation.sql` after the community migration
   to a staging project and confirm their
   column names and types match the live schema.
2. Test reads, inserts, updates, and deletes as anonymous, authenticated owner,
   unrelated authenticated user, and friendship participant.
3. Keep role assignment, bans, moderation, and all administrative actions in a
   trusted server or reviewed `SECURITY DEFINER` function that verifies the
   caller. Never authorize from a client-supplied role.
4. Inject only the project URL and public publishable key. Never ship a Supabase
   service-role key, database password, OAuth client secret, or private API key.
   Set `OPENAI_API_KEY` only in Supabase Edge Function secrets and deploy
   `moderate-content` before publishing the frontend that calls it.
5. Set the production Auth site URL and exact redirect allowlist. Restrict OAuth
   providers and enable suitable abuse controls in Supabase.
   Update `allowedOrigins` in the Edge Function before hosting away from
   `http://localhost:5500`.
   Deploy `admin-password` with JWT verification enabled and the same allowed
   origins as the site.
   Redeploy `username-auth` so server-side registration uses the name filter.
6. Check the deployed response headers. Vercel reads `vercel.json`; hosts that
   support `_headers` use that file. GitHub Pages does not apply either file,
   so the HTML meta CSP is the available page-level fallback there.
7. Run `pnpm install --frozen-lockfile`, `pnpm audit`, and `pnpm check` from a
   clean checkout before deployment.

## Residual limitations

- Local demo identities, roles, bans, moderation, and SHA-256 password hashes
  remain editable by the device owner. Do not use a real password in demo mode.
- Username-only accounts have no email recovery. The public registration
  endpoint needs abuse monitoring and rate limits before broad release.
- The optional database migration cannot be proven against a live schema from
  this repository alone; staging verification is required.
- Automated classification can miss unsafe material or reject acceptable
  material. Staff can review avatar decisions; retain an appeal route for ideas.
- Uploaded cloud avatars are sent to OpenAI's Moderation API for screening.
  Tell players about this processing in the site's privacy notice.
- Changing a password does not immediately invalidate existing access-token
  JWTs. Review the project's session lifetime and sign-out policy separately.
- The CSP still permits inline styles because the current UI uses many inline
  style declarations. Migrating those declarations to classes would allow the
  removal of `style-src 'unsafe-inline'`.
- Font Awesome, Minotar, and optional avatar/Supabase providers
  receive ordinary network metadata when requested. Self-host them if that
  privacy tradeoff is unacceptable.
- Browser-only controls cannot protect a compromised hosting origin, malicious
  dependency release, browser extension, or end-user device.

## Reporting a vulnerability

Report suspected vulnerabilities privately to the project owner. Include the
affected route or component, reproduction steps, impact, and any proof of
concept that does not access other users' data. Do not test against systems or
accounts you do not own or have explicit permission to assess.
