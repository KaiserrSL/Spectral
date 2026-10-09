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
   base URLs, and plugins. `_headers` adds clickjacking, MIME-sniffing, referrer,
   permissions, cross-origin opener, HSTS, and cache controls on compatible
   hosts.
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

## Production checklist

Before enabling Supabase in production:

1. Apply `supabase/security_hardening.sql` and
   `supabase/account_administration.sql` to a staging project and confirm their
   column names and types match the live schema.
2. Test reads, inserts, updates, and deletes as anonymous, authenticated owner,
   unrelated authenticated user, and friendship participant.
3. Keep role assignment, bans, moderation, and all administrative actions in a
   trusted server or reviewed `SECURITY DEFINER` function that verifies the
   caller. Never authorize from a client-supplied role.
4. Inject only the project URL and public publishable key. Never ship a Supabase
   service-role key, database password, OAuth client secret, or private API key.
5. Set the production Auth site URL and exact redirect allowlist. Restrict OAuth
   providers and enable suitable abuse controls in Supabase.
   Update `allowedOrigins` in the Edge Function before hosting away from
   `http://localhost:5500`.
6. Ensure the hosting platform applies `_headers`, or translate those headers
   into that platform's configuration.
7. Run `pnpm install --frozen-lockfile`, `pnpm audit`, and `pnpm check` from a
   clean checkout before deployment.

## Residual limitations

- Local demo identities, roles, bans, moderation, and SHA-256 password hashes
  remain editable by the device owner. Do not use a real password in demo mode.
- Username-only accounts have no email recovery. The public registration
  endpoint needs abuse monitoring and rate limits before broad release.
- The optional database migration cannot be proven against a live schema from
  this repository alone; staging verification is required.
- The CSP still permits inline styles because the current UI uses many inline
  style declarations. Migrating those declarations to classes would allow the
  removal of `style-src 'unsafe-inline'`.
- Google Fonts, Font Awesome, Minotar, and optional avatar/Supabase providers
  receive ordinary network metadata when requested. Self-host them if that
  privacy tradeoff is unacceptable.
- Browser-only controls cannot protect a compromised hosting origin, malicious
  dependency release, browser extension, or end-user device.

## Reporting a vulnerability

Report suspected vulnerabilities privately to the project owner. Include the
affected route or component, reproduction steps, impact, and any proof of
concept that does not access other users' data. Do not test against systems or
accounts you do not own or have explicit permission to assess.
