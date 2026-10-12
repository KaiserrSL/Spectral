<div align="center">
  <img src="Icon-256.webp" alt="Spectral Launcher" width="96" height="96">

  # Spectral Launcher — Website

  Landing page and community hub for **Spectral**, a desktop Minecraft launcher built with Qt 6 and C++17.

  <em>Vanilla HTML / CSS / JavaScript · Supabase Auth and profile sync</em>
</div>

## Overview

This repository contains the marketing and community website for Spectral. It
is a responsive single-page application with animated product visuals, account
and Minecraft-profile demos, release notes, and a community ideas board.

The browser runtime stays framework-free. Editable source fragments live in
[`src/`](src/README.md); the build composes compatibility files and creates the
minified assets loaded by `index.html`.

## Highlights

- Home, Accounts, Updates, Development, Features, and Support routes.
- Dark and light themes, responsive layouts, and keyboard-accessible dialogs.
- Reduced-motion support plus an automatic lightweight rendering mode.
- Local demo accounts with Minecraft profiles, roles, friends, and forum data.
- Supabase Auth sync, restricted to the authenticated user's data by
  Row Level Security policies.
- Strict input limits, output escaping, avatar validation and resizing, a
  Content Security Policy, and deployable security headers.

## Tech stack

| Area | Choice |
| --- | --- |
| Markup | Semantic HTML5 |
| Styling | Hand-written CSS and custom properties |
| Logic | Vanilla JavaScript, no runtime framework |
| Backend | Supabase Auth and Postgres with RLS |
| Build | pnpm, Lightning CSS, and Terser |
| Quality | ESLint and Node's built-in test runner |

## Project structure

```text
.
├── src/                         # Editable HTML, CSS, and JavaScript fragments
├── tests/                       # Static security and build-contract tests
├── tools/                       # Source manifest and composition builder
├── supabase/                    # Optional RLS/database migrations
├── _headers                     # Security and cache headers for compatible hosts
├── boot.js / boot.min.js        # Generated pre-render performance detector
├── index.html                   # Generated compatibility markup
├── style.css / style.min.css    # Generated development/production styles
└── script.js / script.min.js    # Generated development/production logic
```

Edit the files under `src/`, not the generated root entry points.

## Local development

```bash
pnpm install --frozen-lockfile
pnpm build
python -m http.server 5500 --bind localhost
```

Open <http://localhost:5500>. This origin is configured as the Supabase Auth
site URL. The app also works from a static host after adding that host to the
Supabase Auth redirect allowlist and running the build.

Useful commands:

```bash
pnpm compose       # regenerate unminified root files
pnpm build         # compose and minify production assets
pnpm lint          # JavaScript safety and correctness rules
pnpm test          # security, accessibility-contract, and build tests
pnpm check         # source sync, lint, tests, and production build
```

## Account modes

The current build uses Supabase Auth for site accounts. Email sign-up remains
available. For username-only sign-up, the `username-auth` Edge Function creates
an Auth identity with an internal, confirmed address. The address is never
shown as a contact email, and password recovery is unavailable until a real
email is added through a future account-linking flow. The database trigger in
`supabase/auth_profile_registration.sql` creates its `site_users` profile.
An authenticated session loads that profile and the owner's related data.
Existing browser-only accounts are separate legacy demo data; they are not
automatically converted to Auth identities.

The website saves uploaded avatars in the authenticated owner's `site_users.avatar`
field and Minecraft profile metadata in `mc_accounts`. Adding, selecting,
favoriting, or deleting a Minecraft profile now waits for Supabase to confirm
the resulting rows before the browser cache is updated. The account's Supabase
Auth ID is the `mc_accounts.user_id`; the launcher can read these same rows after
its own authenticated integration is added. These rows contain profile names,
types, UUIDs, favorites, and the selected profile, not Minecraft or Microsoft
credentials. An Ely.by or Microsoft session must be authorized separately in
the launcher before it can be used to start the game.

