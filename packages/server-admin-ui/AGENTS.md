# Server Admin UI (packages/server-admin-ui)

React 19 + TypeScript admin web app, built on Bootstrap 5.3 (via
react-bootstrap) with Vite, Zustand for state, and Vitest + Testing Library
for tests. This file covers conventions specific to this package; see the
repo-root `AGENTS.md` for general code quality, testing, and PR conventions,
which apply here too.

## Styling

Built on Bootstrap 5.3 as the foundation for essentially all UI, not just a
CSS reset. See `STYLING.md` for the full governance rationale (Sass
variables vs. CSS custom properties, why raw colors break light/dark/auto
theming, Stylelint rule-by-rule reasoning). The short version:

- **Don't build a bespoke component or write custom CSS if a Bootstrap
  component or utility already does the job.** Check
  [Bootstrap's docs](https://getbootstrap.com/docs/5.3/) first.
- **For anything that needs a themed color, prefer in this order:**
  1. A Bootstrap component prop that already carries the right color for
     free — `<Button variant="danger">`, `<Badge bg="success">`.
  2. A Bootstrap utility class on a plain element — `className="text-danger"`,
     `"bg-body-tertiary"`.
  3. `style={{ color: 'var(--bs-*)' }}`, only when neither of the above is
     available — e.g. RJSF-owned markup with no class hook, or SVG
     `fill`/`stroke` attributes (utility classes only set `color`, not
     `fill`/`stroke`).
  Never a raw hex code or CSS named color, anywhere outside
  `_bootstrap-variables.scss`.
- Plugin config forms are rendered by RJSF (`@rjsf/core`), which owns its
  own markup — you cannot attach a Bootstrap class to it. Reference the
  equivalent Bootstrap CSS variable directly in a custom selector instead
  (see the RJSF overrides in `_custom.scss` for the existing pattern).

## Linting

Two linters cover two different file domains — not redundant, and both
need to pass:

- **ESLint** governs `.ts`/`.tsx`, including a custom `no-restricted-syntax`
  rule that bans raw hex/named color string literals — this is what catches
  colors inside inline `style={{}}` objects and SVG props, which Stylelint
  cannot see.
- **Stylelint** governs `.scss`/`.css` (`color-no-hex`, `color-named`, and
  related rules — see `STYLING.md`).

The default script name means something different per tool, so check before
running: `npm run lint` **autofixes** (`eslint --fix`) — use `npm run
lint:check` for a check-only run with correct CI exit codes. `npm run
lint:css` is already **check-only**; `npm run lint:css:fix` is the autofix
form.

## Testing

Vitest + Testing Library. Tests colocate as `*.test.ts`/`*.test.tsx` next to
the file under test (e.g. `src/store/historyProviderSelectors.test.ts`), not
in a separate `__tests__` directory.

## State

Zustand store in `src/store`, split into slices under `src/store/slices`.
Prefer adding to or composing existing slices over introducing a new
top-level store.

## React Compiler

React Compiler is enabled at `warn` level. Avoid patterns it flags — e.g.
calling a state setter synchronously inside `useEffect` without a mount
guard — rather than suppressing the warning.
