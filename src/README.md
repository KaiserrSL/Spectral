# Source map

Edit files inside `src/`. The root files `boot.js`, `index.html`, `style.css`,
and `script.js` are generated compatibility outputs and should not be edited by
hand.

Run `pnpm compose` after editing fragments. `pnpm build` composes sources and
regenerates the minified production assets. `pnpm check` verifies source sync,
lint, tests, and a complete production build.

## HTML

- `00-document-shell.html` — document head, policy metadata, loaders, backdrop.
- `10-navigation.html` — primary navigation and opening `<main>` element.
- `20-home.html` through `70-support.html` — one file per main site section.
- `80-footer.html` — footer.
- `90-account-dashboard.html` — authentication, profile, roles, and admin UI.
- `99-dialogs-and-scripts.html` — remaining dialogs and closing document tags.

## CSS

CSS files are ordered cascade layers. Numeric prefixes are significant; later
files intentionally refine earlier implementations.

- `00`–`60` — foundation and original component styling.
- `70`–`86` — product redesigns, responsive behavior, and performance work.
- `90`–`93` — section compositions and layout corrections.
- `100`–`128` — roles, account cockpit, shared materials, and the account hub.

Update the latest applicable layer unless an earlier rule is the shared base.

## JavaScript

JavaScript fragments are concatenated into one classic script to preserve their
existing dependency order.

- `boot-performance.js` — pre-render lightweight/reduced-motion detector.
- `00`–`10` — particles and general page interactions.
- `20`–`30` — storage, optional cloud integration, and user data models.
- `40`–`50` — rendering and friendships.
- `60`–`78` — dashboard, authentication, profile, roles, account hub, and cloud community actions.
- `80` — local administration demo.
- `90` — dialogs, updates, and forum.
- `99` — startup and initial rendering.

The prefix order is a dependency contract. Update
`tools/source-manifest.mjs` deliberately if it must change.