The live `friendships` table has historical rows whose users no longer exist.
`supabase/friendships_integrity.sql` adds foreign keys and a distinct-user check
for new rows without deleting that history. Reconcile the old rows before
validating the constraints.

The current Supabase project also has the account administration and community
RPC migrations. Idea submissions wait for a moderator to approve them; assign
staff roles only to a verified owner identity through a trusted database action.
The developer identity `_Kaiserr_` is linked to the existing Google Auth user;
use **Continue with Google** for that account. The old `su_dev` demo record
remains as `legacy_kaiserr_` without staff permissions.

If the Supabase metadata is removed for another build, the app runs as a local
demo. Local roles and moderation controls are not an authorization boundary;
a device owner can change browser-held state.

The Roles screen previews prices and saves a launch plan in this browser. It
does not charge a customer or grant a role. Live purchases require a payment
provider, server-side order verification, and a trusted role update.

For real accounts, use Supabase Auth. Do not repurpose local username/password
records as cloud identities.

## Supabase configuration

The current source contains this project's URL and **publishable** key, which
are public client identifiers. To connect a different project:

1. Apply and review `supabase/security_hardening.sql` and
   `supabase/auth_profile_registration.sql` against its schema. Apply the
   administration and community migrations if those features are used. Apply
   `supabase/username_auth.sql` before deploying
   `supabase/functions/username-auth/index.ts`. The function must allow calls
   without a legacy JWT because registration starts before a session exists.
   Keep its service-role key only in the Edge Function runtime.
2. Replace the metadata before `boot.min.js`:

   ```html
   <meta name="spectral-supabase-url" content="https://YOUR_PROJECT.supabase.co">
   <meta name="spectral-supabase-publishable-key" content="YOUR_PUBLIC_PUBLISHABLE_KEY">
   ```

3. Set the Supabase Auth Site URL to `https://kaiserrsl.github.io/Spectral/`.
   Add that URL and `https://spectral-eight.vercel.app/` as OAuth redirect URLs.
   The `username-auth` CORS allowlist includes their exact origins and the
   `null` origin used by a locally opened `file://` page. Google sign-in and
   email recovery still require an HTTP(S) page. Origins do not include paths
   such as `/Spectral/`. Redeploy the function after changes:
   `supabase functions deploy username-auth --project-ref iliokfdcwdcnyjfwmbie --no-verify-jwt`.
4. Test with at least two accounts to verify row isolation, friendship
   participant policies, role hierarchy checks, reviewed admin actions,
   community approval and voting, and audit history before production.

The refreshed Admin workspace loads account snapshots from the server, applies
reviewed role and restriction changes through server RPCs, and moderates forum
ideas through the community RPCs. Its directory shows up to 250 recent accounts
per snapshot. The Refresh data control reloads users, ideas, and staff activity.
If the migrations or connection are unavailable, the cloud workspace shows a
connection error rather than presenting local sample accounts as server data.

The browser publishable key is a public identifier, not a server secret. Security
comes from Supabase Auth, restrictive RLS, and server-controlled role changes.
Never expose a service-role key in this page.

## Performance and accessibility

The small `boot.min.js` detector runs before rendering. It respects
`prefers-reduced-motion` and can enable lightweight mode for limited devices or
data-saving connections. Lightweight mode disables particle rendering, heavy
blur, continuous animation, parallax, and other nonessential effects. Users can
change the mode at any time.

The interface includes skip navigation, visible focus treatment, labeled form
controls, live error/status regions, dialog focus management, reduced-motion
fallbacks, and responsive layouts down to 320 CSS pixels.

## Security

See [SECURITY.md](SECURITY.md) for the trust model, production checklist,
residual limitations, and responsible-disclosure guidance.

## Contributing

- Keep the browser runtime framework-free.
- Preserve the numeric source-fragment ordering contract.
- Escape user-controlled strings before inserting HTML.
- Test dark/light and full/lightweight modes at mobile and desktop sizes.
- Run `pnpm check` and commit regenerated production assets with source changes.

Spectral Launcher is not affiliated with Mojang or Microsoft. Minecraft is a
trademark of Mojang AB.
