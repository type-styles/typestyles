# @examples/typewind (Typewind)

**Typewind** is a small example that recreates a **Tailwind-style utility workflow** using [typestyles](https://github.com/dbanksdesign/typestyles) only—no Tailwind CSS, PostCSS plugin, or JIT compiler.

Utilities are plain `styles.class('utility-name', { … })` calls. Class names match familiar Tailwind strings (`flex`, `gap-4`, `text-slate-600`, …). Spacing and palette values live in `tokens.create` so you can override them with `tokens.createTheme` (see the light/dark toggle in the demo).

## Run

From the monorepo root:

```bash
pnpm typewind dev
```

Or from this package:

```bash
pnpm dev
```

Production build:

```bash
pnpm build
pnpm preview
```

CSS is extracted via `@typestyles/vite` into `typestyles.css` (see `vite.config.ts` and `src/typestyles-entry.ts`).

## Layout

| Path | Purpose |
| --- | --- |
| `src/typewind/theme.ts` | Spacing + slate + brand tokens, `darkShell` theme, global `body` reset |
| `src/typewind/utilities.ts` | Atomic utility registrations (re-exported as `u` from `index.ts`) |
| `src/typewind/cn.ts` | `cn()` to join class strings |
| `src/typewind/index.ts` | `cn`, theme tokens, `darkShell`, and `u` (namespace of all utilities) |
| `src/App.tsx` | Demo UI |
| `src/typestyles-entry.ts` | Side-effect imports for CSS extraction |

Import from the barrel; utilities are grouped as `u`:

```ts
import { cn, darkShell, u } from './typewind';

className={cn(u.flex, u.p4, u.textSm)}
```

## Extending

- Add a line per utility: `export const myUtil = styles.class('my-util', { … })`.
- Prefer `var(--namespace-key)` via `tokens.create` / `tokens.use` for values you want to theme.
- For large scales (every `p-*` step), generate objects in a loop and call `styles.class` in a loop instead of hand-writing each export.

This is a **pedagogical subset**, not a full Tailwind parity layer.
